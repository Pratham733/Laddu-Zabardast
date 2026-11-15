package user

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/user", utils.WithResponse(GetUserHandler)).Methods("GET", "OPTIONS")
	r.HandleFunc("/profile", utils.WithResponse(GetUserHandler)).Methods("GET", "OPTIONS")

	r.HandleFunc("/update-profile", utils.WithBodyAndResponse(UpdateProfileHandler)).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/change-password", utils.WithBodyAndResponse(ChangePasswordHandler)).Methods("POST", "OPTIONS")

	r.HandleFunc("/address", utils.WithResponse(GetAddressesHandler)).Methods("GET", "OPTIONS")
	r.HandleFunc("/address/create", utils.WithBodyAndResponse(SaveAddressHandler)).Methods("POST", "OPTIONS")
	r.HandleFunc("/address/update/{id}", utils.WithBodyAndResponse(UpdateAddressHandler)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/address/delete/{id}", utils.WithResponse(DeleteAddressHandler)).Methods("DELETE", "OPTIONS")

	r.HandleFunc("/address", utils.WithBodyAndResponse(SaveAddressHandler)).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/address/{id}", utils.WithResponse(DeleteAddressHandler)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/addresses", utils.WithResponse(GetAddressesHandler)).Methods("GET", "OPTIONS")
	r.HandleFunc("/addresses", utils.WithBodyAndResponse(SaveAddressHandler)).Methods("POST", "PUT", "OPTIONS")
	r.HandleFunc("/addresses/{id}", utils.WithResponse(DeleteAddressHandler)).Methods("DELETE", "OPTIONS")

	r.HandleFunc("/admin/users", AdminOnly(utils.WithResponse(GetAppUsers))).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/users/{id}", AdminOnly(utils.WithResponse(GetAppUser))).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/users/delete/{id}", AdminOnly(utils.WithResponse(DeleteAppUser))).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/users", AdminOnly(utils.WithResponse(GetAppUsers))).Methods("GET", "OPTIONS")
	r.HandleFunc("/users/{id}", AdminOnly(utils.WithResponse(GetAppUser))).Methods("GET", "OPTIONS")
	r.HandleFunc("/users/{id}", AdminOnly(utils.WithResponse(DeleteAppUser))).Methods("DELETE", "OPTIONS")
}
