package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	CredentialsFile string      `json:"credentials_file,omitempty"`
	Credentials     Credentials `json:"-"`
	Routes          []string    `json:"routes" toml:"routes"`
	MasterMongo     MongoConfig `json:"master_mongo" toml:"master_mongo"`
	Auth            AuthConfig  `json:"auth" toml:"auth"`
}

type MongoConfig struct {
	Host     string `json:"host" toml:"host"`
	Database string `json:"database" toml:"database"`
}

type AuthConfig struct {
	JWTSecret string `json:"jwt_secret" toml:"jwt_secret"`
}

var AppConfig Config

// LoadConfig reads an explicitly selected JSON configuration.
func LoadConfig(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open config %q: %w", path, err)
	}
	defer file.Close()

	var cfg Config
	if err := json.NewDecoder(file).Decode(&cfg); err != nil {
		return fmt.Errorf("decode config %q: %w", path, err)
	}
	if strings.TrimSpace(cfg.MasterMongo.Host) == "" || strings.TrimSpace(cfg.Auth.JWTSecret) == "" {
		return fmt.Errorf("config %q requires master_mongo.host and auth.jwt_secret", path)
	}
	if cfg.CredentialsFile != "" {
		credentialsPath := resolveConfigPath(path, cfg.CredentialsFile)
		if err := loadCredentials(credentialsPath, &cfg.Credentials); err != nil {
			return err
		}
	}
	AppConfig = cfg
	return nil
}

type Credentials struct {
	AdminEmail string     `json:"admin_email"`
	SMTPFile   string     `json:"smtp_file,omitempty"`
	SMTP       SMTPConfig `json:"-"`
}

type SMTPConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Security string `json:"security"`
	User     string `json:"user"`
	Password string `json:"password"`
	Sender   string `json:"sender"`
}

func loadCredentials(path string, credentials *Credentials) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("open credentials %q: %w", path, err)
	}
	if err := json.Unmarshal(data, credentials); err != nil {
		return fmt.Errorf("decode credentials %q: %w", path, err)
	}
	if credentials.SMTPFile == "" {
		return nil
	}

	smtpPath := resolveConfigPath(path, credentials.SMTPFile)
	data, err = os.ReadFile(smtpPath)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("open SMTP settings %q: %w", smtpPath, err)
	}
	if err := json.Unmarshal(data, &credentials.SMTP); err != nil {
		return fmt.Errorf("decode SMTP settings %q: %w", smtpPath, err)
	}
	return nil
}

func resolveConfigPath(configPath, value string) string {
	if filepath.IsAbs(value) {
		return value
	}
	return filepath.Join(filepath.Dir(configPath), value)
}
