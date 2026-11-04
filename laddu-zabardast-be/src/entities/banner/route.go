package banner

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

// RegisterRoutes registers all routes for the banner entity.
func RegisterRoutes(r *mux.Router) {
	// Public endpoint for home page carousel
	r.HandleFunc("/banner", GetBanners).Methods("GET", "OPTIONS")

	// Admin management endpoints
	r.HandleFunc("/admin/banners", GetAllBannersAdmin).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/banner/create", utils.WithBody(CreateBanner)).Methods("POST", "OPTIONS")
	r.HandleFunc("/admin/banner/edit/{id}", utils.WithBody(UpdateBanner)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/admin/banner/delete/{id}", DeleteBanner).Methods("DELETE", "OPTIONS")
}
