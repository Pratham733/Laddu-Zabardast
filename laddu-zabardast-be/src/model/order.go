package model

import "encoding/json"

type OrderItem struct {
	ID        string  `bson:"id,omitempty" json:"id,omitempty"`
	ProductID string  `bson:"productId" json:"productId"`
	Name      string  `bson:"name" json:"name"`
	Quantity  int     `bson:"quantity" json:"quantity"`
	Price     float64 `bson:"price" json:"price"`
	ImageUrl  string  `bson:"imageUrl,omitempty" json:"imageUrl,omitempty"`
}

type ShippingDetails struct {
	Name       string `bson:"name" json:"name"`
	Email      string `bson:"email" json:"email"`
	Phone      string `bson:"phone" json:"phone"`
	Address    string `bson:"address,omitempty" json:"address,omitempty"`
	Street     string `bson:"street,omitempty" json:"street,omitempty"`
	City       string `bson:"city" json:"city"`
	State      string `bson:"state" json:"state"`
	PostalCode string `bson:"postalCode" json:"postalCode"`
	Zip        string `bson:"zip,omitempty" json:"zip,omitempty"`
	Country    string `bson:"country" json:"country"`
}

type Order struct {
	ID              string          `bson:"_id,omitempty" json:"id"`
	UserID          string          `bson:"userId" json:"userId"`
	Email           string          `bson:"email" json:"email"`
	ShippingDetails ShippingDetails `bson:"shippingDetails" json:"shippingDetails"`
	Items           []OrderItem     `bson:"items" json:"items"`
	TotalAmount     float64         `bson:"totalAmount" json:"totalAmount"`
	OrderStatus     string          `bson:"orderStatus" json:"orderStatus"`
	Status          string          `bson:"status" json:"status"`
	PaymentStatus   string          `bson:"paymentStatus" json:"paymentStatus"`
	PaymentMethod   string          `bson:"paymentMethod,omitempty" json:"paymentMethod,omitempty"`
	Date            string          `bson:"date" json:"date"`
	CreatedAt       string          `bson:"createdAt" json:"createdAt"`
}

func (o Order) MarshalJSON() ([]byte, error) {
	type Alias Order
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

func (o *Order) UnmarshalJSON(data []byte) error {
	type Alias Order
	aux := &struct {
		ID      string `json:"id"`
		MongoID string `json:"_id"`
		*Alias
	}{
		Alias: (*Alias)(o),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if aux.ID != "" {
		o.ID = aux.ID
	} else if aux.MongoID != "" {
		o.ID = aux.MongoID
	}
	if o.OrderStatus == "" && o.Status != "" {
		o.OrderStatus = o.Status
	}
	if o.Status == "" && o.OrderStatus != "" {
		o.Status = o.OrderStatus
	}
	if o.Date == "" && o.CreatedAt != "" {
		o.Date = o.CreatedAt
	}
	if o.CreatedAt == "" && o.Date != "" {
		o.CreatedAt = o.Date
	}
	return nil
}
