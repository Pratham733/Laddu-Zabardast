package banner

import (
	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/banner", utils.WithResponse(GetBanners)).Methods("GET", "OPTIONS")

	r.HandleFunc("/admin/banners", user.AdminOnly(utils.WithResponse(GetAllBannersAdmin))).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/banner/create", user.AdminOnly(utils.WithBodyAndResponse(CreateBanner))).Methods("POST", "OPTIONS")
	r.HandleFunc("/admin/banner/edit/{id}", user.AdminOnly(utils.WithBodyAndResponse(UpdateBanner))).Methods("PUT", "OPTIONS")
	r.HandleFunc("/admin/banner/delete/{id}", user.AdminOnly(utils.WithResponse(DeleteBanner))).Methods("DELETE", "OPTIONS")
}
