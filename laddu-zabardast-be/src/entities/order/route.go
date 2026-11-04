package order

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

// RegisterRoutes registers all routes for the order entity.
func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/orders", utils.WithResponse(GetOrders)).Methods("GET", "OPTIONS")
	r.HandleFunc("/orders", utils.WithBodyAndResponse(CreateOrder)).Methods("POST", "OPTIONS")
	r.HandleFunc("/orders", utils.WithBodyAndResponse(PatchOrder)).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/create-order", utils.WithBodyAndResponse(CreateOrder)).Methods("POST", "OPTIONS")
	r.HandleFunc("/generate-invoice", GenerateInvoiceHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/orders/{id}", utils.WithResponse(GetOrder)).Methods("GET", "OPTIONS")
	r.HandleFunc("/orders/{id}", utils.WithBodyAndResponse(UpdateOrder)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/orders/{id}", utils.WithResponse(DeleteOrder)).Methods("DELETE", "OPTIONS")
}
