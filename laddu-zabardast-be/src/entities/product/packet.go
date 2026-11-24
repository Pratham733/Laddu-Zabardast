package product

import "encoding/json"

// ProductPacket represents a product in API requests and responses.
type ProductPacket struct {
	FoodDetails     *FoodDetails              `json:"foodDetails,omitempty"`
	VariantDetails  map[Sweetener]FoodDetails `json:"variantDetails,omitempty"`
	BestSeller      bool                      `json:"bestSeller,omitempty"`
	NewArrival      bool                      `json:"newArrival,omitempty"`
	SweetenerPrices map[Sweetener]float64     `json:"sweetenerPrices,omitempty"`
	ID              string                    `json:"id"`
	MongoID         string                    `json:"_id,omitempty"`
	Key             string                    `json:"key"`
	Name            string                    `json:"name"`
	Description     string                    `json:"description"`
	Price           float64                   `json:"price"`
	ImageUrl        string                    `json:"imageUrl"`
	Category        string                    `json:"category"`
	ProductType     ProductType               `json:"productType,omitempty"`
	Available       bool                      `json:"available"`
	Weight          string                    `json:"weight,omitempty"`
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

// CreateProductRequestPacket represents the incoming request payload to create a product.
type CreateProductRequestPacket struct {
	FoodDetails     *FoodDetails              `json:"foodDetails,omitempty"`
	VariantDetails  map[Sweetener]FoodDetails `json:"variantDetails,omitempty"`
	BestSeller      bool                      `json:"bestSeller,omitempty"`
	NewArrival      bool                      `json:"newArrival,omitempty"`
	SweetenerPrices map[Sweetener]float64     `json:"sweetenerPrices,omitempty"`
	Name            string                    `json:"name"`
	Description     string                    `json:"description"`
	Price           float64                   `json:"price"`
	ImageUrl        string                    `json:"imageUrl"`
	Category        string                    `json:"category"`
	ProductType     ProductType               `json:"productType,omitempty"`
	Available       *bool                     `json:"available,omitempty"`
	Weight          string                    `json:"weight,omitempty"`
}

type CreateProductRequest = CreateProductRequestPacket

// UpdateProductRequestPacket represents the incoming request payload to update a product.
type UpdateProductRequestPacket struct {
	FoodDetails     *FoodDetails               `json:"foodDetails,omitempty"`
	VariantDetails  *map[Sweetener]FoodDetails `json:"variantDetails,omitempty"`
	BestSeller      *bool                      `json:"bestSeller,omitempty"`
	NewArrival      *bool                      `json:"newArrival,omitempty"`
	SweetenerPrices *map[Sweetener]float64     `json:"sweetenerPrices,omitempty"`
	Name            *string                    `json:"name,omitempty"`
	Description     *string                    `json:"description,omitempty"`
	Price           *float64                   `json:"price,omitempty"`
	ImageUrl        *string                    `json:"imageUrl,omitempty"`
	Category        *string                    `json:"category,omitempty"`
	ProductType     *ProductType               `json:"productType,omitempty"`
	Available       *bool                      `json:"available,omitempty"`
	Weight          *string                    `json:"weight,omitempty"`
}

type UpdateProductRequest = UpdateProductRequestPacket

type GetProductsResponsePacket struct {
	Products []ProductPacket `json:"products"`
}

type GetProductResponsePacket struct {
	Product ProductPacket `json:"product"`
}

type ProductActionResponsePacket struct {
	Product  *ProductPacket  `json:"product,omitempty"`
	Products []ProductPacket `json:"products,omitempty"`
	Success  bool            `json:"success"`
	Message  string          `json:"message,omitempty"`
}

type UploadImageResponsePacket struct {
	ImageUrl string `json:"imageUrl"`
	Filename string `json:"filename"`
	Success  bool   `json:"success"`
	Message  string `json:"message,omitempty"`
}

// Conversion functions

func ProductToPacket(p Product) ProductPacket {
	pType := ProductType(p.Category)
	return ProductPacket{
		FoodDetails:     p.FoodDetails,
		VariantDetails:  p.VariantDetails,
		BestSeller:      p.BestSeller,
		NewArrival:      p.NewArrival,
		SweetenerPrices: p.Options(),
		ID:              p.ID,
		MongoID:         p.ID,
		Key:             p.Key,
		Name:            p.Name,
		Description:     p.Description,
		Price:           p.Price,
		ImageUrl:        p.ImageUrl,
		Category:        p.Category,
		ProductType:     pType,
		Available:       p.Available,
		Weight:          p.Weight,
	}
}

func ProductsToPacketList(products []Product) []ProductPacket {
	result := make([]ProductPacket, 0, len(products))
	for _, p := range products {
		result = append(result, ProductToPacket(p))
	}
	return result
}
