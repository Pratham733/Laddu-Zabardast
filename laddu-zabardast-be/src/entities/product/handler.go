package product

import (
	"context"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func fetchAllProducts(ctx context.Context) []ProductPacket {
	collection := getCollection()
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return []ProductPacket{}
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil || products == nil {
		return []ProductPacket{}
	}
	return ProductsToPacketList(products)
}

func GenerateProductKey(name string) string {
	return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "_"))
}

func GetProducts(w http.ResponseWriter, r *http.Request) (*GetProductsResponsePacket, error) {
	category := r.URL.Query().Get("category")
	filter := bson.M{}
	if category != "" && category != CategoryAll {
		filter["category"] = category
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil {
		http.Error(w, "Failed to decode products", http.StatusInternalServerError)
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
	if id == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return nil, errors.New("product ID required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var prod Product
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&prod)
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return nil, err
	}

	packet := ProductToPacket(prod)
	return &GetProductResponsePacket{
		Product: packet,
	}, nil
}

func CreateProduct(w http.ResponseWriter, r *http.Request, req CreateProductRequest) (*ProductActionResponsePacket, error) {
	if strings.TrimSpace(req.Name) == "" || req.Price <= 0 || strings.TrimSpace(req.Category) == "" || strings.TrimSpace(req.ImageUrl) == "" {
		http.Error(w, "Product name, positive price, category, and imageUrl are required", http.StatusBadRequest)
		return nil, errors.New("missing required product fields")
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
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, newProduct)
	if err != nil {
		http.Error(w, "Failed to create product", http.StatusInternalServerError)
		return nil, err
	}

	allProducts := fetchAllProducts(ctx)
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
	if id == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return nil, errors.New("product ID required")
	}

	delete(updates, "_id")
	delete(updates, "id")

	if len(updates) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return nil, errors.New("no fields to update")
	}

	if name, ok := updates["name"].(string); ok && name != "" {
		updates["key"] = GenerateProductKey(name)
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updates})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Failed to update product or product not found", http.StatusNotFound)
		return nil, errors.New("product not found")
	}

	var updated Product
	_ = collection.FindOne(ctx, bson.M{"_id": id}).Decode(&updated)
	allProducts := fetchAllProducts(ctx)
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
	if id == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return nil, errors.New("product ID required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Failed to delete product or product not found", http.StatusNotFound)
		return nil, errors.New("product not found")
	}

	allProducts := fetchAllProducts(ctx)
	return &ProductActionResponsePacket{
		Products: allProducts,
		Success:  true,
		Message:  "Product deleted successfully",
	}, nil
}

func SearchProducts(w http.ResponseWriter, r *http.Request) (*GetProductsResponsePacket, error) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return nil, errors.New("query parameter required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"name": bson.M{"$regex": query, "$options": "i"}}
	opts := options.Find().SetLimit(10)

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		http.Error(w, "Failed to search products", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil {
		http.Error(w, "Failed to decode products", http.StatusInternalServerError)
		return nil, err
	}

	packets := ProductsToPacketList(products)
	return &GetProductsResponsePacket{
		Products: packets,
	}, nil
}

func UploadProductImage(w http.ResponseWriter, r *http.Request) (*UploadImageResponsePacket, error) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return nil, errors.New("method not allowed")
	}

	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		http.Error(w, "File too large or invalid multipart form", http.StatusBadRequest)
		return nil, err
	}

	file, fileHeader, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Missing 'image' file field", http.StatusBadRequest)
		return nil, err
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		http.Error(w, "Invalid image type. Allowed: jpg, jpeg, png, webp", http.StatusBadRequest)
		return nil, errors.New("invalid image type")
	}

	_ = os.MkdirAll(UploadDir, 0755)

	filename := uuid.NewString() + ext
	destPath := filepath.Join(UploadDir, filename)

	dst, err := os.Create(destPath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return nil, err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
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
