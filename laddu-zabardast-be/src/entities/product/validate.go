package product

import (
	"errors"
	"strings"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func validateProductId(id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("product ID is required")
	}
	return nil
}

func validateCreateProductReq(req CreateProductRequestPacket) error {
	if strings.TrimSpace(req.Name) == "" || !validPrice(req.Price) || strings.TrimSpace(req.Category) == "" || strings.TrimSpace(req.ImageUrl) == "" {
		return errors.New("product name, positive price, category, and imageUrl are required")
	}
	return validateSweetenerPrices(req.SweetenerPrices)
}

func validateUpdateProductReq(id string, req UpdateProductRequestPacket) (bson.M, error) {
	if err := validateProductId(id); err != nil {
		return nil, err
	}
	updates := bson.M{}
	for key, value := range map[string]*string{
		"name": req.Name, "description": req.Description, "category": req.Category,
		"imageUrl": req.ImageUrl, "weight": req.Weight,
	} {
		if value == nil {
			continue
		}
		field := strings.TrimSpace(*value)
		if field == "" && (key == "name" || key == "category" || key == "imageUrl") {
			return nil, errors.New(key + " cannot be empty")
		}
		updates[key] = field
	}
	if name, ok := updates["name"].(string); ok {
		updates["key"] = GenerateProductKey(name)
	}
	if req.Price != nil {
		if !validPrice(*req.Price) {
			return nil, errors.New("price must be positive with at most two decimal places")
		}
		updates["price"] = *req.Price
	}
	if req.Available != nil {
		updates["available"] = *req.Available
	}
	if req.BestSeller != nil {
		updates["bestSeller"] = *req.BestSeller
	}
	if req.NewArrival != nil {
		updates["newArrival"] = *req.NewArrival
	}
	if req.SweetenerPrices != nil {
		if err := validateSweetenerPrices(*req.SweetenerPrices); err != nil {
			return nil, err
		}
		updates["sweetenerPrices"] = *req.SweetenerPrices
	}
	if req.FoodDetails != nil {
		details, err := normalizeFoodDetails(*req.FoodDetails)
		if err != nil {
			return nil, err
		}
		updates["foodDetails"] = details
	}
	if req.VariantDetails != nil {
		details, err := normalizeVariantDetails(*req.VariantDetails)
		if err != nil {
			return nil, err
		}
		updates["variantDetails"] = details
	}
	if len(updates) == 0 {
		return nil, errors.New("no fields to update")
	}
	return updates, nil
}

func validateSearchQuery(query string) error {
	if strings.TrimSpace(query) == "" {
		return errors.New("query parameter 'q' is required")
	}
	return nil
}

func validateImageExtension(ext string) error {
	ext = strings.ToLower(ext)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		return errors.New("invalid image type. Allowed: jpg, jpeg, png, webp")
	}
	return nil
}

func imageMatchesExtension(ext, contentType string) bool {
	switch strings.ToLower(ext) {
	case ".jpg", ".jpeg":
		return contentType == "image/jpeg"
	case ".png":
		return contentType == "image/png"
	case ".webp":
		return contentType == "image/webp"
	default:
		return false
	}
}
