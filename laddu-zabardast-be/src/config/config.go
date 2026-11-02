package config

import (
	"os"

	"github.com/pelletier/go-toml/v2"
)

type Config struct {
	Routes      []string    `toml:"routes"`
	MasterMongo MongoConfig `toml:"master_mongo"`
	Auth        AuthConfig  `toml:"auth"`
}

type MongoConfig struct {
	Host     string `toml:"host"`
	Database string `toml:"database"`
}

type AuthConfig struct {
	JWTSecret string `toml:"jwt_secret"`
}

var AppConfig Config

// LoadConfig reads and parses the TOML config file
func LoadConfig(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	return toml.NewDecoder(file).Decode(&AppConfig)
}
