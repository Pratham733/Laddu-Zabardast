package order

import (
	"errors"
	"strings"

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

	for _, item := range req.Items {
		if strings.TrimSpace(item.ProductID) == "" {
			return errors.New("each order item must have a valid productId")
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
	status := strings.TrimSpace(req.OrderStatus)
	if status != "" {
		updateFields["orderStatus"] = status
		updateFields["status"] = status
	}
	if pStatus := strings.TrimSpace(req.PaymentStatus); pStatus != "" {
		updateFields["paymentStatus"] = pStatus
	}

	if len(updateFields) == 0 {
		return nil, errors.New("no orderStatus or paymentStatus provided to update")
	}

	return updateFields, nil
}

func validatePatchOrderStatus(req UpdateOrderStatusRequestPacket) (bson.M, error) {
	if strings.TrimSpace(req.OrderID) == "" {
		return nil, errors.New("orderId is required in request body")
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
		return nil, errors.New("orderStatus or paymentStatus is required to update")
	}

	return updateFields, nil
}

func validateInvoiceOrderId(orderId string) error {
	if strings.TrimSpace(orderId) == "" {
		return errors.New("query parameter 'orderId' is required")
	}
	return nil
}
