package box

import (
	"slices"
	"testing"

	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
)

func TestPrice(t *testing.T) {
	catalog := map[string]product.Product{
		"besan":   {Name: "Besan Laddu", Price: 120.5, Category: "laddu", Available: true},
		"coconut": {Name: "Coconut Laddu", Price: 145.25, Category: "laddu", Available: true},
		"pickle":  {Name: "Mango Pickle", Price: 170, Category: "pickle", Available: true},
		"soldout": {Name: "Sold Out Laddu", Price: 60, Category: "laddu"},
	}
	items := []Component{
		{ProductID: "coconut", Quantity: 4, Name: "Incorrect name"},
		{ProductID: "besan", Quantity: 5},
	}
	first, err := Price(Selection{Size: 9, Items: items}, catalog)
	if err != nil {
		t.Fatal(err)
	}
	if first.Price != 1183.50 || first.Selection.Items[1].Name != "Coconut Laddu" {
		t.Fatalf("unexpected box pricing or contents: %+v", first)
	}
	slices.Reverse(items)
	second, err := Price(Selection{Size: 9, Items: items}, catalog)
	if err != nil || first.ID != second.ID {
		t.Fatalf("changing selection order changed box identity: %+v, %v", second, err)
	}

	for _, id := range []string{"pickle", "soldout", "missing"} {
		t.Run(id, func(t *testing.T) {
			if _, err := Price(Selection{Size: 16, Items: []Component{{ProductID: id, Quantity: 16}}}, catalog); err == nil {
				t.Fatal("accepted unavailable or non-laddu product")
			}
		})
	}
}

func TestValidateItem(t *testing.T) {
	for _, tt := range []struct {
		name      string
		productID string
		box       *Selection
		wantError bool
	}{
		{name: "single product", productID: "besan"},
		{name: "complete box", box: &Selection{Size: 16, Items: []Component{{ProductID: "besan", Quantity: 16}}}},
		{name: "underfilled", box: &Selection{Size: 9, Items: []Component{{ProductID: "besan", Quantity: 8}}}, wantError: true},
		{name: "overfilled", box: &Selection{Size: 9, Items: []Component{{ProductID: "besan", Quantity: 10}}}, wantError: true},
		{name: "bad size", box: &Selection{Size: 10, Items: []Component{{ProductID: "besan", Quantity: 10}}}, wantError: true},
		{name: "both line types", productID: "besan", box: &Selection{Size: 9}, wantError: true},
		{name: "duplicate", box: &Selection{Size: 9, Items: []Component{{ProductID: "besan", Quantity: 4}, {ProductID: " besan ", Quantity: 5}}}, wantError: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			if err := ValidateItem(tt.productID, tt.box); (err != nil) != tt.wantError {
				t.Fatalf("unexpected validation result: %v", err)
			}
		})
	}
}
