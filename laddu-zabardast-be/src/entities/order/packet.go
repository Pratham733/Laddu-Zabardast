package order

import "encoding/json"

type OrderItemPacket struct {
	ID        string  `json:"id,omitempty"`
	ProductID string  `json:"productId"`
	Name      string  `json:"name"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
	ImageUrl  string  `json:"imageUrl,omitempty"`
}

type ShippingDetailsPacket struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Address    string `json:"address,omitempty"`
	Street     string `json:"street,omitempty"`
	City       string `json:"city"`
	State      string `json:"state"`
	PostalCode string `json:"postalCode"`
	Zip        string `json:"zip,omitempty"`
	Country    string `json:"country"`
}

type CreateOrderRequestPacket struct {
	ShippingDetails ShippingDetailsPacket `json:"shippingDetails"`
	Items           []OrderItemPacket     `json:"items"`
	TotalAmount     float64               `json:"totalAmount"`
	PaymentStatus   string                `json:"paymentStatus"`
	PaymentMethod   string                `json:"paymentMethod"`
	OrderStatus     string                `json:"orderStatus"`
	Status          string                `json:"status,omitempty"`
	Address         string                `json:"address,omitempty"`
}

type CreateOrderRequest = CreateOrderRequestPacket

type UpdateOrderStatusRequestPacket struct {
	OrderID       string `json:"orderId,omitempty"`
	Status        string `json:"status,omitempty"`
	OrderStatus   string `json:"orderStatus,omitempty"`
	PaymentStatus string `json:"paymentStatus,omitempty"`
}

type UpdateOrderStatusRequest = UpdateOrderStatusRequestPacket

type OrderPacket struct {
	ID              string                `json:"id"`
	MongoID         string                `json:"_id,omitempty"`
	UserID          string                `json:"userId"`
	Email           string                `json:"email"`
	ShippingDetails ShippingDetailsPacket `json:"shippingDetails"`
	Items           []OrderItemPacket     `json:"items"`
	TotalAmount     float64               `json:"totalAmount"`
	OrderStatus     string                `json:"orderStatus"`
	Status          string                `json:"status"`
	PaymentStatus   string                `json:"paymentStatus"`
	PaymentMethod   string                `json:"paymentMethod,omitempty"`
	Date            string                `json:"date"`
	CreatedAt       string                `json:"createdAt"`
}

func (o OrderPacket) MarshalJSON() ([]byte, error) {
	type Alias OrderPacket
	status := o.OrderStatus
	if status == "" {
		status = o.Status
	}
	date := o.Date
	if date == "" {
		date = o.CreatedAt
	}

	return json.Marshal(&struct {
		Alias
		ID          string `json:"id"`
		MongoID     string `json:"_id"`
		OrderStatus string `json:"orderStatus"`
		Status      string `json:"status"`
		Date        string `json:"date"`
		CreatedAt   string `json:"createdAt"`
	}{
		Alias:       (Alias)(o),
		ID:          o.ID,
		MongoID:     o.ID,
		OrderStatus: status,
		Status:      status,
		Date:        date,
		CreatedAt:   date,
	})
}

type GetAllOrdersResponsePacket struct {
	Orders  []OrderPacket `json:"orders"`
	Message string        `json:"message,omitempty"`
}

type GetOrderResponsePacket struct {
	Order   OrderPacket `json:"order"`
	Message string      `json:"message,omitempty"`
}

type CreateOrderResponsePacket struct {
	Message string      `json:"message"`
	OrderID string      `json:"orderId"`
	Order   OrderPacket `json:"order"`
	Success bool        `json:"success"`
}

// Conversion helpers

func OrderItemModelToPacket(item OrderItem) OrderItemPacket {
	return OrderItemPacket{
		ID:        item.ID,
		ProductID: item.ProductID,
		Name:      item.Name,
		Quantity:  item.Quantity,
		Price:     item.Price,
		ImageUrl:  item.ImageUrl,
	}
}

func OrderItemPacketToModel(p OrderItemPacket) OrderItem {
	return OrderItem{
		ID:        p.ID,
		ProductID: p.ProductID,
		Name:      p.Name,
		Quantity:  p.Quantity,
		Price:     p.Price,
		ImageUrl:  p.ImageUrl,
	}
}

func ShippingDetailsModelToPacket(s ShippingDetails) ShippingDetailsPacket {
	return ShippingDetailsPacket{
		Name:       s.Name,
		Email:      s.Email,
		Phone:      s.Phone,
		Address:    s.Address,
		Street:     s.Street,
		City:       s.City,
		State:      s.State,
		PostalCode: s.PostalCode,
		Zip:        s.Zip,
		Country:    s.Country,
	}
}

func ShippingDetailsPacketToModel(p ShippingDetailsPacket) ShippingDetails {
	return ShippingDetails{
		Name:       p.Name,
		Email:      p.Email,
		Phone:      p.Phone,
		Address:    p.Address,
		Street:     p.Street,
		City:       p.City,
		State:      p.State,
		PostalCode: p.PostalCode,
		Zip:        p.Zip,
		Country:    p.Country,
	}
}

func OrderToPacket(o Order) OrderPacket {
	items := make([]OrderItemPacket, 0, len(o.Items))
	for _, item := range o.Items {
		items = append(items, OrderItemModelToPacket(item))
	}

	status := o.OrderStatus
	if status == "" {
		status = o.Status
	}
	date := o.Date
	if date == "" {
		date = o.CreatedAt
	}

	return OrderPacket{
		ID:              o.ID,
		MongoID:         o.ID,
		UserID:          o.UserID,
		Email:           o.Email,
		ShippingDetails: ShippingDetailsModelToPacket(o.ShippingDetails),
		Items:           items,
		TotalAmount:     o.TotalAmount,
		OrderStatus:     status,
		Status:          status,
		PaymentStatus:   o.PaymentStatus,
		PaymentMethod:   o.PaymentMethod,
		Date:            date,
		CreatedAt:       date,
	}
}

func OrdersToPacketList(orders []Order) []OrderPacket {
	result := make([]OrderPacket, 0, len(orders))
	for _, o := range orders {
		result = append(result, OrderToPacket(o))
	}
	return result
}
