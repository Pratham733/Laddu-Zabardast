package order

import (
	"context"
	"errors"
	"github.com/Pratham733/laddu-zabardast-be/src/email"
	"net/http"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var fulfillmentSteps = [...]string{OrderStatusPending, OrderStatusProcessing, OrderStatusShipped, OrderStatusDelivered}

func canChangeStatus(current, next string) bool {
	if current == next {
		return true
	}
	if next == OrderStatusCancelled {
		return current == OrderStatusPending
	}
	if current == OrderStatusCancelled {
		return false
	}
	from, to := -1, -1
	for index, step := range fulfillmentSteps {
		if step == current {
			from = index
		}
		if step == next {
			to = index
		}
	}
	return from >= 0 && to > from
}

func CancelOrder(_ http.ResponseWriter, r *http.Request) (utils.SuccessResponsePacket, error) {
	id := mux.Vars(r)["id"]
	if err := validateOrderId(id); err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	filter, err := orderAccessFilter(r)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	filter["_id"] = id
	return applyOrderUpdate(r.Context(), filter, bson.M{"orderStatus": OrderStatusCancelled, "status": OrderStatusCancelled})
}

func updateOrderFromRequest(r *http.Request, id string, req UpdateOrderStatusRequestPacket) (utils.SuccessResponsePacket, error) {
	fields, err := validateUpdateOrderStatus(id, req)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	return applyOrderUpdate(r.Context(), bson.M{"_id": id}, fields)
}

func statusFilter(status string) any {
	if status == "" {
		return bson.M{"$in": bson.A{"", nil}}
	}
	return status
}

// The status check and notice enqueue are part of one atomic update. A
// simultaneous prepare/cancel can only succeed on one of the two requests.
func applyOrderUpdate(ctx context.Context, scope bson.M, fields bson.M) (utils.SuccessResponsePacket, error) {
	col := getCollection()
	for {
		var ord Order
		err := col.FindOne(ctx, scope).Decode(&ord)
		if errors.Is(err, mongo.ErrNoDocuments) {
			return utils.SuccessResponsePacket{}, errors.New("order not found")
		}
		if err != nil {
			return utils.SuccessResponsePacket{}, err
		}
		status := ord.OrderStatus
		if status == "" {
			status = ord.Status
		}
		if status == "" {
			status = OrderStatusProcessing
		}
		next, changingStatus := fields["orderStatus"].(string)
		if changingStatus && !canChangeStatus(status, next) {
			if next == OrderStatusCancelled {
				return utils.SuccessResponsePacket{}, errors.New("only pending orders can be cancelled")
			}
			return utils.SuccessResponsePacket{}, errors.New("this order cannot move to that status")
		}
		if _, changingPayment := fields["paymentStatus"]; changingPayment && (status == OrderStatusCancelled || next == OrderStatusCancelled) {
			return utils.SuccessResponsePacket{}, errors.New("payment cannot be updated on a cancelled order")
		}

		filter := bson.M{"orderStatus": statusFilter(ord.OrderStatus), "status": statusFilter(ord.Status)}
		for key, value := range scope {
			filter[key] = value
		}
		update := bson.M{"$set": fields}
		if next != status && (next == OrderStatusCancelled || next == OrderStatusDelivered) {
			recipient := ord.ShippingDetails.Email
			if !email.IsMailbox(recipient) {
				recipient = ord.Email
			}
			notices := newOrderEmails(recipient, next, time.Now().UTC())
			if len(notices) > 0 {
				update["$push"] = bson.M{"confirmationEmails": bson.M{"$each": notices}}
			}
		}
		result, err := col.UpdateOne(ctx, filter, update)
		if err != nil {
			return utils.SuccessResponsePacket{}, err
		}
		if result.MatchedCount != 0 {
			return utils.SuccessResponsePacket{Message: "Order updated successfully"}, nil
		}
	}
}
