package auth

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/signup", utils.WithBodyAndResponse(SignupHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", utils.WithBodyAndResponse(LoginHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/logout", utils.WithResponse(LogoutHandler)).Methods("POST", "OPTIONS")
}
