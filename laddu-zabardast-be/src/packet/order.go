package packet

type OrderItemPacket struct {
	ProductID string  `json:"productId"`
	Name      string  `json:"name"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
	ImageUrl  string  `json:"imageUrl,omitempty"`
}

type OrderPacket struct {
	ID            string            `json:"_id,omitempty"`
	UserID        string            `json:"userId"`
	Email         string            `json:"email"`
	Items         []OrderItemPacket `json:"items"`
	TotalAmount   float64           `json:"totalAmount"`
	Status        string            `json:"status"`
	PaymentStatus string            `json:"paymentStatus"`
	Date          string            `json:"date"`
	Address       string            `json:"address,omitempty"`
}

type CreateOrderRequest struct {
	Items       []OrderItemPacket `json:"items"`
	TotalAmount float64           `json:"totalAmount"`
	Address     string            `json:"address,omitempty"`
}

type UpdateOrderStatusRequest struct {
	Status        string `json:"status,omitempty"`
	PaymentStatus string `json:"paymentStatus,omitempty"`
}
