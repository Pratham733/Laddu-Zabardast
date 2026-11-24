package cart

import (
	"errors"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetCart(w http.ResponseWriter, r *http.Request) (*GetCartResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}
	if mux.Vars(r)["userId"] != userId {
		return nil, errors.New("account does not match request")
	}

	collection := getCollection()
	var userCart UserCart
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&userCart)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		return nil, err
	}
	if userCart.Items == nil {
		return &GetCartResponsePacket{
			Items: []CartItemPacket{},
		}, nil
	}

	items, err := refreshCartItems(r.Context(), userCart.Items, false)
	if err != nil {
		return nil, err
	}
	packets := CartItemsToPacketList(items)
	return &GetCartResponsePacket{
		Items: packets,
	}, nil
}

func UpdateCart(w http.ResponseWriter, r *http.Request, payload CartPayloadPacket) (*UpdateCartResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}
	if mux.Vars(r)["userId"] != userId {
		return nil, errors.New("account does not match request")
	}

	err = validateCartPayload(payload)
	if err != nil {
		return nil, err
	}

	items := make([]CartItem, 0, len(payload.Items))
	for _, item := range payload.Items {
		items = append(items, CartItem{ProductID: strings.TrimSpace(item.ProductID), Quantity: item.Quantity, Box: item.Box, Sweetener: item.Sweetener})
	}
	itemsToSave, err := refreshCartItems(r.Context(), items, true)
	if err != nil {
		return nil, err
	}

	cartCol := getCollection()
	opts := options.UpdateOne().SetUpsert(true)
	_, err = cartCol.UpdateOne(
		r.Context(),
		bson.M{"_id": userId},
		bson.M{"$set": bson.M{"items": itemsToSave, "updatedAt": time.Now().UTC().Format(time.RFC3339)}, "$inc": bson.M{"revision": 1}},
		opts,
	)
	if err != nil {
		return nil, err
	}

	responsePackets := CartItemsToPacketList(itemsToSave)
	return &UpdateCartResponsePacket{
		Items:   responsePackets,
		Success: true,
		Message: "Cart updated successfully",
	}, nil
}
