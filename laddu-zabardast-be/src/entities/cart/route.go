package cart

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

// RegisterRoutes registers all routes for the cart entity.
func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/cart/{userId}", utils.WithResponse(GetCart)).Methods("GET", "OPTIONS")
	r.HandleFunc("/cart/{userId}", utils.WithBodyAndResponse(UpdateCart)).Methods("PUT", "OPTIONS")
}
