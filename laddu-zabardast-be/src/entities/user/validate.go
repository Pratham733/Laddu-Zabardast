package user

import (
	"errors"
	"regexp"
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

var profilePhonePattern = regexp.MustCompile(`^\+?[0-9]{10,15}$`)

func validateUpdateProfileReq(req UpdateProfileRequestPacket) (bson.M, error) {
	updates := bson.M{}
	if strings.TrimSpace(req.FirstName) != "" {
		updates["firstName"] = strings.TrimSpace(req.FirstName)
	}
	if strings.TrimSpace(req.LastName) != "" {
		updates["lastName"] = strings.TrimSpace(req.LastName)
	}
	if req.Phone != nil {
		phone := strings.TrimSpace(*req.Phone)
		if phone != "" && !profilePhonePattern.MatchString(phone) {
			return nil, errors.New("phone must contain 10 to 15 digits, optionally prefixed by +")
		}
		updates["phone"] = phone
	}

	if len(updates) == 0 {
		return nil, errors.New("no fields to update")
	}

	return updates, nil
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
