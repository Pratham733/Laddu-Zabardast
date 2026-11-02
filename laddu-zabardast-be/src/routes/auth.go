package routes

import (
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func AuthRoutes(r *mux.Router) {
	r.HandleFunc("/signup", handler.SignupHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", handler.LoginHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/logout", handler.LogoutHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/profile", handler.GetProfileHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/user", handler.GetUserHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/update-profile", handler.UpdateProfileHandler).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/change-password", handler.ChangePasswordHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/addresses", handler.GetAddressesHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/addresses", handler.SaveAddressHandler).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/addresses/{idx}", handler.DeleteAddressHandler).Methods("DELETE", "OPTIONS")
}
