package order

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/box"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func GetOrders(w http.ResponseWriter, r *http.Request) (*GetAllOrdersResponsePacket, error) {
	filter, err := orderAccessFilter(r)
	if err != nil {
		return nil, err
	}
	collection := getCollection()
	if email := strings.TrimSpace(r.URL.Query().Get("email")); len(filter) == 0 && email != "" {
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

	filter, err := orderAccessFilter(r)
	if err != nil {
		return nil, err
	}
	filter["_id"] = id
	var ord Order
	err = getCollection().FindOne(r.Context(), filter).Decode(&ord)
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

	account, err := user.AuthenticatedUser(r)
	if err != nil {
		return nil, err
	}

	paymentMethod := strings.ToLower(strings.TrimSpace(req.PaymentMethod))
	if paymentMethod == "" {
		paymentMethod = "cod"
	}
	switch paymentMethod {
	case "cod", "cash", "upi":
	default:
		return nil, errors.New("unsupported payment method")
	}

	orderItems, total, err := priceOrder(r.Context(), req.Items)
	if err != nil {
		return nil, err
	}
	if math.Round(req.TotalAmount*100) != math.Round(total*100) {
		return nil, errors.New("product prices changed, refresh your cart before placing the order")
	}

	now := time.Now().UTC()
	shippingModel := ShippingDetailsPacketToModel(req.ShippingDetails)
	shippingModel.Email = strings.TrimSpace(shippingModel.Email)

	newOrder := Order{
		ID:                 uuid.NewString(),
		UserID:             account.ID,
		Email:              account.Email,
		ShippingDetails:    shippingModel,
		Items:              orderItems,
		TotalAmount:        total,
		OrderStatus:        OrderStatusProcessing,
		Status:             OrderStatusProcessing,
		PaymentStatus:      PaymentStatusPending,
		PaymentMethod:      paymentMethod,
		Date:               now.Format(time.RFC3339),
		CreatedAt:          now.Format(time.RFC3339),
		Instructions:       strings.TrimSpace(req.Instructions),
		ConfirmationEmails: newConfirmationEmails(shippingModel.Email, now),
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
	updateFields, err := validateUpdateOrderStatus(req.OrderID, req)
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

	ctx, cancel := context.WithTimeout(r.Context(), utils.DefaultTimeout)
	defer cancel()

	filter, err := orderAccessFilter(r.WithContext(ctx))
	if err != nil {
		http.Error(w, "Authentication required", http.StatusUnauthorized)
		return
	}
	filter["_id"] = orderId
	var ord Order
	err = getCollection().FindOne(ctx, filter).Decode(&ord)
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

func orderAccessFilter(r *http.Request) (bson.M, error) {
	account, err := user.AuthenticatedUser(r)
	if err != nil {
		return nil, err
	}
	if account.IsAdmin() {
		return bson.M{}, nil
	}
	return bson.M{"userId": account.ID}, nil
}

func priceOrder(ctx context.Context, items []OrderItemPacket) ([]OrderItem, float64, error) {
	ids := make([]string, 0, len(items))
	for _, item := range items {
		if item.Box != nil {
			ids = item.Box.AppendProductIDs(ids)
		} else {
			ids = append(ids, strings.TrimSpace(item.ProductID))
		}
	}
	catalog, err := product.AvailableByID(ctx, ids)
	if err != nil {
		return nil, 0, err
	}

	priced := make([]OrderItem, 0, len(items))
	var totalCents float64
	for _, item := range items {
		if item.Box != nil {
			custom, err := box.Price(*item.Box, catalog)
			if err != nil {
				return nil, 0, err
			}
			totalCents += math.Round(custom.Price*100) * float64(item.Quantity)
			priced = append(priced, OrderItem{
				ID: custom.ID, Name: custom.Selection.Name(), Quantity: item.Quantity,
				Price: custom.Price, Box: &custom.Selection,
			})
			continue
		}

		id := strings.TrimSpace(item.ProductID)
		p, ok := catalog[id]
		if !ok || p.Price <= 0 {
			return nil, 0, fmt.Errorf("product %s is unavailable", id)
		}
		cents := math.Round(p.Price * 100)
		totalCents += cents * float64(item.Quantity)
		priced = append(priced, OrderItem{
			ID: p.ID, ProductID: p.ID, Name: p.Name,
			Price: cents / 100, Quantity: item.Quantity, ImageUrl: p.ImageUrl,
		})
	}
	return priced, totalCents / 100, nil
}
