package routes

import (
	"github.com/gorilla/mux"

	"github.com/Pratham733/laddu-zabardast-be/src/handler"
)

func UserRoutes(r *mux.Router) {
	r.HandleFunc("/users", handler.GetAppUsers).Methods("GET")
	r.HandleFunc("/users/{id}", handler.GetAppUser).Methods("GET")
	r.HandleFunc("/users", handler.CreateAppUser).Methods("POST")
	r.HandleFunc("/users/{id}", handler.UpdateAppUser).Methods("PUT")
	r.HandleFunc("/users/{id}", handler.DeleteAppUser).Methods("DELETE")
}
