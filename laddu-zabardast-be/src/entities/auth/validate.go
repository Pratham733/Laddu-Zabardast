package auth

import (
	"errors"
	"strings"

	"go.mongodb.org/mongo-driver/v2/bson"
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

func validateUpdateProfileReq(req UpdateProfileRequestPacket) error {
	updates := bson.M{}
	if req.FirstName != "" {
		updates["firstName"] = strings.TrimSpace(req.FirstName)
	}
	if req.LastName != "" {
		updates["lastName"] = strings.TrimSpace(req.LastName)
	}
	if req.Phone != "" {
		updates["phone"] = strings.TrimSpace(req.Phone)
	}

	if len(updates) == 0 {
		return errors.New("no fields to update")
	}

	return nil
}

func validateChangePasswordReq(req ChangePasswordRequestPacket) error {
	if strings.TrimSpace(req.CurrentPassword) == "" || strings.TrimSpace(req.NewPassword) == "" {
		return errors.New("passwords required")
	}
	return nil
}

func validateSaveAddressReq(req AddressRequestPacket) error {
	if strings.TrimSpace(req.Street) == "" || strings.TrimSpace(req.City) == "" {
		return errors.New("street and city required")
	}
	return nil
}

func validateAddressId(id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("address ID required")
	}
	return nil
}
