package auth

import (
	"errors"
	"strings"
)

func validateSignupReq(req SignupRequestPacket) error {
	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" ||
		strings.TrimSpace(req.FirstName) == "" || strings.TrimSpace(req.LastName) == "" {
		return errors.New("missing required fields")
	}

	return nil
}

func validateLoginReq(req LoginRequestPacket) error {
	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" {
		return errors.New("missing email or password")
	}

	return nil
}
