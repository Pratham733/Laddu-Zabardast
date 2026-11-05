package cart

import (
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
		return nil, err
	}

	collection := getCollection()
	var userCart UserCart
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&userCart)
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

func UpdateCart(w http.ResponseWriter, r *http.Request, payload CartPayloadPacket) (*UpdateCartResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	if err := validateCartPayload(payload); err != nil {
		return nil, err
	}

	prodCol := db.GetCollection(db.DefaultDB, product.CollectionProducts)
	itemsToSave := make([]CartItem, 0, len(payload.Items))

	for _, itemPacket := range payload.Items {
		pID := strings.TrimSpace(itemPacket.ProductID)
		itemModel := CartItemPacketToModel(itemPacket)
		itemModel.ID = pID
		itemModel.ProductID = pID

		enrichCartItem(r.Context(), &itemModel, prodCol)
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
		r.Context(),
		bson.M{"_id": userId},
		bson.M{"$set": cartRecord},
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
