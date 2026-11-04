package wishlist

import (
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
)

// WishlistPayload represents the incoming payload to update a user's wishlist.
type WishlistPayload struct {
	Items []product.ProductPacket `json:"items"`
}

// GetWishlistResponse represents the wishlist response payload.
type GetWishlistResponse struct {
	Wishlist []product.ProductPacket `json:"wishlist"`
}

type UpdateWishlistResponsePacket struct {
	Wishlist []product.ProductPacket `json:"wishlist"`
	Success  bool                    `json:"success"`
	Message  string                  `json:"message,omitempty"`
}
