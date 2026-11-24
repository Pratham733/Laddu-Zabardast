package cart

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

const reorderHistorySize = 32

type reorderReceipt struct {
	RequestID string   `bson:"requestId"`
	OrderID   string   `bson:"orderId"`
	Added     int      `bson:"added"`
	Skipped   []string `bson:"skipped"`
}

type ReorderResponse struct {
	Items   []CartItemPacket `json:"items"`
	Added   int              `json:"added"`
	Skipped []string         `json:"skipped"`
}

// Reorder adds the order's available lines to the current cart. The revision
// and receipt are written with the items so concurrent adds and retries are safe.
func Reorder(ctx context.Context, userID, orderID, requestID string, ordered []CartItem) (*ReorderResponse, error) {
	collection := getCollection()
	for {
		var current UserCart
		err := collection.FindOne(ctx, bson.M{"_id": userID}).Decode(&current)
		missing := errors.Is(err, mongo.ErrNoDocuments)
		if err != nil && !missing {
			return nil, err
		}
		for _, receipt := range current.Reorders {
			if receipt.RequestID == requestID {
				if receipt.OrderID != orderID {
					return nil, errors.New("duplicate reorder request")
				}
				return reorderResponse(ctx, current.Items, receipt)
			}
		}

		catalog, err := loadCartCatalog(ctx, ordered)
		if err != nil {
			return nil, err
		}
		receipt := reorderReceipt{RequestID: requestID, OrderID: orderID, Skipped: []string{}}
		items := append([]CartItem{}, current.Items...)
		index := make(map[string]int, len(items))
		for i, item := range items {
			id := item.ID
			if item.Box == nil {
				id = product.LineID(cartProductID(item), item.Sweetener)
			}
			index[id] = i
		}
		for _, item := range ordered {
			priced, err := priceCartLine(item, catalog, true)
			if err != nil || item.Quantity <= 0 {
				label := item.Name
				if item.Sweetener.Label() != "" {
					label += " (" + item.Sweetener.Label() + ")"
				}
				if label == "" {
					label = "Item from previous order"
				}
				receipt.Skipped = append(receipt.Skipped, label)
				continue
			}
			if i, ok := index[priced.ID]; ok {
				if items[i].Quantity > math.MaxInt-priced.Quantity {
					return nil, fmt.Errorf("combined quantity is too large for %s", priced.Name)
				}
				priced.Quantity += items[i].Quantity
				items[i] = priced
			} else {
				index[priced.ID] = len(items)
				items = append(items, priced)
			}
			if receipt.Added > math.MaxInt-item.Quantity {
				return nil, errors.New("combined quantity is too large")
			}
			receipt.Added += item.Quantity
		}
		if receipt.Added == 0 {
			return reorderResponse(ctx, current.Items, receipt)
		}
		reorders := append(current.Reorders, receipt)
		if len(reorders) > reorderHistorySize {
			reorders = reorders[len(reorders)-reorderHistorySize:]
		}
		now := time.Now().UTC().Format(time.RFC3339)
		if missing {
			_, err := collection.InsertOne(ctx, UserCart{UserID: userID, Items: items, UpdatedAt: now, Revision: 1, Reorders: reorders})
			if mongo.IsDuplicateKeyError(err) {
				continue
			}
			if err != nil {
				return nil, err
			}
		} else {
			filter := bson.M{"_id": userID, "revision": current.Revision}
			if current.Revision == 0 {
				filter["revision"] = bson.M{"$exists": false}
			}
			result, err := collection.UpdateOne(ctx, filter, bson.M{
				"$set": bson.M{"items": items, "updatedAt": now, "reorders": reorders},
				"$inc": bson.M{"revision": 1},
			})
			if err != nil {
				return nil, err
			}
			if result.MatchedCount == 0 {
				continue
			}
		}
		return reorderResponse(ctx, items, receipt)
	}
}

func reorderResponse(ctx context.Context, items []CartItem, receipt reorderReceipt) (*ReorderResponse, error) {
	current, err := refreshCartItems(ctx, items, false)
	if err != nil {
		return nil, err
	}
	return &ReorderResponse{Items: CartItemsToPacketList(current), Added: receipt.Added, Skipped: receipt.Skipped}, nil
}
