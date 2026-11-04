package cart

// CartItemPacket represents a cart line item in API request and response bodies.
type CartItemPacket struct {
	ID          string  `json:"id"`
	ProductID   string  `json:"productId,omitempty"`
	Name        string  `json:"name"`
	Description string  `json:"description,omitempty"`
	Price       float64 `json:"price"`
	ImageUrl    string  `json:"imageUrl,omitempty"`
	Category    string  `json:"category,omitempty"`
	Quantity    int     `json:"quantity"`
}

// CartPayload represents the incoming request payload to update cart items.
type CartPayload struct {
	Items []CartItemPacket `json:"items"`
}

type GetCartResponsePacket struct {
	Items []CartItemPacket `json:"items"`
}

type UpdateCartResponsePacket struct {
	Items   []CartItemPacket `json:"items"`
	Success bool             `json:"success"`
	Message string           `json:"message,omitempty"`
}

// Conversion helpers

func CartItemModelToPacket(item CartItem) CartItemPacket {
	return CartItemPacket{
		ID:          item.ID,
		ProductID:   item.ProductID,
		Name:        item.Name,
		Description: item.Description,
		Price:       item.Price,
		ImageUrl:    item.ImageUrl,
		Category:    item.Category,
		Quantity:    item.Quantity,
	}
}

func CartItemPacketToModel(p CartItemPacket) CartItem {
	return CartItem{
		ID:          p.ID,
		ProductID:   p.ProductID,
		Name:        p.Name,
		Description: p.Description,
		Price:       p.Price,
		ImageUrl:    p.ImageUrl,
		Category:    p.Category,
		Quantity:    p.Quantity,
	}
}

func CartItemsToPacketList(items []CartItem) []CartItemPacket {
	result := make([]CartItemPacket, 0, len(items))
	for _, item := range items {
		result = append(result, CartItemModelToPacket(item))
	}
	return result
}
