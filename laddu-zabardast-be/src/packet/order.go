package packet

import "github.com/Pratham733/laddu-zabardast-be/src/model"

type CreateOrderRequest struct {
	ShippingDetails model.ShippingDetails `json:"shippingDetails"`
	Items           []model.OrderItem     `json:"items"`
	TotalAmount     float64               `json:"totalAmount"`
	PaymentStatus   string                `json:"paymentStatus"`
	PaymentMethod   string                `json:"paymentMethod"`
	OrderStatus     string                `json:"orderStatus"`
	Status          string                `json:"status,omitempty"`
	Address         string                `json:"address,omitempty"`
}

type UpdateOrderStatusRequest struct {
	OrderID       string `json:"orderId,omitempty"`
	Status        string `json:"status,omitempty"`
	OrderStatus   string `json:"orderStatus,omitempty"`
	PaymentStatus string `json:"paymentStatus,omitempty"`
}
