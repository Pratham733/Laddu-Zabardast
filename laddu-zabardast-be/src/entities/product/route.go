package product

import (
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/Pratham733/laddu-zabardast-be/src/productimage"
	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router, images productimage.Store) {
	r.HandleFunc("/products", utils.WithResponse(GetProducts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/search", utils.WithResponse(SearchProducts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/create", user.AdminOnly(utils.WithBodyAndResponse(CreateProduct))).Methods("POST", "OPTIONS")
	r.HandleFunc("/products/edit/{id}", user.AdminOnly(utils.WithBodyAndResponse(UpdateProduct))).Methods("PUT", "OPTIONS")
	r.HandleFunc("/products/delete/{id}", user.AdminOnly(utils.WithResponse(DeleteProduct))).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/get-product", utils.WithResponse(GetProduct)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/get-product", utils.WithResponse(GetProduct)).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/{id}", utils.WithResponse(GetProduct)).Methods("GET", "OPTIONS")

	const uploadTimeout = 30 * time.Second
	r.HandleFunc("/upload-product-image", user.AdminOnlyWithTimeout(utils.WithResponseTimeout(uploadTimeout, uploadProductImage(images)), uploadTimeout)).Methods("POST", "OPTIONS")

	r.HandleFunc("/add-product", utils.WithResponse(GetProducts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/add-product", user.AdminOnly(utils.WithBodyAndResponse(CreateProduct))).Methods("POST", "OPTIONS")
	r.HandleFunc("/add-product/{id}", user.AdminOnly(utils.WithBodyAndResponse(UpdateProduct))).Methods("PUT", "OPTIONS")
	r.HandleFunc("/add-product/{id}", user.AdminOnly(utils.WithResponse(DeleteProduct))).Methods("DELETE", "OPTIONS")
}
