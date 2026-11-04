package product

import "encoding/json"

// ProductPacket represents a product in API requests and responses.
type ProductPacket struct {
	ID          string      `json:"id"`
	MongoID     string      `json:"_id,omitempty"`
	Key         string      `json:"key"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Price       float64     `json:"price"`
	ImageUrl    string      `json:"imageUrl"`
	Category    string      `json:"category"`
	ProductType ProductType `json:"productType,omitempty"`
	Available   bool        `json:"available"`
	Weight      string      `json:"weight,omitempty"`
}

func (p ProductPacket) MarshalJSON() ([]byte, error) {
	type Alias ProductPacket
	return json.Marshal(&struct {
		Alias
		ID      string `json:"id"`
		MongoID string `json:"_id"`
	}{
		Alias:   (Alias)(p),
		ID:      p.ID,
		MongoID: p.ID,
	})
}

// CreateProductRequest represents the incoming request payload to create a product.
type CreateProductRequest struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Price       float64     `json:"price"`
	ImageUrl    string      `json:"imageUrl"`
	Category    string      `json:"category"`
	ProductType ProductType `json:"productType,omitempty"`
	Available   bool        `json:"available"`
	Weight      string      `json:"weight,omitempty"`
}

// UpdateProductRequest represents the incoming request payload to update a product.
type UpdateProductRequest struct {
	Name        *string      `json:"name,omitempty"`
	Description *string      `json:"description,omitempty"`
	Price       *float64     `json:"price,omitempty"`
	ImageUrl    *string      `json:"imageUrl,omitempty"`
	Category    *string      `json:"category,omitempty"`
	ProductType *ProductType `json:"productType,omitempty"`
	Available   *bool        `json:"available,omitempty"`
	Weight      *string      `json:"weight,omitempty"`
}

// Conversion functions

func ProductToPacket(p Product) ProductPacket {
	pType := ProductType(p.Category)
	return ProductPacket{
		ID:          p.ID,
		MongoID:     p.ID,
		Key:         p.Key,
		Name:        p.Name,
		Description: p.Description,
		Price:       p.Price,
		ImageUrl:    p.ImageUrl,
		Category:    p.Category,
		ProductType: pType,
		Available:   p.Available,
		Weight:      p.Weight,
	}
}

func ProductsToPacketList(products []Product) []ProductPacket {
	result := make([]ProductPacket, 0, len(products))
	for _, p := range products {
		result = append(result, ProductToPacket(p))
	}
	return result
}
