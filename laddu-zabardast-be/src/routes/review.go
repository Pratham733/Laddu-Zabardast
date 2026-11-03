package routes

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func ReviewRoutes(r *mux.Router) {
	r.HandleFunc("/products/{productId}/reviews", handler.GetProductReviews).Methods("GET", "OPTIONS")
	r.HandleFunc("/products/{productId}/reviews", utils.WithBody(handler.CreateReview)).Methods("POST", "OPTIONS")
	r.HandleFunc("/products/{productId}/reviews/{reviewId}", utils.WithBody(handler.UpdateReview)).Methods("PUT", "OPTIONS")

	// Direct review management by reviewId
	r.HandleFunc("/reviews/{reviewId}", utils.WithBody(handler.UpdateReview)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/reviews/{reviewId}", handler.DeleteReview).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/reviews/{reviewId}", utils.WithBody(handler.PinReview)).Methods("PATCH", "OPTIONS")
}
