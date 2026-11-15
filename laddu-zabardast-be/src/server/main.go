package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

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
	envPath := os.Getenv("CONFIG_PATH")
	if envPath == "" {
		envPath = constants.LocalEnv
		if os.Getenv("APP_ENV") == "dev" {
			envPath = constants.DevEnv
		}
		if _, err := os.Stat(envPath); errors.Is(err, os.ErrNotExist) {
			envPath = strings.TrimSuffix(envPath, ".local.json") + ".json"
		}
	}
	if err := config.LoadConfig(envPath); err != nil {
		log.Fatal(err)
	}
	if err := os.MkdirAll("public/uploads", 0755); err != nil {
		log.Fatal(err)
	}

	if _, err := db.Connect(config.AppConfig.MasterMongo.Host); err != nil {
		log.Fatal(err)
	}

	if err := order.StartConfirmationEmails(context.Background()); err != nil {
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

	addr := os.Getenv("HTTP_ADDR")
	if addr == "" {
		addr = ":8080"
	}
	fmt.Printf("Server running on %s\n", addr)
	if err := http.ListenAndServe(addr, corsHandler); err != nil {
		log.Fatal(err)
	}
}
