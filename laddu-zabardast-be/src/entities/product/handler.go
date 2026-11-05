package product

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetProducts(w http.ResponseWriter, r *http.Request) (*GetProductsResponsePacket, error) {
	category := r.URL.Query().Get("category")
	filter := bson.M{}
	if category != "" && category != CategoryAll {
		filter["category"] = category
	}

	collection := getCollection()
	cursor, err := collection.Find(r.Context(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(r.Context())

	var products []Product
	if err := cursor.All(r.Context(), &products); err != nil {
		return nil, err
	}

	packets := ProductsToPacketList(products)
	return &GetProductsResponsePacket{
		Products: packets,
	}, nil
}

func GetProduct(w http.ResponseWriter, r *http.Request) (*GetProductResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if err := validateProductId(id); err != nil {
		return nil, err
	}

	collection := getCollection()
	var prod Product
	err := collection.FindOne(r.Context(), bson.M{"_id": id}).Decode(&prod)
	if err != nil {
		return nil, errors.New("product not found")
	}

	packet := ProductToPacket(prod)
	return &GetProductResponsePacket{
		Product: packet,
	}, nil
}

func CreateProduct(w http.ResponseWriter, r *http.Request, req CreateProductRequestPacket) (*ProductActionResponsePacket, error) {
	if err := validateCreateProductReq(req); err != nil {
		return nil, err
	}

	available := true
	if req.Available {
		available = req.Available
	}

	newProduct := Product{
		ID:          uuid.NewString(),
		Key:         GenerateProductKey(req.Name),
		Name:        strings.TrimSpace(req.Name),
		Description: strings.TrimSpace(req.Description),
		Price:       req.Price,
		ImageUrl:    strings.TrimSpace(req.ImageUrl),
		Category:    strings.TrimSpace(req.Category),
		Available:   available,
		Weight:      strings.TrimSpace(req.Weight),
	}

	collection := getCollection()
	_, err := collection.InsertOne(r.Context(), newProduct)
	if err != nil {
		return nil, err
	}

	allProducts := fetchAllProducts(r.Context())
	productPacket := ProductToPacket(newProduct)

	w.WriteHeader(http.StatusCreated)
	return &ProductActionResponsePacket{
		Product:  &productPacket,
		Products: allProducts,
		Success:  true,
		Message:  "Product created successfully",
	}, nil
}

func UpdateProduct(w http.ResponseWriter, r *http.Request, updates bson.M) (*ProductActionResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if err := validateUpdateProductReq(id, updates); err != nil {
		return nil, err
	}

	if name, ok := updates["name"].(string); ok && name != "" {
		updates["key"] = GenerateProductKey(name)
	}

	collection := getCollection()
	result, err := collection.UpdateOne(r.Context(), bson.M{"_id": id}, bson.M{"$set": updates})
	if err != nil {
		return nil, err
	}
	if result.MatchedCount == 0 {
		return nil, errors.New("product not found")
	}

	var updated Product
	_ = collection.FindOne(r.Context(), bson.M{"_id": id}).Decode(&updated)
	allProducts := fetchAllProducts(r.Context())
	productPacket := ProductToPacket(updated)

	return &ProductActionResponsePacket{
		Product:  &productPacket,
		Products: allProducts,
		Success:  true,
		Message:  "Product updated successfully",
	}, nil
}

func DeleteProduct(w http.ResponseWriter, r *http.Request) (*ProductActionResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if err := validateProductId(id); err != nil {
		return nil, err
	}

	collection := getCollection()
	result, err := collection.DeleteOne(r.Context(), bson.M{"_id": id})
	if err != nil {
		return nil, err
	}
	if result.DeletedCount == 0 {
		return nil, errors.New("product not found")
	}

	allProducts := fetchAllProducts(r.Context())
	return &ProductActionResponsePacket{
		Products: allProducts,
		Success:  true,
		Message:  "Product deleted successfully",
	}, nil
}

func SearchProducts(w http.ResponseWriter, r *http.Request) (*GetProductsResponsePacket, error) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if err := validateSearchQuery(query); err != nil {
		return nil, err
	}

	collection := getCollection()
	filter := bson.M{"name": bson.M{"$regex": query, "$options": "i"}}
	opts := options.Find().SetLimit(10)

	cursor, err := collection.Find(r.Context(), filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(r.Context())

	var products []Product
	if err := cursor.All(r.Context(), &products); err != nil {
		return nil, err
	}

	packets := ProductsToPacketList(products)
	return &GetProductsResponsePacket{
		Products: packets,
	}, nil
}

func UploadProductImage(w http.ResponseWriter, r *http.Request) (*UploadImageResponsePacket, error) {
	if r.Method != http.MethodPost {
		return nil, errors.New("method not allowed")
	}

	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		return nil, errors.New("file too large or invalid multipart form")
	}

	file, fileHeader, err := r.FormFile("image")
	if err != nil {
		return nil, errors.New("missing 'image' file field")
	}
	defer file.Close()

	ext := filepath.Ext(fileHeader.Filename)
	if err := validateImageExtension(ext); err != nil {
		return nil, err
	}

	_ = os.MkdirAll(UploadDir, 0755)

	filename := uuid.NewString() + strings.ToLower(ext)
	destPath := filepath.Join(UploadDir, filename)

	dst, err := os.Create(destPath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return nil, err
	}

	imageURL := "/uploads/" + filename
	return &UploadImageResponsePacket{
		ImageUrl: imageURL,
		Filename: filename,
		Success:  true,
		Message:  "Image uploaded successfully",
	}, nil
}
