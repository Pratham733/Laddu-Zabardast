package productimage

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/signer/v4"
)

func TestR2PutUsesSignedRequestAndPublicOrigin(t *testing.T) {
	const filename = "sample.jpg"
	const payload = "fixture image bytes"
	const publicURL = "https://images.example.test/products/sample.jpg"
	requests := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		received, err := io.ReadAll(r.Body)
		if err != nil || string(received) != payload || r.Method != http.MethodPut || r.URL.Path != "/store-images/products/sample.jpg" {
			t.Error("unexpected upload request")
		}
		hash := sha256.Sum256([]byte(payload))
		if r.Header.Get("Content-Type") != "image/jpeg" || r.Header.Get("X-Amz-Content-Sha256") != hex.EncodeToString(hash[:]) ||
			!strings.Contains(r.Header.Get("Authorization"), "/auto/s3/aws4_request") ||
			!strings.Contains(r.Header.Get("Cache-Control"), "immutable") {
			t.Error("missing signature, type, or immutable cache policy")
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer requests.Close()

	store := &r2Store{
		endpoint: requests.URL, bucket: "store-images", publicOrigin: "https://images.example.test",
		credentials: aws.Credentials{AccessKeyID: "test-id", SecretAccessKey: "test-secret"},
		client:      requests.Client(), signer: v4.NewSigner(),
	}
	if got, err := store.Put(context.Background(), filename, "image/jpeg", []byte(payload)); err != nil || got != publicURL {
		t.Fatalf("put got URL %q and error %v", got, err)
	}
}

func TestImageStorageEnvironment(t *testing.T) {
	t.Setenv("IMAGE_STORAGE", "local")
	dir := t.TempDir()
	store, err := FromEnvironment(dir)
	if err != nil {
		t.Fatal(err)
	}
	url, err := store.Put(context.Background(), "sample.jpg", "image/jpeg", []byte("fixture"))
	data, readErr := os.ReadFile(filepath.Join(dir, "sample.jpg"))
	if err != nil || readErr != nil || url != "/uploads/sample.jpg" || string(data) != "fixture" {
		t.Fatal("local storage did not write the expected image")
	}
	t.Setenv("IMAGE_STORAGE", "r2")
	t.Setenv("R2_ACCOUNT_ID", "")
	if _, err := FromEnvironment(dir); err == nil {
		t.Fatal("R2 accepted a missing account ID")
	}
}
