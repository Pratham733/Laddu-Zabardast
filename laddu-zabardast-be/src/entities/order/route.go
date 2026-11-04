package order

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

// RegisterRoutes registers all routes for the order entity.
func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/orders", GetOrders).Methods("GET", "OPTIONS")
	r.HandleFunc("/orders", utils.WithBody(CreateOrder)).Methods("POST", "OPTIONS")
	r.HandleFunc("/orders", utils.WithBody(PatchOrder)).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/create-order", utils.WithBody(CreateOrder)).Methods("POST", "OPTIONS")
	r.HandleFunc("/generate-invoice", GenerateInvoiceHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/orders/{id}", GetOrder).Methods("GET", "OPTIONS")
	r.HandleFunc("/orders/{id}", utils.WithBody(UpdateOrder)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/orders/{id}", DeleteOrder).Methods("DELETE", "OPTIONS")
}
