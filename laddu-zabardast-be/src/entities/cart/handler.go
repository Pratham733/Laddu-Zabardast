package cart

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetCart(w http.ResponseWriter, r *http.Request) (*GetCartResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "User ID is required: "+err.Error(), http.StatusBadRequest)
		return nil, err
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var userCart UserCart
	err = collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&userCart)
	if err != nil || userCart.Items == nil {
		return &GetCartResponsePacket{
			Items: []CartItemPacket{},
		}, nil
	}

	packets := CartItemsToPacketList(userCart.Items)
	return &GetCartResponsePacket{
		Items: packets,
	}, nil
}

func UpdateCart(w http.ResponseWriter, r *http.Request, payload CartPayload) (*UpdateCartResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "User ID is required: "+err.Error(), http.StatusBadRequest)
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	prodCol := db.GetCollection(db.DefaultDB, product.CollectionProducts)
	itemsToSave := make([]CartItem, 0, len(payload.Items))

	for _, itemPacket := range payload.Items {
		pID := strings.TrimSpace(itemPacket.ProductID)
		if pID == "" {
			http.Error(w, "Each cart item must have a non-empty productId", http.StatusBadRequest)
			return nil, errors.New("empty productId")
		}
		if itemPacket.Quantity <= 0 {
			http.Error(w, "Each cart item must have a quantity greater than zero", http.StatusBadRequest)
			return nil, errors.New("invalid quantity")
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

	cartCol := getCollection()
	opts := options.UpdateOne().SetUpsert(true)
	_, err = cartCol.UpdateOne(
		ctx,
		bson.M{"_id": userId},
		bson.M{"$set": cartRecord},
		opts,
	)
	if err != nil {
		http.Error(w, "Failed to update cart", http.StatusInternalServerError)
		return nil, err
	}

	responsePackets := CartItemsToPacketList(itemsToSave)
	return &UpdateCartResponsePacket{
		Items:   responsePackets,
		Success: true,
		Message: "Cart updated successfully",
	}, nil
}
