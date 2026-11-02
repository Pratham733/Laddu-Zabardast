package model

type Address struct {
	ID         string `bson:"_id,omitempty" json:"_id,omitempty"`
	Label      string `bson:"label" json:"label"`
	Street     string `bson:"street" json:"street"`
	City       string `bson:"city" json:"city"`
	State      string `bson:"state" json:"state"`
	Country    string `bson:"country" json:"country"`
	PostalCode string `bson:"postalCode" json:"postalCode"`
	IsDefault  bool   `bson:"isDefault" json:"isDefault"`
}

type User struct {
	ID        string    `bson:"_id,omitempty" json:"_id,omitempty"`
	FirstName string    `bson:"firstName" json:"firstName"`
	LastName  string    `bson:"lastName" json:"lastName"`
	Email     string    `bson:"email" json:"email"`
	Password  string    `bson:"password" json:"password"`
	Phone     string    `bson:"phone,omitempty" json:"phone,omitempty"`
	Addresses []Address `bson:"addresses,omitempty" json:"addresses,omitempty"`
}
