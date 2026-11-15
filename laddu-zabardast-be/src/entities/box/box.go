package box

import (
	"crypto/sha256"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"

	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
)

type Component struct {
	ProductID string `bson:"productId" json:"productId"`
	Quantity  int    `bson:"quantity" json:"quantity"`
	Name      string `bson:"name,omitempty" json:"name,omitempty"`
}

type Selection struct {
	Size  int         `bson:"size" json:"size"`
	Items []Component `bson:"items" json:"items"`
}

func (s Selection) Name() string {
	return fmt.Sprintf("Custom Laddu Box (%d)", s.Size)
}

// ValidateItem checks the two supported cart and order line shapes.
func ValidateItem(productID string, selection *Selection) error {
	productID = strings.TrimSpace(productID)
	if selection == nil {
		if productID == "" {
			return errors.New("productId is required")
		}
		return nil
	}
	if productID != "" {
		return errors.New("a box line cannot also specify a productId")
	}
	if selection.Size != 9 && selection.Size != 16 {
		return errors.New("box size must be 9 or 16")
	}
	if len(selection.Items) > selection.Size {
		return errors.New("too many items for this box")
	}
	remaining := selection.Size
	seen := make(map[string]bool, len(selection.Items))
	for _, component := range selection.Items {
		id := strings.TrimSpace(component.ProductID)
		if id == "" || component.Quantity < 1 || component.Quantity > remaining {
			return errors.New("invalid laddu selection or quantity")
		}
		if seen[id] {
			return errors.New("combine quantities for the same laddu")
		}
		seen[id] = true
		remaining -= component.Quantity
	}
	if remaining != 0 {
		return fmt.Errorf("fill the box with exactly %d laddus", selection.Size)
	}
	return nil
}

func (s Selection) AppendProductIDs(ids []string) []string {
	for _, item := range s.Items {
		ids = append(ids, strings.TrimSpace(item.ProductID))
	}
	return ids
}

type PricedSelection struct {
	ID        string
	Selection Selection
	Price     float64
}

func Price(selection Selection, catalog map[string]product.Product) (PricedSelection, error) {
	if err := ValidateItem("", &selection); err != nil {
		return PricedSelection{}, err
	}
	items := make([]Component, 0, len(selection.Items))
	var cents float64
	for _, component := range selection.Items {
		id := strings.TrimSpace(component.ProductID)
		p, ok := catalog[id]
		if !ok || !p.Available || p.Category != string(product.TypeLaddu) || p.Price <= 0 {
			return PricedSelection{}, fmt.Errorf("laddu %s is unavailable for custom boxes", id)
		}
		cents += math.Round(p.Price*100) * float64(component.Quantity)
		items = append(items, Component{ProductID: id, Quantity: component.Quantity, Name: p.Name})
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ProductID < items[j].ProductID })
	key := sha256.New()
	fmt.Fprintf(key, "%d;", selection.Size)
	for _, item := range items {
		fmt.Fprintf(key, "%d:%s:%d;", len(item.ProductID), item.ProductID, item.Quantity)
	}
	return PricedSelection{
		ID:        fmt.Sprintf("box-%x", key.Sum(nil)),
		Selection: Selection{Size: selection.Size, Items: items},
		Price:     cents / 100,
	}, nil
}
