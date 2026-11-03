package model

type UserWishlist struct {
	UserID    string    `bson:"_id" json:"userId"`
	Items     []Product `bson:"items" json:"wishlist"`
	UpdatedAt string    `bson:"updatedAt" json:"updatedAt"`
}
