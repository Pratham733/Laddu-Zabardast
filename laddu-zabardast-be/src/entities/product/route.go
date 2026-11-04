package product

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/products", utils.WithResponse(GetProducts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/search", utils.WithResponse(SearchProducts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/create", utils.WithBodyAndResponse(CreateProduct)).Methods("POST", "OPTIONS")
	r.HandleFunc("/products/edit/{id}", utils.WithBodyAndResponse(UpdateProduct)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/products/delete/{id}", utils.WithResponse(DeleteProduct)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/products/{id}", utils.WithResponse(GetProduct)).Methods("GET", "OPTIONS")

	r.HandleFunc("/upload-product-image", utils.WithResponse(UploadProductImage)).Methods("POST", "OPTIONS")

	r.HandleFunc("/add-product", utils.WithResponse(GetProducts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/add-product", utils.WithBodyAndResponse(CreateProduct)).Methods("POST", "OPTIONS")
	r.HandleFunc("/add-product/{id}", utils.WithBodyAndResponse(UpdateProduct)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/add-product/{id}", utils.WithResponse(DeleteProduct)).Methods("DELETE", "OPTIONS")
}
