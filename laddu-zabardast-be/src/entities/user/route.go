package user

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

// RegisterRoutes registers all routes for the user entity.
func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/users", utils.WithResponse(GetAppUsers)).Methods("GET", "OPTIONS")
	r.HandleFunc("/users/{id}", utils.WithResponse(GetAppUser)).Methods("GET", "OPTIONS")
	r.HandleFunc("/users", utils.WithBodyAndResponse(CreateAppUser)).Methods("POST", "OPTIONS")
	r.HandleFunc("/users/{id}", utils.WithBodyAndResponse(UpdateAppUser)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/users/{id}", utils.WithResponse(DeleteAppUser)).Methods("DELETE", "OPTIONS")
}
