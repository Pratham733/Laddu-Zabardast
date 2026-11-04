package auth

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

// RegisterRoutes registers all routes for authentication and profile management.
func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/signup", utils.WithBody(SignupHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", utils.WithBody(LoginHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/logout", LogoutHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/profile", GetProfileHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/user", GetUserHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/update-profile", utils.WithBody(UpdateProfileHandler)).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/change-password", utils.WithBody(ChangePasswordHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/addresses", GetAddressesHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/addresses", utils.WithBody(SaveAddressHandler)).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/addresses/{idx}", DeleteAddressHandler).Methods("DELETE", "OPTIONS")
}
