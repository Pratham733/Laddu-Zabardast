package cart

import (
	"context"
	"fmt"
	"math"

	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/box"
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

func loadCartCatalog(ctx context.Context, items []CartItem) (map[string]product.Product, error) {
	ids := make([]string, 0, len(items))
	for _, item := range items {
		if item.Box != nil {
			ids = item.Box.AppendProductIDs(ids)
		} else {
			ids = append(ids, cartProductID(item))
		}
	}
	return product.AvailableByID(ctx, ids)
}

func priceCartLine(item CartItem, catalog map[string]product.Product, requireAvailable bool) (CartItem, error) {
	if item.Box != nil {
		priced, err := box.Price(*item.Box, catalog)
		if err != nil {
			return CartItem{}, err
		}
		return CartItem{
			ID: priced.ID, Name: priced.Selection.Name(), Quantity: item.Quantity,
			Price: priced.Price, Category: string(product.TypeLaddu), Box: &priced.Selection,
		}, nil
	}

	id := cartProductID(item)
	p, ok := catalog[id]
	if !ok {
		return CartItem{}, fmt.Errorf("product %s is unavailable", id)
	}
	choice, price, err := p.UnitPrice(item.Sweetener)
	if err != nil {
		if requireAvailable {
			return CartItem{}, err
		}
		price = item.Price
	}
	return CartItem{
		ID: product.LineID(p.ID, choice), ProductID: p.ID, Name: p.Name, Description: p.Description,
		ImageUrl: p.ImageUrl, Price: price, Category: p.Category, Quantity: item.Quantity,
		Sweetener: choice, SweetenerPrices: p.Options(), SweetenerUnavailable: err != nil,
	}, nil
}

func refreshCartItems(ctx context.Context, items []CartItem, requireAvailable bool) ([]CartItem, error) {
	catalog, err := loadCartCatalog(ctx, items)
	if err != nil {
		return nil, err
	}

	updated := make([]CartItem, 0, len(items))
	lines := make(map[string]int)
	for _, item := range items {
		priced, err := priceCartLine(item, catalog, requireAvailable)
		if err != nil {
			if requireAvailable {
				return nil, err
			}
			continue
		}
		if index, ok := lines[priced.ID]; ok {
			if priced.Box != nil {
				return nil, fmt.Errorf("combine identical boxes into one cart line")
			}
			if priced.Quantity > math.MaxInt-updated[index].Quantity {
				return nil, fmt.Errorf("combined quantity is too large for %s", priced.Name)
			}
			updated[index].Quantity += priced.Quantity
			continue
		}
		lines[priced.ID] = len(updated)
		updated = append(updated, priced)
	}
	return updated, nil
}
