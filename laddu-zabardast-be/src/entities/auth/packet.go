package auth

import (
	"encoding/json"

	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
)

type SignupRequestPacket struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type LoginRequestPacket struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AddressResponsePacket struct {
	ID         string `json:"id,omitempty"`
	Label      string `json:"label,omitempty"`
	Street     string `json:"street"`
	City       string `json:"city"`
	State      string `json:"state"`
	Country    string `json:"country"`
	PostalCode string `json:"postalCode"`
	IsDefault  bool   `json:"isDefault"`
}

func (a AddressResponsePacket) MarshalJSON() ([]byte, error) {
	type Alias AddressResponsePacket
	return json.Marshal(&struct {
		Alias
		ID      string `json:"id,omitempty"`
		MongoID string `json:"_id,omitempty"`
	}{
		Alias:   (Alias)(a),
		ID:      a.ID,
		MongoID: a.ID,
	})
}

type AddressRequestPacket struct {
	ID         string `json:"id,omitempty"`
	Label      string `json:"label,omitempty"`
	Street     string `json:"street"`
	City       string `json:"city"`
	State      string `json:"state"`
	Country    string `json:"country"`
	PostalCode string `json:"postalCode"`
	IsDefault  bool   `json:"isDefault"`
}

type UserResponsePacket struct {
	ID        string                  `json:"id"`
	UserID    string                  `json:"userId"`
	FirstName string                  `json:"firstName"`
	LastName  string                  `json:"lastName"`
	Email     string                  `json:"email"`
	Phone     *string                 `json:"phone"`
	Role      *string                 `json:"role"`
	IsAdmin   bool                    `json:"isAdmin"`
	PhotoURL  *string                 `json:"photoURL"`
	Picture   *string                 `json:"picture"`
	Addresses []AddressResponsePacket `json:"addresses"`
	CreatedAt string                  `json:"createdAt,omitempty"`
}

func (u UserResponsePacket) MarshalJSON() ([]byte, error) {
	type Alias UserResponsePacket
	return json.Marshal(&struct {
		Alias
		ID      string `json:"id"`
		UserID  string `json:"userId"`
		MongoID string `json:"_id"`
	}{
		Alias:   (Alias)(u),
		ID:      u.ID,
		UserID:  u.ID,
		MongoID: u.ID,
	})
}

type UpdateProfileRequestPacket struct {
	FirstName string `json:"firstName,omitempty"`
	LastName  string `json:"lastName,omitempty"`
	Phone     string `json:"phone,omitempty"`
}

type UpdateProfileRequest = UpdateProfileRequestPacket

type ChangePasswordRequestPacket struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type ChangePasswordRequest = ChangePasswordRequestPacket

type AuthResponsePacket struct {
	Token   string             `json:"token"`
	User    UserResponsePacket `json:"user"`
	Message string             `json:"message,omitempty"`
}

type GetUserResponsePacket struct {
	User UserResponsePacket `json:"user"`
}

type UpdateProfileResponsePacket struct {
	User    UserResponsePacket `json:"user"`
	Message string             `json:"message,omitempty"`
}

type GetAddressesResponsePacket struct {
	Addresses []AddressResponsePacket `json:"addresses"`
}

func ModelAddressesToPacket(addrs []user.Address) []AddressResponsePacket {
	if addrs == nil {
		return []AddressResponsePacket{}
	}
	result := make([]AddressResponsePacket, 0, len(addrs))
	for _, a := range addrs {
		result = append(result, AddressResponsePacket{
			ID:         a.ID,
			Label:      a.Label,
			Street:     a.Street,
			City:       a.City,
			State:      a.State,
			Country:    a.Country,
			PostalCode: a.PostalCode,
			IsDefault:  a.IsDefault,
		})
	}
	return result
}

func BuildUserResponse(u user.User) UserResponsePacket {
	var phone *string
	if u.Phone != "" {
		phone = &u.Phone
	}
	var role *string
	if u.Role != "" {
		role = &u.Role
	}
	var photoURL *string
	if u.PhotoURL != "" {
		photoURL = &u.PhotoURL
	}
	var picture *string
	if u.Picture != "" {
		picture = &u.Picture
	}
	isAdmin := u.Role == RoleAdmin || u.Email == AdminEmail

	return UserResponsePacket{
		ID:        u.ID,
		UserID:    u.ID,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Email:     u.Email,
		Phone:     phone,
		Role:      role,
		IsAdmin:   isAdmin,
		PhotoURL:  photoURL,
		Picture:   picture,
		Addresses: ModelAddressesToPacket(u.Addresses),
		CreatedAt: u.CreatedAt,
	}
}
