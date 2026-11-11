package banner

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/banner", utils.WithResponse(GetBanners)).Methods("GET", "OPTIONS")

	r.HandleFunc("/admin/banners", utils.WithResponse(GetAllBannersAdmin)).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/banner/create", utils.WithBodyAndResponse(CreateBanner)).Methods("POST", "OPTIONS")
	r.HandleFunc("/admin/banner/edit/{id}", utils.WithBodyAndResponse(UpdateBanner)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/admin/banner/delete/{id}", utils.WithResponse(DeleteBanner)).Methods("DELETE", "OPTIONS")
}
