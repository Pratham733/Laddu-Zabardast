package routes

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/handler"
	"github.com/gorilla/mux"
)

func BannerRoutes(r *mux.Router) {
	// Public endpoint for home page carousel
	r.HandleFunc("/banner", handler.GetBanners).Methods("GET", "OPTIONS")

	// Admin management endpoints
	r.HandleFunc("/admin/banners", handler.GetAllBannersAdmin).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/banner/create", utils.WithBody(handler.CreateBanner)).Methods("POST", "OPTIONS")
	r.HandleFunc("/admin/banner/edit/{id}", utils.WithBody(handler.UpdateBanner)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/admin/banner/delete/{id}", handler.DeleteBanner).Methods("DELETE", "OPTIONS")
}
