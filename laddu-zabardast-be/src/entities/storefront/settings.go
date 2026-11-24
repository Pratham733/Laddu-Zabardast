package storefront

import (
	"errors"
	"net/http"
	"slices"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/config"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var shortcuts = []string{"bestsellers", "new", "all", "laddu", "pickle", "gifts", "custom-box"}

type Settings struct {
	HiddenShortcuts []string `json:"hiddenShortcuts" bson:"hiddenShortcuts"`
}

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/storefront/contact", utils.WithResponse(func(http.ResponseWriter, *http.Request) (config.SupportContact, error) {
		return config.StoreSupport(), nil
	})).Methods("GET", "OPTIONS")
	r.HandleFunc("/storefront/settings", utils.WithResponse(getSettings)).Methods("GET", "OPTIONS")
	r.HandleFunc("/storefront/settings", user.AdminOnly(utils.WithBodyAndResponse(saveSettings))).Methods("PUT", "OPTIONS")
}

func getSettings(_ http.ResponseWriter, r *http.Request) (*Settings, error) {
	settings := Settings{HiddenShortcuts: []string{}}
	err := db.GetCollection(db.DefaultDB, "storefrontSettings").
		FindOne(r.Context(), bson.M{"_id": "home"}).Decode(&settings)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		return nil, err
	}
	return &settings, nil
}

func saveSettings(_ http.ResponseWriter, r *http.Request, settings Settings) (*Settings, error) {
	if settings.HiddenShortcuts == nil {
		return nil, errors.New("hiddenShortcuts must be an array")
	}
	seen := make(map[string]bool)
	for _, key := range settings.HiddenShortcuts {
		if !slices.Contains(shortcuts, key) || seen[key] {
			return nil, errors.New("invalid or duplicate storefront shortcut")
		}
		seen[key] = true
	}
	_, err := db.GetCollection(db.DefaultDB, "storefrontSettings").UpdateOne(
		r.Context(), bson.M{"_id": "home"}, bson.M{"$set": settings}, options.UpdateOne().SetUpsert(true),
	)
	if err != nil {
		return nil, err
	}
	return &settings, nil
}
