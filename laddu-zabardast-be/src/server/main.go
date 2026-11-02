package main

import (
	"fmt"
	"log"
	"net/http"

	constants "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/config"
	"github.com/Pratham733/laddu-zabardast-be/src/cors"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/routes"
	"github.com/gorilla/mux"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "OK")
	})

	// err := config.LoadConfig(constants.DevEnv)
	err := config.LoadConfig(constants.LocalEnv)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Connect(config.AppConfig.MasterMongo.Host)
	if err != nil {
		log.Fatal(err)
	}

	r := mux.NewRouter()
	corsHandler := cors.CORSHandler(r)

	routes.AuthRoutes(r)
	routes.UserRoutes(r)
	routes.ProductRoutes(r)
	routes.OrderRoutes(r)

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", corsHandler)
}
