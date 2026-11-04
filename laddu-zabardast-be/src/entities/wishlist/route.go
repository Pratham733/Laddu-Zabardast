package wishlist

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

// RegisterRoutes registers all routes for the wishlist entity.
func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/wishlist/{userId}", utils.WithResponse(GetWishlist)).Methods("GET", "OPTIONS")
	r.HandleFunc("/wishlist/{userId}", utils.WithBodyAndResponse(UpdateWishlist)).Methods("PUT", "OPTIONS")
}
