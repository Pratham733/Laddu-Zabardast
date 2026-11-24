package cart

import (
	"github.com/Pratham733/laddu-zabardast-be/src/entities/box"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
)

// CartItem represents an item stored in a user's cart in MongoDB.
type CartItem struct {
	SweetenerPrices      map[product.Sweetener]float64 `bson:"-" json:"sweetenerPrices,omitempty"`
	SweetenerUnavailable bool                          `bson:"-" json:"sweetenerUnavailable,omitempty"`
	Sweetener            product.Sweetener             `bson:"sweetener,omitempty" json:"sweetener,omitempty"`
	Box                  *box.Selection                `bson:"box,omitempty" json:"box,omitempty"`
	ID                   string                        `bson:"id" json:"id"`
	ProductID            string                        `bson:"productId,omitempty" json:"productId,omitempty"`
	Name                 string                        `bson:"name" json:"name"`
	Description          string                        `bson:"description,omitempty" json:"description,omitempty"`
	Price                float64                       `bson:"price" json:"price"`
	ImageUrl             string                        `bson:"imageUrl,omitempty" json:"imageUrl,omitempty"`
	Category             string                        `bson:"category,omitempty" json:"category,omitempty"`
	Quantity             int                           `bson:"quantity" json:"quantity"`
}

// UserCart represents the cart document for a user stored in MongoDB.
type UserCart struct {
	Revision  int64            `bson:"revision,omitempty" json:"-"`
	Reorders  []reorderReceipt `bson:"reorders,omitempty" json:"-"`
	UserID    string           `bson:"_id" json:"userId"`
	Items     []CartItem       `bson:"items" json:"items"`
	UpdatedAt string           `bson:"updatedAt" json:"updatedAt"`
}
