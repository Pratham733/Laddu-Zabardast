package order

import (
	"bytes"
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
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{}
	if email := strings.TrimSpace(r.URL.Query().Get("email")); email != "" {
		filter["email"] = email
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		http.Error(w, "Failed to fetch orders", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []Order
	if err := cursor.All(ctx, &orders); err != nil {
		http.Error(w, "Failed to decode orders", http.StatusInternalServerError)
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
	if id == "" {
		http.Error(w, "Order ID is required in URL path", http.StatusBadRequest)
		return nil, errors.New("order ID required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var ord Order
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&ord)
	if err != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return nil, err
	}

	packet := OrderToPacket(ord)
	return &GetOrderResponsePacket{
		Order:   packet,
		Message: "Order fetched successfully",
	}, nil
}

func CreateOrder(w http.ResponseWriter, r *http.Request, req CreateOrderRequest) (*CreateOrderResponsePacket, error) {
	if len(req.Items) == 0 {
		http.Error(w, "Order must contain at least one item", http.StatusBadRequest)
		return nil, errors.New("empty items")
	}

	if req.TotalAmount <= 0 {
		http.Error(w, "Order totalAmount must be greater than zero", http.StatusBadRequest)
		return nil, errors.New("invalid total amount")
	}

	if strings.TrimSpace(req.ShippingDetails.Name) == "" ||
		strings.TrimSpace(req.ShippingDetails.Email) == "" ||
		strings.TrimSpace(req.ShippingDetails.City) == "" {
		http.Error(w, "Shipping details (name, email, city) are required", http.StatusBadRequest)
		return nil, errors.New("incomplete shipping details")
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
		if strings.TrimSpace(item.ProductID) == "" {
			http.Error(w, "Each order item must have a valid productId", http.StatusBadRequest)
			return nil, errors.New("invalid productId in order item")
		}
		if item.Quantity <= 0 {
			http.Error(w, "Each order item must have a quantity greater than zero", http.StatusBadRequest)
			return nil, errors.New("invalid quantity in order item")
		}

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
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, newOrder)
	if err != nil {
		http.Error(w, "Failed to create order", http.StatusInternalServerError)
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

func UpdateOrder(w http.ResponseWriter, r *http.Request, req UpdateOrderStatusRequest) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Order ID is required in URL path", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("order ID required")
	}

	updateFields := bson.M{}
	status := strings.TrimSpace(req.OrderStatus)
	if status != "" {
		updateFields["orderStatus"] = status
		updateFields["status"] = status
	}
	if pStatus := strings.TrimSpace(req.PaymentStatus); pStatus != "" {
		updateFields["paymentStatus"] = pStatus
	}

	if len(updateFields) == 0 {
		http.Error(w, "No orderStatus or paymentStatus provided to update", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("no fields to update")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updateFields})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Order not found", http.StatusNotFound)
		return utils.SuccessResponsePacket{}, errors.New("order not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Order updated successfully",
	}, nil
}

func PatchOrder(w http.ResponseWriter, r *http.Request, req UpdateOrderStatusRequest) (utils.SuccessResponsePacket, error) {
	if strings.TrimSpace(req.OrderID) == "" {
		http.Error(w, "orderId is required in request body", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("order ID required")
	}

	updateFields := bson.M{}
	status := strings.TrimSpace(req.OrderStatus)
	if status != "" {
		updateFields["orderStatus"] = status
		updateFields["status"] = status
	}
	if pStatus := strings.TrimSpace(req.PaymentStatus); pStatus != "" {
		updateFields["paymentStatus"] = pStatus
	}

	if len(updateFields) == 0 {
		http.Error(w, "orderStatus or paymentStatus is required to update", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("no fields to update")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": req.OrderID}, bson.M{"$set": updateFields})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Order not found", http.StatusNotFound)
		return utils.SuccessResponsePacket{}, errors.New("order not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Order updated successfully",
	}, nil
}

func DeleteOrder(w http.ResponseWriter, r *http.Request) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Order ID is required in URL path", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("order ID required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Order not found", http.StatusNotFound)
		return utils.SuccessResponsePacket{}, errors.New("order not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Order deleted successfully",
	}, nil
}

func sanitizePDFText(text string) string {
	text = strings.ReplaceAll(text, "\\", "\\\\")
	text = strings.ReplaceAll(text, "(", "\\(")
	text = strings.ReplaceAll(text, ")", "\\)")
	return text
}

func generatePDFBytes(ord Order) []byte {
	var stream bytes.Buffer

	// Title
	stream.WriteString("BT\n/F1 18 Tf\n50 730 Td\n(Laddu Zabardast - Tax Invoice) Tj\nET\n")

	// Order metadata
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 690 Td\n(Order ID: %s) Tj\nET\n", sanitizePDFText(ord.ID)))
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 675 Td\n(Date: %s) Tj\nET\n", sanitizePDFText(ord.Date)))
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 660 Td\n(Order Status: %s    |    Payment: %s (%s)) Tj\nET\n",
		sanitizePDFText(ord.OrderStatus), sanitizePDFText(ord.PaymentStatus), sanitizePDFText(ord.PaymentMethod)))

	// Customer Info
	stream.WriteString("BT\n/F1 12 Tf\n50 630 Td\n(Customer & Shipping Details:) Tj\nET\n")
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 615 Td\n(Name: %s) Tj\nET\n", sanitizePDFText(ord.ShippingDetails.Name)))
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 600 Td\n(Email: %s) Tj\nET\n", sanitizePDFText(ord.ShippingDetails.Email)))
	if ord.ShippingDetails.Phone != "" {
		stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 585 Td\n(Phone: %s) Tj\nET\n", sanitizePDFText(ord.ShippingDetails.Phone)))
	}
	addrLine := ord.ShippingDetails.Address
	if addrLine == "" {
		addrLine = ord.ShippingDetails.Street
	}
	fullAddr := fmt.Sprintf("%s, %s, %s - %s, %s",
		addrLine, ord.ShippingDetails.City, ord.ShippingDetails.State,
		ord.ShippingDetails.PostalCode, ord.ShippingDetails.Country)
	stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 570 Td\n(Address: %s) Tj\nET\n", sanitizePDFText(fullAddr)))

	// Items header
	stream.WriteString("BT\n/F1 12 Tf\n50 535 Td\n(Ordered Items:) Tj\nET\n")
	stream.WriteString("BT\n/F1 10 Tf\n50 520 Td\n(Item Name                                   Qty       Price (INR)     Subtotal (INR)) Tj\nET\n")

	y := 505
	for _, item := range ord.Items {
		subtotal := float64(item.Quantity) * item.Price
		line := fmt.Sprintf("%-38s x%-4d    Rs. %-10.2f  Rs. %.2f",
			item.Name, item.Quantity, item.Price, subtotal)
		stream.WriteString(fmt.Sprintf("BT\n/F1 10 Tf\n50 %d Td\n(%s) Tj\nET\n", y, sanitizePDFText(line)))
		y -= 18
		if y < 100 {
			break
		}
	}

	// Total Amount
	stream.WriteString(fmt.Sprintf("BT\n/F1 14 Tf\n50 %d Td\n(Total Amount: Rs. %.2f) Tj\nET\n", y-20, ord.TotalAmount))
	stream.WriteString(fmt.Sprintf("BT\n/F1 9 Tf\n50 %d Td\n(Thank you for ordering with Laddu Zabardast! For questions, contact support@ladduzabardast.com) Tj\nET\n", y-50))

	streamBytes := stream.Bytes()

	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n")
	var offsets [6]int

	offsets[1] = pdf.Len()
	pdf.WriteString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

	offsets[2] = pdf.Len()
	pdf.WriteString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

	offsets[3] = pdf.Len()
	pdf.WriteString("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n")

	offsets[4] = pdf.Len()
	pdf.WriteString("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

	offsets[5] = pdf.Len()
	pdf.WriteString(fmt.Sprintf("5 0 obj\n<< /Length %d >>\nstream\n%sendstream\nendobj\n", len(streamBytes), streamBytes))

	xrefOffset := pdf.Len()
	pdf.WriteString("xref\n0 6\n0000000000 65535 f \n")
	for i := 1; i <= 5; i++ {
		pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
	}

	pdf.WriteString(fmt.Sprintf("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", xrefOffset))

	return pdf.Bytes()
}

func GenerateInvoiceHandler(w http.ResponseWriter, r *http.Request) {
	orderId := strings.TrimSpace(r.URL.Query().Get("orderId"))
	if orderId == "" {
		http.Error(w, "Query parameter 'orderId' is required", http.StatusBadRequest)
		return
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
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
