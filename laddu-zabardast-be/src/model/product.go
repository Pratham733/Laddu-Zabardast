package model

type Product struct {
	ID          string  `bson:"_id,omitempty" json:"_id,omitempty"`
	Key         string  `bson:"key" json:"key"`
	Name        string  `bson:"name" json:"name"`
	Description string  `bson:"description" json:"description"`
	Price       float64 `bson:"price" json:"price"`
	ImageUrl    string  `bson:"imageUrl" json:"imageUrl"`
	Category    string  `bson:"category" json:"category"`
	Available   bool    `bson:"available" json:"available"`
	Weight      string  `bson:"weight,omitempty" json:"weight,omitempty"`
}
