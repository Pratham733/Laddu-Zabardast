package order

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func GetOrders(w http.ResponseWriter, r *http.Request) (*GetAllOrdersResponsePacket, error) {
	collection := getCollection()
	filter := bson.M{}
	if email := strings.TrimSpace(r.URL.Query().Get("email")); email != "" {
		filter["email"] = email
	}

	cursor, err := collection.Find(r.Context(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(r.Context())

	var orders []Order
	if err := cursor.All(r.Context(), &orders); err != nil {
		return nil, err
	}

	packets := OrdersToPacketList(orders)
	return &GetAllOrdersResponsePacket{
		Orders:  packets,
		Message: "Orders fetched successfully",
	}, nil
}

func GetOrder(w http.ResponseWriter, r *http.Request) (*GetOrderResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if err := validateOrderId(id); err != nil {
		return nil, err
	}

	collection := getCollection()
	var ord Order
	err := collection.FindOne(r.Context(), bson.M{"_id": id}).Decode(&ord)
	if err != nil {
		return nil, errors.New("order not found")
	}

	packet := OrderToPacket(ord)
	return &GetOrderResponsePacket{
		Order:   packet,
		Message: "Order fetched successfully",
	}, nil
}

func CreateOrder(w http.ResponseWriter, r *http.Request, req CreateOrderRequestPacket) (*CreateOrderResponsePacket, error) {
	if err := validateCreateOrderReq(req); err != nil {
		return nil, err
	}

	var userID, userEmail string
	if uid, err := utils.GetUserID(r); err == nil {
		userID = uid
	}
	email, err := utils.GetUserID(r)
	if err == nil && email != "" {
		userEmail = email
	} else {
		userEmail = strings.TrimSpace(req.ShippingDetails.Email)
	}

	orderStatus := strings.TrimSpace(req.OrderStatus)
	if orderStatus == "" {
		orderStatus = OrderStatusProcessing
	}

	paymentStatus := strings.TrimSpace(req.PaymentStatus)
	if paymentStatus == "" {
		paymentStatus = PaymentStatusPending
	}

	paymentMethod := strings.TrimSpace(req.PaymentMethod)
	if paymentMethod == "" {
		paymentMethod = "cod"
	}

	now := time.Now().UTC().Format(time.RFC3339)

	orderItems := make([]OrderItem, 0, len(req.Items))
	for _, item := range req.Items {
		orderItems = append(orderItems, OrderItem{
			ID:        item.ProductID,
			ProductID: item.ProductID,
			Name:      item.Name,
			Quantity:  item.Quantity,
			Price:     item.Price,
			ImageUrl:  item.ImageUrl,
		})
	}

	shippingModel := ShippingDetailsPacketToModel(req.ShippingDetails)

	newOrder := Order{
		ID:              uuid.NewString(),
		UserID:          userID,
		Email:           userEmail,
		ShippingDetails: shippingModel,
		Items:           orderItems,
		TotalAmount:     req.TotalAmount,
		OrderStatus:     orderStatus,
		Status:          orderStatus,
		PaymentStatus:   paymentStatus,
		PaymentMethod:   paymentMethod,
		Date:            now,
		CreatedAt:       now,
	}

	collection := getCollection()
	_, err = collection.InsertOne(r.Context(), newOrder)
	if err != nil {
		return nil, err
	}

	orderPacket := OrderToPacket(newOrder)
	w.WriteHeader(http.StatusCreated)

	return &CreateOrderResponsePacket{
		Message: "Order placed successfully",
		OrderID: newOrder.ID,
		Order:   orderPacket,
		Success: true,
	}, nil
}

func UpdateOrder(w http.ResponseWriter, r *http.Request, req UpdateOrderStatusRequestPacket) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	updateFields, err := validateUpdateOrderStatus(id, req)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	collection := getCollection()
	result, err := collection.UpdateOne(r.Context(), bson.M{"_id": id}, bson.M{"$set": updateFields})
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	if result.MatchedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("order not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Order updated successfully",
	}, nil
}

func PatchOrder(w http.ResponseWriter, r *http.Request, req UpdateOrderStatusRequestPacket) (utils.SuccessResponsePacket, error) {
	updateFields, err := validatePatchOrderStatus(req)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	collection := getCollection()
	result, err := collection.UpdateOne(r.Context(), bson.M{"_id": req.OrderID}, bson.M{"$set": updateFields})
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	if result.MatchedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("order not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Order updated successfully",
	}, nil
}

func DeleteOrder(w http.ResponseWriter, r *http.Request) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if err := validateOrderId(id); err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	collection := getCollection()
	result, err := collection.DeleteOne(r.Context(), bson.M{"_id": id})
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	if result.DeletedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("order not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Order deleted successfully",
	}, nil
}

func GenerateInvoiceHandler(w http.ResponseWriter, r *http.Request) {
	orderId := strings.TrimSpace(r.URL.Query().Get("orderId"))
	if err := validateInvoiceOrderId(orderId); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(r.Context(), utils.DefaultTimeout)
	defer cancel()

	var ord Order
	err := collection.FindOne(ctx, bson.M{"_id": orderId}).Decode(&ord)
	if err != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	pdfData := generatePDFBytes(ord)

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="invoice-%s.pdf"`, ord.ID))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(pdfData)))
	w.WriteHeader(http.StatusOK)
	w.Write(pdfData)
}
