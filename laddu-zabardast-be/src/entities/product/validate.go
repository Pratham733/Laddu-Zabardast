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

func validateUpdateProductReq(id string, updates bson.M) error {
	if err := validateProductId(id); err != nil {
		return err
	}
	delete(updates, "_id")
	delete(updates, "id")
	if len(updates) == 0 {
		return errors.New("no fields to update")
	}
	return nil
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
