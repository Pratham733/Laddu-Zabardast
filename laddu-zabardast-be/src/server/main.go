package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	constants "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/config"
	"github.com/Pratham733/laddu-zabardast-be/src/cors"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/auth"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/banner"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/cart"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/order"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/review"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/wishlist"
	"github.com/gorilla/mux"
)

func main() {
	_ = os.MkdirAll("public/uploads", 0755)

	envPath := constants.LocalEnv
	if os.Getenv("APP_ENV") == "dev" {
		envPath = constants.DevEnv
	}
	if p := os.Getenv("CONFIG_PATH"); p != "" {
		envPath = p
	}

	err := config.LoadConfig(envPath)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Connect(config.AppConfig.MasterMongo.Host)
	if err != nil {
		log.Fatal(err)
	}

	r := mux.NewRouter()

	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "OK")
	}).Methods("GET")

	// Static file server for uploaded product images
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("public/uploads"))))

	auth.RegisterRoutes(r)
	user.RegisterRoutes(r)
	product.RegisterRoutes(r)
	order.RegisterRoutes(r)
	cart.RegisterRoutes(r)
	wishlist.RegisterRoutes(r)
	review.RegisterRoutes(r)
	banner.RegisterRoutes(r)

	corsHandler := cors.CORSHandler(r)

	fmt.Println("Server running on :8080")
	if err := http.ListenAndServe(":8080", corsHandler); err != nil {
		log.Fatal(err)
	}
}
