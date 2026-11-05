package user

import (
	"errors"
	"strings"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func validateUserId(id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("user ID required")
	}
	return nil
}

func validateCreateAppUserReq(req CreateUserRequestPacket) error {
	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" ||
		strings.TrimSpace(req.FirstName) == "" || strings.TrimSpace(req.LastName) == "" {
		return errors.New("missing required fields")
	}
	return nil
}

func validateUpdateAppUserReq(id string, req UpdateUserRequestPacket) (bson.M, error) {
	if err := validateUserId(id); err != nil {
		return nil, err
	}

	updates := bson.M{}
	if req.FirstName != "" {
		updates["firstName"] = strings.TrimSpace(req.FirstName)
	}
	if req.LastName != "" {
		updates["lastName"] = strings.TrimSpace(req.LastName)
	}
	if req.Email != "" {
		updates["email"] = strings.TrimSpace(req.Email)
	}
	if req.Phone != "" {
		updates["phone"] = strings.TrimSpace(req.Phone)
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}

	if len(updates) == 0 {
		return nil, errors.New("no fields to update")
	}

	return updates, nil
}
