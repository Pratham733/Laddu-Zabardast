package user

import (
	"context"
	"errors"

	"github.com/Pratham733/laddu-zabardast-be/src/db"
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
	var u User
	err := collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		return err
	}
	if u.Addresses == nil {
		return errors.New("user does not have any addresses")
	}
	for _, address := range u.Addresses {
		if address.ID == addressId {
			return nil
		}
	}
	return errors.New("address not found")
}

func BuildUserResponse(u User) UserResponsePacket {
	var phone *string
	if u.Phone != "" {
		phone = &u.Phone
	}
	var role *string
	if u.Role != "" {
		role = &u.Role
	}
	var photoURL *string
	if u.PhotoURL != "" {
		photoURL = &u.PhotoURL
	}
	var picture *string
	if u.Picture != "" {
		picture = &u.Picture
	}
	isAdmin := u.Role == RoleAdmin || u.Email == AdminEmail

	return UserResponsePacket{
		ID:        u.ID,
		UserID:    u.ID,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Email:     u.Email,
		Phone:     phone,
		Role:      role,
		IsAdmin:   isAdmin,
		PhotoURL:  photoURL,
		Picture:   picture,
		Addresses: ModelAddressesToPacket(u.Addresses),
		CreatedAt: u.CreatedAt,
	}
}
