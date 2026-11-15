package cart

import (
	"context"
	"fmt"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/box"
	"math"

	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func getCollection() *mongo.Collection {
	return db.GetCollection(db.DefaultDB, CollectionCarts)
}

func cartProductID(item CartItem) string {
	if item.ProductID != "" {
		return item.ProductID
	}
	return item.ID
}

func refreshCartItems(ctx context.Context, items []CartItem, requireAvailable bool) ([]CartItem, error) {
	ids := make([]string, 0, len(items))
	for _, item := range items {
		if item.Box != nil {
			ids = item.Box.AppendProductIDs(ids)
		} else {
			ids = append(ids, cartProductID(item))
		}
	}
	catalog, err := product.AvailableByID(ctx, ids)
	if err != nil {
		return nil, err
	}

	updated := make([]CartItem, 0, len(items))
	boxes := make(map[string]bool)
	for _, item := range items {
		if item.Box != nil {
			priced, err := box.Price(*item.Box, catalog)
			if err != nil {
				if requireAvailable {
					return nil, err
				}
				continue
			}
			if boxes[priced.ID] {
				return nil, fmt.Errorf("combine identical boxes into one cart line")
			}
			boxes[priced.ID] = true
			updated = append(updated, CartItem{
				ID: priced.ID, Name: priced.Selection.Name(), Quantity: item.Quantity,
				Price: priced.Price, Category: string(product.TypeLaddu), Box: &priced.Selection,
			})
			continue
		}

		id := cartProductID(item)
		p, ok := catalog[id]
		if !ok {
			if requireAvailable {
				return nil, fmt.Errorf("product %s is unavailable", id)
			}
			continue
		}
		updated = append(updated, CartItem{
			ID: p.ID, ProductID: p.ID, Name: p.Name, Description: p.Description,
			ImageUrl: p.ImageUrl, Price: math.Round(p.Price*100) / 100, Category: p.Category, Quantity: item.Quantity,
		})
	}
	return updated, nil
}
