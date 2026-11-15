package product

import (
	"context"
	"strings"

	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func getCollection() *mongo.Collection {
	return db.GetCollection(db.DefaultDB, CollectionProducts)
}

func fetchAllProducts(ctx context.Context) []ProductPacket {
	collection := getCollection()
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return []ProductPacket{}
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil || products == nil {
		return []ProductPacket{}
	}
	return ProductsToPacketList(products)
}

func GenerateProductKey(name string) string {
	return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "_"))
}

// AvailableByID loads the current catalog entries used to price cart and order lines.
func AvailableByID(ctx context.Context, ids []string) (map[string]Product, error) {
	byID := make(map[string]Product, len(ids))
	if len(ids) == 0 {
		return byID, nil
	}
	cursor, err := getCollection().Find(ctx, bson.M{"_id": bson.M{"$in": ids}, "available": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	for cursor.Next(ctx) {
		var product Product
		if err := cursor.Decode(&product); err != nil {
			return nil, err
		}
		byID[product.ID] = product
	}
	return byID, cursor.Err()
}
