package routes

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func ProductRoutes(r *mux.Router) {
	// Standard products REST routes
	r.HandleFunc("/products", handler.GetProducts).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/search", handler.SearchProducts).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/create", utils.WithBody(handler.CreateProduct)).Methods("POST", "OPTIONS")
	r.HandleFunc("/products/edit/{id}", utils.WithBody(handler.UpdateProduct)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/products/delete/{id}", handler.DeleteProduct).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/products/{id}", handler.GetProduct).Methods("GET", "OPTIONS")

	// Upload product image route
	r.HandleFunc("/upload-product-image", handler.UploadProductImage).Methods("POST", "OPTIONS")

	// Alias routes according to design contract
	r.HandleFunc("/add-product", handler.GetProducts).Methods("GET", "OPTIONS")
	r.HandleFunc("/add-product", utils.WithBody(handler.CreateProduct)).Methods("POST", "OPTIONS")
	r.HandleFunc("/add-product/{id}", utils.WithBody(handler.UpdateProduct)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/add-product/{id}", handler.DeleteProduct).Methods("DELETE", "OPTIONS")
}
