package routes

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func OrderRoutes(r *mux.Router) {
	r.HandleFunc("/orders", handler.GetOrders).Methods("GET", "OPTIONS")
	r.HandleFunc("/orders", utils.WithBody(handler.CreateOrder)).Methods("POST", "OPTIONS")
	r.HandleFunc("/orders", utils.WithBody(handler.PatchOrder)).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/create-order", utils.WithBody(handler.CreateOrder)).Methods("POST", "OPTIONS")
	r.HandleFunc("/generate-invoice", handler.GenerateInvoiceHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/orders/{id}", handler.GetOrder).Methods("GET", "OPTIONS")
	r.HandleFunc("/orders/{id}", utils.WithBody(handler.UpdateOrder)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/orders/{id}", handler.DeleteOrder).Methods("DELETE", "OPTIONS")
}
