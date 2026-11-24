package config

import (
	"os"
	"strings"
)

type SupportContact struct {
	Email  string   `json:"email"`
	Phones []string `json:"phones"`
}

func StoreSupport() SupportContact {
	email := strings.TrimSpace(os.Getenv("STORE_CONTACT_EMAIL"))
	if email == "" {
		email = "spratham388@gmail.com"
	}
	phones := os.Getenv("STORE_CONTACT_PHONES")
	if strings.TrimSpace(phones) == "" {
		phones = "+918826225551,+919910345551"
	}
	result := SupportContact{Email: email, Phones: []string{}}
	for _, phone := range strings.Split(phones, ",") {
		if value := strings.TrimSpace(phone); value != "" {
			result.Phones = append(result.Phones, value)
		}
	}
	return result
}
