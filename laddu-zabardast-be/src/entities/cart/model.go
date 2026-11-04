package cart

// CartItem represents an item stored in a user's cart in MongoDB.
type CartItem struct {
	ID          string  `bson:"id" json:"id"`
	ProductID   string  `bson:"productId,omitempty" json:"productId,omitempty"`
	Name        string  `bson:"name" json:"name"`
	Description string  `bson:"description,omitempty" json:"description,omitempty"`
	Price       float64 `bson:"price" json:"price"`
	ImageUrl    string  `bson:"imageUrl,omitempty" json:"imageUrl,omitempty"`
	Category    string  `bson:"category,omitempty" json:"category,omitempty"`
	Quantity    int     `bson:"quantity" json:"quantity"`
}

// UserCart represents the cart document for a user stored in MongoDB.
type UserCart struct {
	UserID    string     `bson:"_id" json:"userId"`
	Items     []CartItem `bson:"items" json:"items"`
	UpdatedAt string     `bson:"updatedAt" json:"updatedAt"`
}
