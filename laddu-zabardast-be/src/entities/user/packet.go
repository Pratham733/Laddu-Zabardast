package user

import "encoding/json"

// AddressPacket represents an address in request and response payloads.
type AddressPacket struct {
	ID         string `json:"id,omitempty"`
	Label      string `json:"label,omitempty"`
	Street     string `json:"street"`
	City       string `json:"city"`
	State      string `json:"state"`
	Country    string `json:"country"`
	PostalCode string `json:"postalCode"`
	IsDefault  bool   `json:"isDefault"`
}

func (a AddressPacket) MarshalJSON() ([]byte, error) {
	type Alias AddressPacket
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

// UserPacket represents a sanitized user returned in API responses.
type UserPacket struct {
	ID        string          `json:"id"`
	UserID    string          `json:"userId"`
	MongoID   string          `json:"_id"`
	FirstName string          `json:"firstName"`
	LastName  string          `json:"lastName"`
	Email     string          `json:"email"`
	Phone     string          `json:"phone,omitempty"`
	Role      string          `json:"role,omitempty"`
	IsAdmin   bool            `json:"isAdmin"`
	PhotoURL  string          `json:"photoURL,omitempty"`
	Picture   string          `json:"picture,omitempty"`
	Addresses []AddressPacket `json:"addresses,omitempty"`
	CreatedAt string          `json:"createdAt,omitempty"`
}

// CreateUserRequest represents the incoming payload to create a new user.
type CreateUserRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Phone     string `json:"phone,omitempty"`
	Role      string `json:"role,omitempty"`
}

// UpdateUserRequest represents the incoming payload to update a user.
type UpdateUserRequest struct {
	FirstName string `json:"firstName,omitempty"`
	LastName  string `json:"lastName,omitempty"`
	Email     string `json:"email,omitempty"`
	Phone     string `json:"phone,omitempty"`
	Role      string `json:"role,omitempty"`
}

// Conversion functions between Models and Packets

func AddressModelToPacket(a Address) AddressPacket {
	return AddressPacket{
		ID:         a.ID,
		Label:      a.Label,
		Street:     a.Street,
		City:       a.City,
		State:      a.State,
		Country:    a.Country,
		PostalCode: a.PostalCode,
		IsDefault:  a.IsDefault,
	}
}

func AddressPacketToModel(a AddressPacket) Address {
	return Address{
		ID:         a.ID,
		Label:      a.Label,
		Street:     a.Street,
		City:       a.City,
		State:      a.State,
		Country:    a.Country,
		PostalCode: a.PostalCode,
		IsDefault:  a.IsDefault,
	}
}

func UserToPacket(u User) UserPacket {
	addrs := make([]AddressPacket, 0, len(u.Addresses))
	for _, a := range u.Addresses {
		addrs = append(addrs, AddressModelToPacket(a))
	}

	isAdmin := u.Role == RoleAdmin || u.Email == AdminEmail

	return UserPacket{
		ID:        u.ID,
		UserID:    u.ID,
		MongoID:   u.ID,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Email:     u.Email,
		Phone:     u.Phone,
		Role:      u.Role,
		IsAdmin:   isAdmin,
		PhotoURL:  u.PhotoURL,
		Picture:   u.Picture,
		Addresses: addrs,
		CreatedAt: u.CreatedAt,
	}
}

func UsersToPacketList(users []User) []UserPacket {
	result := make([]UserPacket, 0, len(users))
	for _, u := range users {
		result = append(result, UserToPacket(u))
	}
	return result
}
