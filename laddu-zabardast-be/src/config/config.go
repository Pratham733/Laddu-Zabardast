package config

import (
	"encoding/json"
	"fmt"
	"os"
)

type Config struct {
	Routes      []string    `json:"routes" toml:"routes"`
	MasterMongo MongoConfig `json:"master_mongo" toml:"master_mongo"`
	Auth        AuthConfig  `json:"auth" toml:"auth"`
}

type MongoConfig struct {
	Host     string `json:"host" toml:"host"`
	Database string `json:"database" toml:"database"`
}

type AuthConfig struct {
	JWTSecret string `json:"jwt_secret" toml:"jwt_secret"`
}

var AppConfig Config

// LoadConfig reads and parses the JSON config file
func LoadConfig(path string) error {
	candidatePaths := []string{
		path,
		path + ".json",
	}

	var file *os.File
	var err error
	var openedPath string

	for _, p := range candidatePaths {
		file, err = os.Open(p)
		if err == nil {
			openedPath = p
			break
		}
	}

	if file == nil {
		return fmt.Errorf("failed to open config file at %s: %w", path, err)
	}
	defer file.Close()

	if err := json.NewDecoder(file).Decode(&AppConfig); err != nil {
		return fmt.Errorf("failed to decode json config at %s: %w", openedPath, err)
	}

	return nil
}
