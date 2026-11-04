package product

const (
	CollectionProducts = "products"

	CategoryAll = "all"

	UploadDir = "public/uploads"
)

type ProductType string

const (
	TypeLaddu  ProductType = "laddu"
	TypePickle ProductType = "pickle"
	TypeAll    ProductType = "all"
)
