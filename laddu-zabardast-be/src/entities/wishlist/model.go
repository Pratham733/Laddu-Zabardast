package wishlist

import (
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
)

// UserWishlist represents a user's wishlist document in MongoDB.
type UserWishlist struct {
	UserID    string            `bson:"_id" json:"userId"`
	Items     []product.Product `bson:"items" json:"wishlist"`
	UpdatedAt string            `bson:"updatedAt" json:"updatedAt"`
}
