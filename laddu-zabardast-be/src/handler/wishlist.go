package handler

import (
	"context"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	models "github.com/Pratham733/laddu-zabardast-be/src/model"
	"github.com/Pratham733/laddu-zabardast-be/src/packet"
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

	collection := db.GetCollection(utils.LadduZabardast, utils.Wishlists)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var userWishlist models.UserWishlist
	err := collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&userWishlist)
	if err != nil || userWishlist.Items == nil {
		utils.WriteJSON(w, http.StatusOK, map[string]any{
			"wishlist": []models.Product{},
		}, "")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"wishlist": userWishlist.Items,
	}, "")
}

func UpdateWishlist(w http.ResponseWriter, r *http.Request, payload packet.WishlistPayload) {
	vars := mux.Vars(r)
	userId := vars["userId"]
	if userId == "" {
		http.Error(w, "User ID is required in URL path", http.StatusBadRequest)
		return
	}

	for _, item := range payload.Items {
		if strings.TrimSpace(item.ID) == "" {
			http.Error(w, "Each wishlist item must have a valid product id", http.StatusBadRequest)
			return
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	wishlistRecord := models.UserWishlist{
		UserID:    userId,
		Items:     payload.Items,
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Wishlists)
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
