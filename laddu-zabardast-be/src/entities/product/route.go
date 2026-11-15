package product

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/products", utils.WithResponse(GetProducts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/search", utils.WithResponse(SearchProducts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/create", user.AdminOnly(utils.WithBodyAndResponse(CreateProduct))).Methods("POST", "OPTIONS")
	r.HandleFunc("/products/edit/{id}", user.AdminOnly(utils.WithBodyAndResponse(UpdateProduct))).Methods("PUT", "OPTIONS")
	r.HandleFunc("/products/delete/{id}", user.AdminOnly(utils.WithResponse(DeleteProduct))).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/get-product", utils.WithResponse(GetProduct)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/get-product", utils.WithResponse(GetProduct)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/{id}", utils.WithResponse(GetProduct)).Methods("GET", "OPTIONS")

	r.HandleFunc("/upload-product-image", user.AdminOnly(utils.WithResponse(UploadProductImage))).Methods("POST", "OPTIONS")

	r.HandleFunc("/add-product", utils.WithResponse(GetProducts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/add-product", user.AdminOnly(utils.WithBodyAndResponse(CreateProduct))).Methods("POST", "OPTIONS")
	r.HandleFunc("/add-product/{id}", user.AdminOnly(utils.WithBodyAndResponse(UpdateProduct))).Methods("PUT", "OPTIONS")
	r.HandleFunc("/add-product/{id}", user.AdminOnly(utils.WithResponse(DeleteProduct))).Methods("DELETE", "OPTIONS")
}
