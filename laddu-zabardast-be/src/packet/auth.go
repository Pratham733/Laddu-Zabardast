package packet

import "encoding/json"

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
