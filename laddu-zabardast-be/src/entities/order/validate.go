package order

import (
	"errors"
	"github.com/Pratham733/laddu-zabardast-be/src/email"
	"strings"
	"unicode/utf8"

	"github.com/Pratham733/laddu-zabardast-be/src/entities/box"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func validateOrderId(id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("order ID is required")
	}
	return nil
}

func validateCreateOrderReq(req CreateOrderRequestPacket) error {
	if len(req.Items) == 0 {
		return errors.New("order must contain at least one item")
	}

	if req.TotalAmount <= 0 {
		return errors.New("order totalAmount must be greater than zero")
	}

	if strings.TrimSpace(req.ShippingDetails.Name) == "" ||
		strings.TrimSpace(req.ShippingDetails.Email) == "" ||
		strings.TrimSpace(req.ShippingDetails.City) == "" {
		return errors.New("shipping details (name, email, city) are required")
	}

	if !email.IsMailbox(strings.TrimSpace(req.ShippingDetails.Email)) {
		return errors.New("enter a valid checkout email address")
	}
	if utf8.RuneCountInString(strings.TrimSpace(req.Instructions)) > 500 {
		return errors.New("order instructions must be at most 500 characters")
	}

	for _, item := range req.Items {
		if item.Box != nil && item.Sweetener != "" {
			return errors.New("sweetener is only supported on individual products")
		}
		if err := box.ValidateItem(item.ProductID, item.Box); err != nil {
			return err
		}
		if item.Quantity <= 0 {
			return errors.New("each order item must have a quantity greater than zero")
		}
	}

	return nil
}

func validateUpdateOrderStatus(id string, req UpdateOrderStatusRequestPacket) (bson.M, error) {
	if err := validateOrderId(id); err != nil {
		return nil, err
	}

	updateFields := bson.M{}
	if status := strings.ToLower(strings.TrimSpace(req.OrderStatus)); status != "" {
		switch status {
		case OrderStatusPending, OrderStatusProcessing, OrderStatusShipped, OrderStatusDelivered, OrderStatusCancelled:
			updateFields["orderStatus"] = status
			updateFields["status"] = status
		default:
			return nil, errors.New("invalid orderStatus")
		}
	}
	if status := strings.ToLower(strings.TrimSpace(req.PaymentStatus)); status != "" {
		switch status {
		case PaymentStatusPending, PaymentStatusPaid, PaymentStatusFailed, "completed":
			updateFields["paymentStatus"] = status
		default:
			return nil, errors.New("invalid paymentStatus")
		}
	}
	if len(updateFields) == 0 {
		return nil, errors.New("no orderStatus or paymentStatus provided to update")
	}
	return updateFields, nil
}

func validateInvoiceOrderId(orderId string) error {
	if strings.TrimSpace(orderId) == "" {
		return errors.New("query parameter 'orderId' is required")
	}
	return nil
}
