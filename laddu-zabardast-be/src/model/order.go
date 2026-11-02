package model

type OrderItem struct {
	ProductID string  `bson:"productId" json:"productId"`
	Name      string  `bson:"name" json:"name"`
	Quantity  int     `bson:"quantity" json:"quantity"`
	Price     float64 `bson:"price" json:"price"`
	ImageUrl  string  `bson:"imageUrl,omitempty" json:"imageUrl,omitempty"`
}

type Order struct {
	ID            string      `bson:"_id,omitempty" json:"_id,omitempty"`
	UserID        string      `bson:"userId" json:"userId"`
	Email         string      `bson:"email" json:"email"`
	Items         []OrderItem `bson:"items" json:"items"`
	TotalAmount   float64     `bson:"totalAmount" json:"totalAmount"`
	Status        string      `bson:"status" json:"status"`               // pending, processing, shipped, delivered, cancelled
	PaymentStatus string      `bson:"paymentStatus" json:"paymentStatus"` // pending, paid, failed
	Date          string      `bson:"date" json:"date"`
	Address       string      `bson:"address,omitempty" json:"address,omitempty"`
}
