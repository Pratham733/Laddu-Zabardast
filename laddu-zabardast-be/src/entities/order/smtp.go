package order

import (
	"os"
	"strings"

	"github.com/Pratham733/laddu-zabardast-be/src/config"
)

func orderAdminEmail() string {
	if override := strings.TrimSpace(os.Getenv("ORDER_EMAIL_ADMIN")); override != "" {
		return override
	}
	return strings.TrimSpace(config.AppConfig.Credentials.AdminEmail)
}
