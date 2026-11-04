package wishlist

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetWishlist(w http.ResponseWriter, r *http.Request) (*GetWishlistResponse, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "User ID is required: "+err.Error(), http.StatusBadRequest)
		return nil, err
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var userWishlist UserWishlist
	err = collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&userWishlist)
	if err != nil || userWishlist.Items == nil {
		return &GetWishlistResponse{
			Wishlist: []product.ProductPacket{},
		}, nil
	}

	packets := product.ProductsToPacketList(userWishlist.Items)
	return &GetWishlistResponse{
		Wishlist: packets,
	}, nil
}

func UpdateWishlist(w http.ResponseWriter, r *http.Request, payload WishlistPayload) (*UpdateWishlistResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "User ID is required: "+err.Error(), http.StatusBadRequest)
		return nil, err
	}

	itemsToSave := make([]product.Product, 0, len(payload.Items))
	for _, itemPacket := range payload.Items {
		id := strings.TrimSpace(itemPacket.ID)
		if id == "" {
			id = strings.TrimSpace(itemPacket.MongoID)
		}
		if id == "" {
			http.Error(w, "Each wishlist item must have a valid product id", http.StatusBadRequest)
			return nil, errors.New("empty product id")
		}

		itemsToSave = append(itemsToSave, product.Product{
			ID:          id,
			Key:         itemPacket.Key,
			Name:        itemPacket.Name,
			Description: itemPacket.Description,
			Price:       itemPacket.Price,
			ImageUrl:    itemPacket.ImageUrl,
			Category:    itemPacket.Category,
			Available:   itemPacket.Available,
			Weight:      itemPacket.Weight,
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	wishlistRecord := UserWishlist{
		UserID:    userId,
		Items:     itemsToSave,
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	collection := getCollection()
	opts := options.UpdateOne().SetUpsert(true)
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"_id": userId},
		bson.M{"$set": wishlistRecord},
		opts,
	)
	if err != nil {
		http.Error(w, "Failed to update wishlist", http.StatusInternalServerError)
		return nil, err
	}

	return &UpdateWishlistResponsePacket{
		Wishlist: payload.Items,
		Success:  true,
		Message:  "Wishlist updated successfully",
	}, nil
}
