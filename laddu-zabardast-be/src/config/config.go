package config

import (
	"fmt"
	"net/url"
	"os"
	"strings"
)

type Config struct {
	Production  bool
	UploadDir   string
	Credentials Credentials
	Routes      []string
	MasterMongo MongoConfig
	Auth        AuthConfig
}

type MongoConfig struct {
	Host     string
	Database string
}

type AuthConfig struct {
	JWTSecret string
}

type Credentials struct {
	AdminEmail string
}

var AppConfig Config

// LoadConfig uses the environment provided by the debugger, shell, or host.
func LoadConfig() error {
	cfg := Config{
		Production: os.Getenv("APP_ENV") == "production",
		UploadDir:  uploadDirectory(),
		MasterMongo: MongoConfig{
			Host:     strings.TrimSpace(os.Getenv("MONGODB_URI")),
			Database: strings.TrimSpace(os.Getenv("MONGODB_DATABASE")),
		},
		Auth: AuthConfig{JWTSecret: os.Getenv("JWT_SECRET")},
	}
	if cfg.MasterMongo.Host == "" || cfg.MasterMongo.Database == "" || strings.TrimSpace(cfg.Auth.JWTSecret) == "" {
		return fmt.Errorf("set MONGODB_URI, MONGODB_DATABASE, and JWT_SECRET in the backend environment")
	}
	if cfg.Production && len(strings.TrimSpace(cfg.Auth.JWTSecret)) < 32 {
		return fmt.Errorf("production requires a JWT_SECRET of at least 32 bytes")
	}
	for _, origin := range strings.Split(os.Getenv("CORS_ORIGINS"), ",") {
		origin = strings.TrimSpace(origin)
		if cfg.Production {
			u, err := url.Parse(origin)
			if err != nil || u.Scheme != "https" || u.Hostname() == "" || u.User != nil ||
				u.Path != "" || u.ForceQuery || u.RawQuery != "" || u.Fragment != "" {
				return fmt.Errorf("production CORS_ORIGINS must list HTTPS origins without paths")
			}
		}
		if origin != "" {
			cfg.Routes = append(cfg.Routes, origin)
		}
	}
	if !cfg.Production {
		cfg.Credentials.AdminEmail = strings.TrimSpace(os.Getenv("LOCAL_ADMIN_EMAIL"))
	}
	AppConfig = cfg
	return nil
}

func uploadDirectory() string {
	if dir := strings.TrimSpace(os.Getenv("UPLOAD_DIR")); dir != "" {
		return dir
	}
	return "public/uploads"
}
