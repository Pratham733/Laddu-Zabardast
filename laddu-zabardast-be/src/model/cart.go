package model

type CartItem struct {
	ID          string  `json:"id" bson:"id"`
	ProductID   string  `json:"productId,omitempty" bson:"productId,omitempty"`
	Name        string  `json:"name" bson:"name"`
	Description string  `json:"description,omitempty" bson:"description,omitempty"`
	Price       float64 `json:"price" bson:"price"`
	ImageUrl    string  `json:"imageUrl,omitempty" bson:"imageUrl,omitempty"`
	Category    string  `json:"category,omitempty" bson:"category,omitempty"`
	Quantity    int     `json:"quantity" bson:"quantity"`
}

type UserCart struct {
	UserID    string     `bson:"_id" json:"userId"`
	Items     []CartItem `bson:"items" json:"items"`
	UpdatedAt string     `bson:"updatedAt" json:"updatedAt"`
}
