package wishlist

import (
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
)

type WishlistPayloadPacket struct {
	Items []product.ProductPacket `json:"items"`
}

type WishlistPayload = WishlistPayloadPacket

// GetWishlistResponse represents the wishlist response payload.
type GetWishlistResponsePacket struct {
	Wishlist []product.ProductPacket `json:"wishlist"`
}

type GetWishlistResponse = GetWishlistResponsePacket

type UpdateWishlistResponsePacket struct {
	Wishlist []product.ProductPacket `json:"wishlist"`
	Success  bool                    `json:"success"`
	Message  string                  `json:"message,omitempty"`
}
