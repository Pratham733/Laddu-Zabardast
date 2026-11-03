package routes

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func CartRoutes(r *mux.Router) {
	r.HandleFunc("/cart/{userId}", handler.GetCart).Methods("GET", "OPTIONS")
	r.HandleFunc("/cart/{userId}", utils.WithBody(handler.UpdateCart)).Methods("PUT", "OPTIONS")
}
