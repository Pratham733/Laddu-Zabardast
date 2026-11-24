package product

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

type FoodDetails struct {
	Ingredients string `bson:"ingredients,omitempty" json:"ingredients,omitempty"`
	Allergens   string `bson:"allergens,omitempty" json:"allergens,omitempty"`
	ShelfLife   string `bson:"shelfLife,omitempty" json:"shelfLife,omitempty"`
	Storage     string `bson:"storage,omitempty" json:"storage,omitempty"`
}

func normalizeFoodDetails(details FoodDetails) (FoodDetails, error) {
	fields := []struct {
		label string
		value *string
		max   int
	}{
		{"ingredients", &details.Ingredients, 1000},
		{"allergens", &details.Allergens, 500},
		{"shelf life", &details.ShelfLife, 120},
		{"storage instructions", &details.Storage, 500},
	}
	for _, field := range fields {
		*field.value = strings.TrimSpace(*field.value)
		if utf8.RuneCountInString(*field.value) > field.max {
			return FoodDetails{}, fmt.Errorf("%s must be at most %d characters", field.label, field.max)
		}
	}
	return details, nil
}

func normalizeVariantDetails(variants map[Sweetener]FoodDetails) (map[Sweetener]FoodDetails, error) {
	clean := make(map[Sweetener]FoodDetails, len(variants))
	for option, details := range variants {
		if option.Label() == "" {
			return nil, fmt.Errorf("invalid sweetener for product details")
		}
		normalized, err := normalizeFoodDetails(details)
		if err != nil {
			return nil, err
		}
		if normalized != (FoodDetails{}) {
			clean[option] = normalized
		}
	}
	return clean, nil
}
