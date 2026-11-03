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

func GetCart(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userId := vars["userId"]
	if userId == "" {
		http.Error(w, "User ID is required in URL path", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Carts)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var userCart models.UserCart
	err := collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&userCart)
	if err != nil || userCart.Items == nil {
		utils.WriteJSON(w, http.StatusOK, map[string]any{
			"items": []models.CartItem{},
		}, "")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"items": userCart.Items,
	}, "")
}

func UpdateCart(w http.ResponseWriter, r *http.Request, payload packet.CartPayload) {
	vars := mux.Vars(r)
	userId := vars["userId"]
	if userId == "" {
		http.Error(w, "User ID is required in URL path", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	prodCol := db.GetCollection(utils.LadduZabardast, utils.Products)
	itemsToSave := make([]models.CartItem, 0, len(payload.Items))

	for _, item := range payload.Items {
		pID := strings.TrimSpace(item.ProductID)
		if pID == "" {
			http.Error(w, "Each cart item must have a non-empty productId", http.StatusBadRequest)
			return
		}
		if item.Quantity <= 0 {
			http.Error(w, "Each cart item must have a quantity greater than zero", http.StatusBadRequest)
			return
		}

		cartItem := item
		cartItem.ID = pID
		cartItem.ProductID = pID

		// If name or price is missing, enrich from products database
		if cartItem.Name == "" || cartItem.Price <= 0 {
			var prod models.Product
			if err := prodCol.FindOne(ctx, bson.M{"_id": pID}).Decode(&prod); err == nil {
				cartItem.Name = prod.Name
				cartItem.Price = prod.Price
				cartItem.ImageUrl = prod.ImageUrl
				cartItem.Category = prod.Category
				cartItem.Description = prod.Description
			}
		}

		itemsToSave = append(itemsToSave, cartItem)
	}

	cartRecord := models.UserCart{
		UserID:    userId,
		Items:     itemsToSave,
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	cartCol := db.GetCollection(utils.LadduZabardast, utils.Carts)
	opts := options.UpdateOne().SetUpsert(true)
	_, err := cartCol.UpdateOne(
		ctx,
		bson.M{"_id": userId},
		bson.M{"$set": cartRecord},
		opts,
	)
	if err != nil {
		http.Error(w, "Failed to update cart", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"items":   itemsToSave,
		"success": true,
	}, "Cart updated successfully")
}
