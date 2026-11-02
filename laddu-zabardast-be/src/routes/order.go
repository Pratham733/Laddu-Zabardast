package routes

import (
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func OrderRoutes(r *mux.Router) {
	r.HandleFunc("/orders", handler.GetOrders).Methods("GET")
	r.HandleFunc("/orders/{id}", handler.GetOrder).Methods("GET")
	r.HandleFunc("/orders", handler.CreateOrder).Methods("POST")
	r.HandleFunc("/orders/{id}", handler.UpdateOrder).Methods("PUT")
	r.HandleFunc("/orders/{id}", handler.DeleteOrder).Methods("DELETE")
}
