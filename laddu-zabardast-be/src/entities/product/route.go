package product

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// RegisterRoutes registers all routes for the product entity.
func RegisterRoutes(r *mux.Router) {
	// Standard products REST routes
	r.HandleFunc("/products", GetProducts).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/search", SearchProducts).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/create", utils.WithBody(CreateProduct)).Methods("POST", "OPTIONS")
	r.HandleFunc("/products/edit/{id}", utils.WithBody(UpdateProduct)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/products/delete/{id}", DeleteProduct).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/products/{id}", GetProduct).Methods("GET", "OPTIONS")

	// Upload product image route
	r.HandleFunc("/upload-product-image", UploadProductImage).Methods("POST", "OPTIONS")

	// Alias routes according to design contract
	r.HandleFunc("/add-product", GetProducts).Methods("GET", "OPTIONS")
	r.HandleFunc("/add-product", utils.WithBody(CreateProduct)).Methods("POST", "OPTIONS")
	r.HandleFunc("/add-product/{id}", utils.WithBody[bson.M](UpdateProduct)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/add-product/{id}", DeleteProduct).Methods("DELETE", "OPTIONS")
}
