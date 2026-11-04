package user

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

// RegisterRoutes registers all routes for the user entity.
func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/users", GetAppUsers).Methods("GET", "OPTIONS")
	r.HandleFunc("/users/{id}", GetAppUser).Methods("GET", "OPTIONS")
	r.HandleFunc("/users", utils.WithBody(CreateAppUser)).Methods("POST", "OPTIONS")
	r.HandleFunc("/users/{id}", utils.WithBody(UpdateAppUser)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/users/{id}", DeleteAppUser).Methods("DELETE", "OPTIONS")
}
