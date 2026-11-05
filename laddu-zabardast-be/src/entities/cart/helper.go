package cart

import (
	"context"

	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func getCollection() *mongo.Collection {
	return db.GetCollection(db.DefaultDB, CollectionCarts)
}

func enrichCartItem(ctx context.Context, item *CartItem, prodCol *mongo.Collection) {
	if item.Name == "" || item.Price <= 0 {
		var prod product.Product
		if err := prodCol.FindOne(ctx, bson.M{"_id": item.ProductID}).Decode(&prod); err == nil {
			item.Name = prod.Name
			item.Price = prod.Price
			item.ImageUrl = prod.ImageUrl
			item.Category = prod.Category
			item.Description = prod.Description
		}
	}
}
