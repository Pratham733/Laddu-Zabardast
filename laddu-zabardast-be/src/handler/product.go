package handler

import (
	"context"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	models "github.com/Pratham733/laddu-zabardast-be/src/model"
	"github.com/Pratham733/laddu-zabardast-be/src/packet"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func fetchAllProducts(ctx context.Context) []models.Product {
	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return []models.Product{}
	}
	defer cursor.Close(ctx)

	var products []models.Product
	if err := cursor.All(ctx, &products); err != nil || products == nil {
		return []models.Product{}
	}
	return products
}

func GetProducts(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	filter := bson.M{}
	if category != "" && category != "all" {
		filter["category"] = category
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var products []models.Product
	if err := cursor.All(ctx, &products); err != nil {
		http.Error(w, "Failed to decode products", http.StatusInternalServerError)
		return
	}

	if products == nil {
		products = []models.Product{}
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"products": products,
	}, "")
}

func GetProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var product models.Product
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&product)
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"product": product,
	}, "")
}

// GenerateProductKey converts a product name to a URL-friendly key.
func GenerateProductKey(name string) string {
	return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "_"))
}

func CreateProduct(w http.ResponseWriter, r *http.Request, req packet.CreateProductRequest) {
	if strings.TrimSpace(req.Name) == "" || req.Price <= 0 || strings.TrimSpace(req.Category) == "" || strings.TrimSpace(req.ImageUrl) == "" {
		http.Error(w, "Product name, positive price, category, and imageUrl are required", http.StatusBadRequest)
		return
	}

	product := models.Product{
		ID:          uuid.NewString(),
		Key:         GenerateProductKey(req.Name),
		Name:        strings.TrimSpace(req.Name),
		Description: strings.TrimSpace(req.Description),
		Price:       req.Price,
		ImageUrl:    strings.TrimSpace(req.ImageUrl),
		Category:    strings.TrimSpace(req.Category),
		Available:   true,
		Weight:      strings.TrimSpace(req.Weight),
	}
	if req.Available {
		product.Available = req.Available
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, product)
	if err != nil {
		http.Error(w, "Failed to create product", http.StatusInternalServerError)
		return
	}

	allProducts := fetchAllProducts(ctx)

	utils.WriteJSON(w, http.StatusCreated, map[string]any{
		"product":  product,
		"products": allProducts,
		"success":  true,
	}, "Product created successfully")
}

func UpdateProduct(w http.ResponseWriter, r *http.Request, updates bson.M) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	delete(updates, "_id")
	delete(updates, "id")

	if len(updates) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	if name, ok := updates["name"].(string); ok && name != "" {
		updates["key"] = GenerateProductKey(name)
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updates})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Failed to update product or product not found", http.StatusNotFound)
		return
	}

	var updated models.Product
	_ = collection.FindOne(ctx, bson.M{"_id": id}).Decode(&updated)
	allProducts := fetchAllProducts(ctx)

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"product":  updated,
		"products": allProducts,
		"success":  true,
	}, "Product updated successfully")
}

func DeleteProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Failed to delete product or product not found", http.StatusNotFound)
		return
	}

	allProducts := fetchAllProducts(ctx)

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"products": allProducts,
		"success":  true,
	}, "Product deleted successfully")
}

func SearchProducts(w http.ResponseWriter, r *http.Request) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"name": bson.M{"$regex": query, "$options": "i"}}
	opts := options.Find().SetLimit(10)

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		http.Error(w, "Failed to search products", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var products []models.Product
	if err := cursor.All(ctx, &products); err != nil {
		http.Error(w, "Failed to decode products", http.StatusInternalServerError)
		return
	}

	if products == nil {
		products = []models.Product{}
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"products": products,
	}, "")
}

func UploadProductImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "File too large or invalid multipart form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Image file 'file' is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	uploadDir := "public/uploads"
	_ = os.MkdirAll(uploadDir, 0755)

	ext := filepath.Ext(header.Filename)
	filename := uuid.NewString() + ext
	dstPath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
		return
	}

	imageUrl := "/uploads/" + filename
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"url":     imageUrl,
		"success": true,
	}, "Image uploaded successfully")
}
