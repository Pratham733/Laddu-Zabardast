package packet

type ProductType string

const (
	Laddu  ProductType = "laddu"
	Pickle ProductType = "pickle"
	All    ProductType = "all"
)

type ProductPacket struct {
	ID          string      `json:"_id,omitempty"`
	Key         string      `json:"key"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Price       float64     `json:"price"`
	ImageUrl    string      `json:"imageUrl"`
	Category    string      `json:"category"`
	ProductType ProductType `json:"productType"`
	Available   bool        `json:"available"`
	Weight      string      `json:"weight,omitempty"`
}

type CreateProductRequest struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Price       float64     `json:"price"`
	ImageUrl    string      `json:"imageUrl"`
	Category    string      `json:"category"`
	ProductType ProductType `json:"productType"`
	Available   bool        `json:"available"`
	Weight      string      `json:"weight,omitempty"`
}
