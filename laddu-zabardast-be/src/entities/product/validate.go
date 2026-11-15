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
	if strings.TrimSpace(req.Name) == "" || req.Price <= 0 || strings.TrimSpace(req.Category) == "" || strings.TrimSpace(req.ImageUrl) == "" {
		return errors.New("product name, positive price, category, and imageUrl are required")
	}
	return nil
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
		if *req.Price <= 0 {
			return nil, errors.New("price must be positive")
		}
		updates["price"] = *req.Price
	}
	if req.Available != nil {
		updates["available"] = *req.Available
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
