package wishlist

import (
	"context"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetWishlist(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userId := vars["userId"]
	if userId == "" {
		http.Error(w, "User ID is required in URL path", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionWishlists)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var userWishlist UserWishlist
	err := collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&userWishlist)
	if err != nil || userWishlist.Items == nil {
		utils.WriteJSON(w, http.StatusOK, map[string]any{
			"wishlist": []product.ProductPacket{},
		}, "")
		return
	}

	packets := product.ProductsToPacketList(userWishlist.Items)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"wishlist": packets,
	}, "")
}

func UpdateWishlist(w http.ResponseWriter, r *http.Request, payload WishlistPayload) {
	vars := mux.Vars(r)
	userId := vars["userId"]
	if userId == "" {
		http.Error(w, "User ID is required in URL path", http.StatusBadRequest)
		return
	}

	itemsToSave := make([]product.Product, 0, len(payload.Items))
	for _, itemPacket := range payload.Items {
		id := strings.TrimSpace(itemPacket.ID)
		if id == "" {
			id = strings.TrimSpace(itemPacket.MongoID)
		}
		if id == "" {
			http.Error(w, "Each wishlist item must have a valid product id", http.StatusBadRequest)
			return
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

	collection := db.GetCollection(utils.LadduZabardast, CollectionWishlists)
	opts := options.UpdateOne().SetUpsert(true)
	_, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": userId},
		bson.M{"$set": wishlistRecord},
		opts,
	)
	if err != nil {
		http.Error(w, "Failed to update wishlist", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"wishlist": payload.Items,
		"success":  true,
	}, "Wishlist updated successfully")
}
