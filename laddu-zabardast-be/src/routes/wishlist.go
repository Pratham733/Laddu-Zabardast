package routes

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func WishlistRoutes(r *mux.Router) {
	r.HandleFunc("/wishlist/{userId}", handler.GetWishlist).Methods("GET", "OPTIONS")
	r.HandleFunc("/wishlist/{userId}", utils.WithBody(handler.UpdateWishlist)).Methods("PUT", "OPTIONS")
}
