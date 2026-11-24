package user

import "encoding/json"

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

type AddressRequest = AddressRequestPacket
type AddressResponse = AddressResponsePacket

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

type UserResponsePacket struct {
	GoogleConnected bool                    `json:"googleConnected"`
	PasswordLogin   bool                    `json:"passwordLogin"`
	ID              string                  `json:"id"`
	UserID          string                  `json:"userId"`
	FirstName       string                  `json:"firstName"`
	LastName        string                  `json:"lastName"`
	Email           string                  `json:"email"`
	Phone           *string                 `json:"phone"`
	Role            *string                 `json:"role"`
	IsAdmin         bool                    `json:"isAdmin"`
	PhotoURL        *string                 `json:"photoURL"`
	Picture         *string                 `json:"picture"`
	Addresses       []AddressResponsePacket `json:"addresses"`
	CreatedAt       string                  `json:"createdAt,omitempty"`
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

type AddressMutationResponse struct {
	Message   string                  `json:"message"`
	AddressID string                  `json:"addressId"`
	Addresses []AddressResponsePacket `json:"addresses"`
}

type UpdateProfileRequestPacket struct {
	FirstName string  `json:"firstName,omitempty" bson:"firstName,omitempty"`
	LastName  string  `json:"lastName,omitempty" bson:"lastName,omitempty"`
	Phone     *string `json:"phone,omitempty" bson:"phone,omitempty"`
}

type UpdateProfileRequest = UpdateProfileRequestPacket

type ChangePasswordRequestPacket struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type ChangePasswordRequest = ChangePasswordRequestPacket

type CreateUserRequestPacket struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Phone     string `json:"phone,omitempty"`
	Role      string `json:"role,omitempty"`
}

type CreateUserRequest = CreateUserRequestPacket

type UpdateUserRequestPacket struct {
	FirstName string `json:"firstName,omitempty"`
	LastName  string `json:"lastName,omitempty"`
	Email     string `json:"email,omitempty"`
	Phone     string `json:"phone,omitempty"`
	Role      string `json:"role,omitempty"`
}

type UpdateUserRequest = UpdateUserRequestPacket

type GetUsersResponsePacket struct {
	Users   []UserPacket `json:"users"`
	Message string       `json:"message,omitempty"`
}

type GetUserResponsePacket struct {
	User    UserResponsePacket `json:"user"`
	Message string             `json:"message,omitempty"`
}

type CreateUserResponsePacket struct {
	User    UserPacket `json:"user"`
	Message string     `json:"message,omitempty"`
}

type UpdateUserResponsePacket struct {
	User    UserPacket `json:"user"`
	Message string     `json:"message,omitempty"`
}

type UpdateProfileResponsePacket struct {
	User    UserResponsePacket `json:"user"`
	Message string             `json:"message,omitempty"`
}

type GetAddressesResponsePacket struct {
	Addresses []AddressResponsePacket `json:"addresses"`
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

func ModelAddressesToPacket(addrs []Address) []AddressResponsePacket {
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

func UserToPacket(u User) UserPacket {
	addrs := make([]AddressPacket, 0, len(u.Addresses))
	for _, a := range u.Addresses {
		addrs = append(addrs, AddressModelToPacket(a))
	}

	return UserPacket{
		ID:        u.ID,
		UserID:    u.ID,
		MongoID:   u.ID,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Email:     u.Email,
		Phone:     u.Phone,
		Role:      u.EffectiveRole(),
		IsAdmin:   u.IsAdmin(),
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
