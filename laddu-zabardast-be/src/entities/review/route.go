package review

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

// RegisterRoutes registers all routes for the review entity.
func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/products/{productId}/reviews", GetProductReviews).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/{productId}/reviews", utils.WithBody(CreateReview)).Methods("POST", "OPTIONS")
	r.HandleFunc("/products/{productId}/reviews/{reviewId}", utils.WithBody(UpdateReview)).Methods("PUT", "OPTIONS")

	// Direct review management by reviewId
	r.HandleFunc("/reviews/{reviewId}", utils.WithBody(UpdateReview)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/reviews/{reviewId}", DeleteReview).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/reviews/{reviewId}", utils.WithBody(PinReview)).Methods("PATCH", "OPTIONS")
}
