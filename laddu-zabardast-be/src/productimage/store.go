// Package productimage stores optimized public catalog images.
package productimage

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/signer/v4"
)

const objectPrefix = "products/"

type Store interface {
	Put(ctx context.Context, filename, contentType string, data []byte) (string, error)
}

func FromEnvironment(uploadDir string) (Store, error) {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("IMAGE_STORAGE"))) {
	case "", "local":
		return diskStore{dir: uploadDir}, nil
	case "r2":
		return r2FromEnvironment()
	default:
		return nil, fmt.Errorf("IMAGE_STORAGE must be local or r2")
	}
}

type diskStore struct {
	dir string
}

func (s diskStore) Put(ctx context.Context, filename, _ string, data []byte) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	path := filepath.Join(s.dir, filename)
	if err := os.WriteFile(path, data, 0644); err != nil {
		_ = os.Remove(path)
		return "", err
	}
	return "/uploads/" + filename, nil
}

type r2Store struct {
	endpoint, bucket, publicOrigin string
	credentials                    aws.Credentials
	signer                         *v4.Signer
	client                         *http.Client
}

var (
	accountPattern = regexp.MustCompile(`^[0-9a-f]{32}$`)
	bucketPattern  = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$`)
)

func r2FromEnvironment() (Store, error) {
	account := strings.TrimSpace(os.Getenv("R2_ACCOUNT_ID"))
	bucket := strings.TrimSpace(os.Getenv("R2_BUCKET"))
	origin := strings.TrimRight(strings.TrimSpace(os.Getenv("R2_PUBLIC_BASE_URL")), "/")
	accessKey := strings.TrimSpace(os.Getenv("R2_ACCESS_KEY_ID"))
	secretKey := strings.TrimSpace(os.Getenv("R2_SECRET_ACCESS_KEY"))
	if !accountPattern.MatchString(account) || !bucketPattern.MatchString(bucket) || accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("r2 requires a valid R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY")
	}
	publicURL, err := url.Parse(origin)
	if err != nil || publicURL.Scheme != "https" || publicURL.Hostname() == "" || publicURL.User != nil ||
		publicURL.Path != "" || publicURL.ForceQuery || publicURL.RawQuery != "" || publicURL.Fragment != "" {
		return nil, fmt.Errorf("R2_PUBLIC_BASE_URL must be the HTTPS image origin without a path")
	}
	return &r2Store{
		endpoint: "https://" + account + ".r2.cloudflarestorage.com", bucket: bucket, publicOrigin: origin,
		credentials: aws.Credentials{AccessKeyID: accessKey, SecretAccessKey: secretKey},
		signer:      v4.NewSigner(),
		client: &http.Client{
			Timeout: 15 * time.Second,
			CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
	}, nil
}

func (s *r2Store) Put(ctx context.Context, filename, contentType string, data []byte) (string, error) {
	key := objectPrefix + url.PathEscape(filename)
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, s.endpoint+"/"+s.bucket+"/"+key, bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Cache-Control", "public, max-age=31536000, immutable")
	checksum := sha256.Sum256(data)
	payloadHash := hex.EncodeToString(checksum[:])
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)
	if err := s.signer.SignHTTP(ctx, s.credentials, req, payloadHash, "s3", "auto", time.Now()); err != nil {
		return "", err
	}
	res, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("R2 image upload returned HTTP %d", res.StatusCode)
	}
	return s.publicOrigin + "/" + key, nil
}
