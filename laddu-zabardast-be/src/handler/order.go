package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	models "github.com/Pratham733/laddu-zabardast-be/src/model"
	"github.com/Pratham733/laddu-zabardast-be/src/packet"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func GetOrders(w http.ResponseWriter, r *http.Request) {
	collection := db.GetCollection(utils.LadduZabardast, utils.Orders)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// If email query param is provided, filter by it (for regular users)
	filter := bson.M{}
	if email := r.URL.Query().Get("email"); email != "" {
		filter["email"] = email
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		http.Error(w, "Failed to fetch orders", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var orders []models.Order
	if err := cursor.All(ctx, &orders); err != nil {
		http.Error(w, "Failed to decode orders", http.StatusInternalServerError)
		return
	}

	if orders == nil {
		orders = []models.Order{}
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"orders": orders,
	}, "Orders fetched successfully")
}

func GetOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Order ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Orders)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var order models.Order
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&order)
	if err != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"order": order,
	}, "Order fetched successfully")
}

func CreateOrder(w http.ResponseWriter, r *http.Request) {
	// Require auth for creating orders
	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	var req packet.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Items) == 0 {
		http.Error(w, "Order must have at least one item", http.StatusBadRequest)
		return
	}

	// Build order items
	orderItems := make([]models.OrderItem, 0, len(req.Items))
	for _, item := range req.Items {
		orderItems = append(orderItems, models.OrderItem{
			ProductID: item.ProductID,
			Name:      item.Name,
			Quantity:  item.Quantity,
			Price:     item.Price,
			ImageUrl:  item.ImageUrl,
		})
	}

	order := models.Order{
		ID:            uuid.NewString(),
		UserID:        claims.UserID,
		Email:         claims.Email,
		Items:         orderItems,
		TotalAmount:   req.TotalAmount,
		Status:        "pending",
		PaymentStatus: "pending",
		Date:          time.Now().UTC().Format(time.RFC3339),
		Address:       req.Address,
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Orders)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, order)
	if err != nil {
		http.Error(w, "Failed to create order", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]any{
		"message": "Order placed successfully",
		"orderId": order.ID,
		"order":   order,
	}, "Order placed successfully")
}

func UpdateOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Order ID is required", http.StatusBadRequest)
		return
	}

	var req packet.UpdateOrderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updateFields := bson.M{}
	if req.Status != "" {
		updateFields["status"] = req.Status
	}
	if req.PaymentStatus != "" {
		updateFields["paymentStatus"] = req.PaymentStatus
	}
	if len(updateFields) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Orders)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updateFields})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Failed to update order", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Order updated successfully",
	}, "Order updated successfully")
}

func DeleteOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Order ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Orders)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Failed to delete order", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Order deleted successfully",
	}, "Order deleted successfully")
}
