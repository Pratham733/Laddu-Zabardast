package routes

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func AuthRoutes(r *mux.Router) {
	r.HandleFunc("/signup", utils.WithBody(handler.SignupHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", utils.WithBody(handler.LoginHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/logout", handler.LogoutHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/profile", handler.GetProfileHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/user", handler.GetUserHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/update-profile", utils.WithBody(handler.UpdateProfileHandler)).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/change-password", utils.WithBody(handler.ChangePasswordHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/addresses", handler.GetAddressesHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/addresses", utils.WithBody(handler.SaveAddressHandler)).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/addresses/{idx}", handler.DeleteAddressHandler).Methods("DELETE", "OPTIONS")
}
