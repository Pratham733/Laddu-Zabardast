package handler

import (
	"context"
	"encoding/json"
	"net/http"
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

func GetProducts(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	filter := bson.M{}
	if category != "" {
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
// Example: "Besan Laddu" -> "besan_laddu"
func GenerateProductKey(name string) string {
	return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "_"))
}

func CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req packet.CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	product := models.Product{
		ID:          uuid.NewString(),
		Key:         GenerateProductKey(req.Name),
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		ImageUrl:    req.ImageUrl,
		Category:    req.Category,
		Available:   req.Available,
		Weight:      req.Weight,
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, product)
	if err != nil {
		http.Error(w, "Failed to create product", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]any{
		"product": product,
	}, "Product created successfully")
}

func UpdateProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	// Also support ?id= query param (backward compat)
	if id == "" {
		id = r.URL.Query().Get("id")
	}
	if id == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	var updates bson.M
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	// Remove _id from updates if present
	delete(updates, "_id")

	// If name is being updated, regenerate the key
	if name, ok := updates["name"].(string); ok && name != "" {
		updates["key"] = GenerateProductKey(name)
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updates})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Failed to update product", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Product updated successfully")
}

func DeleteProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	// Also support ?id= query param (backward compat)
	if id == "" {
		id = r.URL.Query().Get("id")
	}
	if id == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Failed to delete product", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Product deleted successfully")
}

func SearchProducts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		utils.WriteJSON(w, http.StatusOK, map[string]any{
			"products": []models.Product{},
		}, "")
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Products)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Case-insensitive substring match on "name"
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
