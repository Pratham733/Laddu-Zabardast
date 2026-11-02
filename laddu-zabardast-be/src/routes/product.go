package routes

import (
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func ProductRoutes(r *mux.Router) {
	// Public listing and search routes
	r.HandleFunc("/products", handler.GetProducts).Methods("GET")
	r.HandleFunc("/products/search", handler.SearchProducts).Methods("GET")
	r.HandleFunc("/products/{id}", handler.GetProduct).Methods("GET")
	r.HandleFunc("/products/create", handler.CreateProduct).Methods("POST")
	r.HandleFunc("/products/edit/{id}", handler.UpdateProduct).Methods("PUT")
	r.HandleFunc("/products/delete/{id}", handler.DeleteProduct).Methods("DELETE")
}
