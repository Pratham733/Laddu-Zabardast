package cart

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

func GetCart(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userId := vars["userId"]
	if userId == "" {
		http.Error(w, "User ID is required in URL path", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionCarts)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var userCart UserCart
	err := collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&userCart)
	if err != nil || userCart.Items == nil {
		utils.WriteJSON(w, http.StatusOK, map[string]any{
			"items": []CartItemPacket{},
		}, "")
		return
	}

	packets := CartItemsToPacketList(userCart.Items)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"items": packets,
	}, "")
}

func UpdateCart(w http.ResponseWriter, r *http.Request, payload CartPayload) {
	vars := mux.Vars(r)
	userId := vars["userId"]
	if userId == "" {
		http.Error(w, "User ID is required in URL path", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	prodCol := db.GetCollection(utils.LadduZabardast, product.CollectionProducts)
	itemsToSave := make([]CartItem, 0, len(payload.Items))

	for _, itemPacket := range payload.Items {
		pID := strings.TrimSpace(itemPacket.ProductID)
		if pID == "" {
			http.Error(w, "Each cart item must have a non-empty productId", http.StatusBadRequest)
			return
		}
		if itemPacket.Quantity <= 0 {
			http.Error(w, "Each cart item must have a quantity greater than zero", http.StatusBadRequest)
			return
		}

		itemModel := CartItemPacketToModel(itemPacket)
		itemModel.ID = pID
		itemModel.ProductID = pID

		// If name or price is missing, enrich from products database
		if itemModel.Name == "" || itemModel.Price <= 0 {
			var prod product.Product
			if err := prodCol.FindOne(ctx, bson.M{"_id": pID}).Decode(&prod); err == nil {
				itemModel.Name = prod.Name
				itemModel.Price = prod.Price
				itemModel.ImageUrl = prod.ImageUrl
				itemModel.Category = prod.Category
				itemModel.Description = prod.Description
			}
		}

		itemsToSave = append(itemsToSave, itemModel)
	}

	cartRecord := UserCart{
		UserID:    userId,
		Items:     itemsToSave,
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	cartCol := db.GetCollection(utils.LadduZabardast, CollectionCarts)
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

	responsePackets := CartItemsToPacketList(itemsToSave)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"items":   responsePackets,
		"success": true,
	}, "Cart updated successfully")
}
