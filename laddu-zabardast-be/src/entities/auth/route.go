package auth

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/signup", utils.WithBodyAndResponse(SignupHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", utils.WithBodyAndResponse(LoginHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/logout", utils.WithResponse(LogoutHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/user", utils.WithResponse(GetUserHandler)).Methods("GET", "OPTIONS")
	r.HandleFunc("/update-profile", utils.WithBodyAndResponse(UpdateProfileHandler)).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/change-password", utils.WithBodyAndResponse(ChangePasswordHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/address", utils.WithResponse(GetAddressesHandler)).Methods("GET", "OPTIONS")
	r.HandleFunc("/address", utils.WithBodyAndResponse(SaveAddressHandler)).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/address/{id}", utils.WithResponse(DeleteAddressHandler)).Methods("DELETE", "OPTIONS")
}
