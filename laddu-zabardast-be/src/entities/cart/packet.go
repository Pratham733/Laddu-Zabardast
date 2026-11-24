package cart

import (
	"github.com/Pratham733/laddu-zabardast-be/src/entities/box"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
)

// CartItemPacket represents a cart line item in API request and response bodies.
type CartItemPacket struct {
	SweetenerPrices      map[product.Sweetener]float64 `json:"sweetenerPrices,omitempty"`
	SweetenerUnavailable bool                          `json:"sweetenerUnavailable,omitempty"`
	Sweetener            product.Sweetener             `json:"sweetener,omitempty"`
	Box                  *box.Selection                `json:"box,omitempty"`
	ID                   string                        `json:"id"`
	ProductID            string                        `json:"productId,omitempty"`
	Name                 string                        `json:"name"`
	Description          string                        `json:"description,omitempty"`
	Price                float64                       `json:"price"`
	ImageUrl             string                        `json:"imageUrl,omitempty"`
	Category             string                        `json:"category,omitempty"`
	Quantity             int                           `json:"quantity"`
}

type CartPayloadPacket struct {
	Items []CartItemPacket `json:"items"`
}

type CartPayload = CartPayloadPacket

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
		Sweetener:            item.Sweetener,
		SweetenerPrices:      item.SweetenerPrices,
		SweetenerUnavailable: item.SweetenerUnavailable,
		ID:                   item.ID,
		ProductID:            item.ProductID,
		Name:                 item.Name,
		Description:          item.Description,
		Price:                item.Price,
		Box:                  item.Box,
		ImageUrl:             item.ImageUrl,
		Category:             item.Category,
		Quantity:             item.Quantity,
	}
}

func CartItemPacketToModel(p CartItemPacket) CartItem {
	return CartItem{
		Sweetener:   p.Sweetener,
		ID:          p.ID,
		ProductID:   p.ProductID,
		Name:        p.Name,
		Description: p.Description,
		Price:       p.Price,
		Box:         p.Box,
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
