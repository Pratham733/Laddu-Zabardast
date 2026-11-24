package order

import (
	"errors"
	"net/http"
	"strings"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/cart"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type ReorderRequest struct {
	RequestID string `json:"requestId"`
}

func ReorderHandler(_ http.ResponseWriter, r *http.Request, req ReorderRequest) (*cart.ReorderResponse, error) {
	requestID, err := uuid.Parse(req.RequestID)
	if err != nil || requestID == uuid.Nil {
		return nil, errors.New("invalid reorder request")
	}
	orderID := mux.Vars(r)["id"]
	if err := validateOrderId(orderID); err != nil {
		return nil, err
	}
	accountID, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}
	var saved Order
	err = getCollection().FindOne(r.Context(), bson.M{"_id": orderID, "userId": accountID}).Decode(&saved)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, errors.New("order not found")
	}
	if err != nil {
		return nil, err
	}

	lines := make([]cart.CartItem, 0, len(saved.Items))
	for _, item := range saved.Items {
		id := strings.TrimSpace(item.ProductID)
		if id == "" && item.Box == nil {
			id = strings.TrimSpace(item.ID)
		}
		lines = append(lines, cart.CartItem{ProductID: id, Box: item.Box, Name: item.Name, Sweetener: item.Sweetener, Quantity: item.Quantity})
	}
	return cart.Reorder(r.Context(), accountID, orderID, requestID.String(), lines)
}
