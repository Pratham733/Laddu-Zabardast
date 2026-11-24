package product

import (
	"fmt"
	"math"
)

type Sweetener string

const (
	Jaggery   Sweetener = "jaggery"
	SugarFree Sweetener = "sugarfree"
	Honey     Sweetener = "honey"
)

func (s Sweetener) Label() string {
	switch s {
	case Jaggery:
		return "Jaggery"
	case SugarFree:
		return "Sugar-free"
	case Honey:
		return "Honey"
	default:
		return ""
	}
}

func validPrice(price float64) bool {
	cents := price * 100
	return cents >= 1 && !math.IsInf(cents, 0) && math.Abs(cents-math.Round(cents)) < 0.00001
}

func validateSweetenerPrices(prices map[Sweetener]float64) error {
	for choice, price := range prices {
		if (choice != SugarFree && choice != Honey) || !validPrice(price) {
			return fmt.Errorf("each sweetener option needs a supported name and a positive price with at most two decimal places")
		}
	}
	return nil
}

func (p Product) Options() map[Sweetener]float64 {
	if p.Category != string(TypeLaddu) {
		return nil
	}
	prices := map[Sweetener]float64{Jaggery: math.Round(p.Price*100) / 100}
	for _, choice := range []Sweetener{SugarFree, Honey} {
		if price := p.SweetenerPrices[choice]; validPrice(price) {
			prices[choice] = price
		}
	}
	return prices
}

// UnitPrice resolves legacy laddu lines to jaggery and rejects unavailable choices.
func (p Product) UnitPrice(choice Sweetener) (Sweetener, float64, error) {
	if p.Category == string(TypeLaddu) {
		if choice == "" {
			choice = Jaggery
		}
		if price := p.Options()[choice]; price > 0 {
			return choice, price, nil
		}
	} else if choice == "" && p.Price > 0 {
		return "", math.Round(p.Price*100) / 100, nil
	}
	return choice, 0, fmt.Errorf("the selected option for %s is unavailable", p.Name)
}

func LineID(productID string, choice Sweetener) string {
	if choice == "" || choice == Jaggery {
		return productID
	}
	return productID + ":" + string(choice)
}
