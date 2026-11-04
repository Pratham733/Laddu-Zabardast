package auth

import (
	"encoding/json"

	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
)

type SignupRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AddressResponse struct {
	ID         string `json:"id,omitempty"`
	Label      string `json:"label,omitempty"`
	Street     string `json:"street"`
	City       string `json:"city"`
	State      string `json:"state"`
	Country    string `json:"country"`
	PostalCode string `json:"postalCode"`
	IsDefault  bool   `json:"isDefault"`
}

func (a AddressResponse) MarshalJSON() ([]byte, error) {
	type Alias AddressResponse
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

type AddressRequest struct {
	ID         string `json:"id,omitempty"`
	Label      string `json:"label,omitempty"`
	Street     string `json:"street"`
	City       string `json:"city"`
	State      string `json:"state"`
	Country    string `json:"country"`
	PostalCode string `json:"postalCode"`
	IsDefault  bool   `json:"isDefault"`
}

type UserResponse struct {
	ID        string            `json:"id"`
	UserID    string            `json:"userId"`
	FirstName string            `json:"firstName"`
	LastName  string            `json:"lastName"`
	Email     string            `json:"email"`
	Phone     *string           `json:"phone"`
	Role      *string           `json:"role"`
	IsAdmin   bool              `json:"isAdmin"`
	PhotoURL  *string           `json:"photoURL"`
	Picture   *string           `json:"picture"`
	Addresses []AddressResponse `json:"addresses"`
	CreatedAt string            `json:"createdAt,omitempty"`
}

func (u UserResponse) MarshalJSON() ([]byte, error) {
	type Alias UserResponse
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

type UpdateProfileRequest struct {
	FirstName string `json:"firstName,omitempty"`
	LastName  string `json:"lastName,omitempty"`
	Phone     string `json:"phone,omitempty"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type AuthResponsePacket struct {
	Token   string       `json:"token"`
	User    UserResponse `json:"user"`
	Message string       `json:"message,omitempty"`
}

type GetUserResponsePacket struct {
	User UserResponse `json:"user"`
}

type UpdateProfileResponsePacket struct {
	User    UserResponse `json:"user"`
	Message string       `json:"message,omitempty"`
}

type GetAddressesResponsePacket struct {
	Addresses []AddressResponse `json:"addresses"`
}

func ModelAddressesToPacket(addrs []user.Address) []AddressResponse {
	if addrs == nil {
		return []AddressResponse{}
	}
	result := make([]AddressResponse, 0, len(addrs))
	for _, a := range addrs {
		result = append(result, AddressResponse{
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

func BuildUserResponse(u user.User) UserResponse {
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

	return UserResponse{
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
