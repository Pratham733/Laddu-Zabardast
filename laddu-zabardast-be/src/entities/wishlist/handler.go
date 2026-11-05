package wishlist

import (
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetWishlist(w http.ResponseWriter, r *http.Request) (*GetWishlistResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	collection := getCollection()
	var userWishlist UserWishlist
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&userWishlist)
	if err != nil || userWishlist.Items == nil {
		return &GetWishlistResponsePacket{
			Wishlist: []product.ProductPacket{},
		}, nil
	}

	packets := product.ProductsToPacketList(userWishlist.Items)
	return &GetWishlistResponsePacket{
		Wishlist: packets,
	}, nil
}

func UpdateWishlist(w http.ResponseWriter, r *http.Request, payload WishlistPayloadPacket) (*UpdateWishlistResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	if err := validateWishlistPayload(payload); err != nil {
		return nil, err
	}

	itemsToSave := make([]product.Product, 0, len(payload.Items))
	for _, itemPacket := range payload.Items {
		id := strings.TrimSpace(itemPacket.ID)
		if id == "" {
			id = strings.TrimSpace(itemPacket.MongoID)
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

	wishlistRecord := UserWishlist{
		UserID:    userId,
		Items:     itemsToSave,
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	collection := getCollection()
	opts := options.UpdateOne().SetUpsert(true)
	_, err = collection.UpdateOne(
		r.Context(),
		bson.M{"_id": userId},
		bson.M{"$set": wishlistRecord},
		opts,
	)
	if err != nil {
		return nil, err
	}

	return &UpdateWishlistResponsePacket{
		Wishlist: payload.Items,
		Success:  true,
		Message:  "Wishlist updated successfully",
	}, nil
}
