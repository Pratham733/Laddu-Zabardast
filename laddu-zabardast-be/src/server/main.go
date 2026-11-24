package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/Pratham733/laddu-zabardast-be/src/config"
	"github.com/Pratham733/laddu-zabardast-be/src/cors"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/auth"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/banner"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/cart"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/order"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/product"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/review"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/storefront"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/wishlist"
	"github.com/Pratham733/laddu-zabardast-be/src/productimage"
	"github.com/gorilla/mux"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatal(err)
	}
	images, err := productimage.FromEnvironment(config.AppConfig.UploadDir)
	if err != nil {
		log.Fatal(err)
	}
	if err := os.MkdirAll(config.AppConfig.UploadDir, 0755); err != nil {
		log.Fatal(err)
	}

	if _, err := db.Connect(config.AppConfig.MasterMongo.Host); err != nil {
		if config.AppConfig.Production {
			log.Fatal("Could not connect to MongoDB. Check MONGODB_URI, database user permissions, and network access.")
		}
		log.Fatal(err)
	}

	invoiceCtx, cancelInvoice := context.WithTimeout(context.Background(), 15*time.Second)
	invoiceErr := order.EnsureInvoiceIndex(invoiceCtx)
	cancelInvoice()
	if invoiceErr != nil {
		log.Fatalf("prepare invoice numbering: %v", invoiceErr)
	}

	if err := order.StartConfirmationEmails(context.Background()); err != nil {
		log.Fatal(err)
	}

	r := mux.NewRouter()

	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "OK")
	}).Methods("GET")

	// Static file server for uploaded product images
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir(config.AppConfig.UploadDir))))

	auth.RegisterRoutes(r)
	googleCtx, cancelGoogle := context.WithTimeout(context.Background(), 15*time.Second)
	googleErr := auth.RegisterGoogle(googleCtx, r)
	cancelGoogle()
	if googleErr != nil {
		log.Fatal(googleErr)
	}
	user.RegisterRoutes(r)
	product.RegisterRoutes(r, images)
	order.RegisterRoutes(r)
	cart.RegisterRoutes(r)
	wishlist.RegisterRoutes(r)
	review.RegisterRoutes(r)
	banner.RegisterRoutes(r)
	storefront.RegisterRoutes(r)

	corsHandler := cors.CORSHandler(r)

	addr := os.Getenv("HTTP_ADDR")
	if addr == "" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		addr = ":" + port
	}
	fmt.Printf("Server running on %s\n", addr)
	server := &http.Server{Addr: addr, Handler: corsHandler, ReadHeaderTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
