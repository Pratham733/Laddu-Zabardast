package auth

import (
	"context"
	"errors"

	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func getCollection() *mongo.Collection {
	return db.GetCollection(db.DefaultDB, CollectionUsers)
}

func deleteAddress(ctx context.Context, userId string, addressId string) error {
	collection := getCollection()
	_, err := collection.UpdateOne(ctx, bson.M{"_id": userId}, bson.M{"$pull": bson.M{"addresses": bson.M{"id": addressId}}})
	return err
}

func validateDeleteAddress(ctx context.Context, userId string, addressId string) error {
	collection := getCollection()
	var user user.User
	err := collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&user)
	if err != nil {
		return err
	}
	if user.Addresses == nil {
		return errors.New("user does not have any addresses")
	}
	for _, address := range user.Addresses {
		if address.ID == addressId {
			return nil
		}
	}
	return nil
}
