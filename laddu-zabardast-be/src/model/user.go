package model

import "encoding/json"

type Address struct {
	ID         string `bson:"_id,omitempty" json:"id,omitempty"`
	Label      string `bson:"label,omitempty" json:"label,omitempty"`
	Street     string `bson:"street" json:"street"`
	City       string `bson:"city" json:"city"`
	State      string `bson:"state" json:"state"`
	Country    string `bson:"country" json:"country"`
	PostalCode string `bson:"postalCode" json:"postalCode"`
	IsDefault  bool   `bson:"isDefault" json:"isDefault"`
}

func (a Address) MarshalJSON() ([]byte, error) {
	type Alias Address
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

func (a *Address) UnmarshalJSON(data []byte) error {
	type Alias Address
	aux := &struct {
		ID      string `json:"id"`
		MongoID string `json:"_id"`
		*Alias
	}{
		Alias: (*Alias)(a),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if aux.ID != "" {
		a.ID = aux.ID
	} else if aux.MongoID != "" {
		a.ID = aux.MongoID
	}
	return nil
}

type User struct {
	ID        string    `bson:"_id,omitempty" json:"id"`
	FirstName string    `bson:"firstName" json:"firstName"`
	LastName  string    `bson:"lastName" json:"lastName"`
	Email     string    `bson:"email" json:"email"`
	Password  string    `bson:"password" json:"password"`
	Phone     string    `bson:"phone,omitempty" json:"phone,omitempty"`
	Role      string    `bson:"role,omitempty" json:"role,omitempty"`
	PhotoURL  string    `bson:"photoURL,omitempty" json:"photoURL,omitempty"`
	Picture   string    `bson:"picture,omitempty" json:"picture,omitempty"`
	Addresses []Address `bson:"addresses,omitempty" json:"addresses,omitempty"`
	CreatedAt string    `bson:"createdAt,omitempty" json:"createdAt,omitempty"`
}

func (u User) MarshalJSON() ([]byte, error) {
	type Alias User
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

func (u *User) UnmarshalJSON(data []byte) error {
	type Alias User
	aux := &struct {
		ID      string `json:"id"`
		UserID  string `json:"userId"`
		MongoID string `json:"_id"`
		*Alias
	}{
		Alias: (*Alias)(u),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if aux.ID != "" {
		u.ID = aux.ID
	} else if aux.UserID != "" {
		u.ID = aux.UserID
	} else if aux.MongoID != "" {
		u.ID = aux.MongoID
	}
	return nil
}
