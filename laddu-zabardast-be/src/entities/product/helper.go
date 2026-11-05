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
