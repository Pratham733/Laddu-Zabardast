package packet

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
	ID         string `json:"_id,omitempty"`
	Label      string `json:"label"`
	Street     string `json:"street"`
	City       string `json:"city"`
	State      string `json:"state"`
	Country    string `json:"country"`
	PostalCode string `json:"postalCode"`
	IsDefault  bool   `json:"isDefault"`
}

type UserResponse struct {
	ID        string            `json:"_id"`
	FirstName string            `json:"firstName"`
	LastName  string            `json:"lastName"`
	Email     string            `json:"email"`
	Phone     string            `json:"phone,omitempty"`
	Addresses []AddressResponse `json:"addresses,omitempty"`
}

type UpdateProfileRequest struct {
	FirstName string `json:"firstName,omitempty"`
	LastName  string `json:"lastName,omitempty"`
	Phone     string `json:"phone,omitempty"`
}
