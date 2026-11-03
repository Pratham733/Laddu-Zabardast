package routes

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func UserRoutes(r *mux.Router) {
	r.HandleFunc("/users", handler.GetAppUsers).Methods("GET")
	r.HandleFunc("/users/{id}", handler.GetAppUser).Methods("GET")
	r.HandleFunc("/users", utils.WithBody(handler.CreateAppUser)).Methods("POST")
	r.HandleFunc("/users/{id}", utils.WithBody(handler.UpdateAppUser)).Methods("PUT")
	r.HandleFunc("/users/{id}", handler.DeleteAppUser).Methods("DELETE")
}
