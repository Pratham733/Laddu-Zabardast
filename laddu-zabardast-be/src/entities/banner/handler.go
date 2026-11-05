package banner

import (
	"errors"
	"net/http"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetBanners(w http.ResponseWriter, r *http.Request) ([]BannerPacket, error) {
	collection := getCollection()
	findOpts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})
	cursor, err := collection.Find(r.Context(), bson.M{"is_active": true}, findOpts)
	if err != nil {
		http.Error(w, "Failed to fetch banners", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(r.Context())

	var banners []Banner
	if err := cursor.All(r.Context(), &banners); err != nil || banners == nil {
		banners = []Banner{}
	}

	return BannersToPacketList(banners), nil
}

func GetAllBannersAdmin(w http.ResponseWriter, r *http.Request) ([]BannerPacket, error) {
	collection := getCollection()
	findOpts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})
	cursor, err := collection.Find(r.Context(), bson.M{}, findOpts)
	if err != nil {
		http.Error(w, "Failed to fetch banners", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(r.Context())

	var banners []Banner
	if err := cursor.All(r.Context(), &banners); err != nil || banners == nil {
		banners = []Banner{}
	}

	return BannersToPacketList(banners), nil
}

func CreateBanner(w http.ResponseWriter, r *http.Request, req CreateBannerRequestPacket) (*BannerPacket, error) {
	if err := validateCreateBannerReq(&req); err != nil {
		return nil, err
	}

	collection := getCollection()
	if req.Order <= 0 {
		count, _ := collection.CountDocuments(r.Context(), bson.M{})
		req.Order = int(count) + 1
	}

	newBanner := Banner{
		ID:          "ban_" + uuid.New().String()[:8],
		Key:         req.Key,
		Name:        req.Name,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		AltURL:      req.AltURL,
		ButtonLink:  req.ButtonLink,
		ButtonText:  req.ButtonText,
		Order:       req.Order,
		IsActive:    req.IsActive,
	}

	_, err := collection.InsertOne(r.Context(), newBanner)
	if err != nil {
		return nil, err
	}

	w.WriteHeader(http.StatusCreated)
	packet := BannerToPacket(newBanner)
	return &packet, nil
}

func UpdateBanner(w http.ResponseWriter, r *http.Request, req UpdateBannerRequestPacket) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if err := validateUpdateBannerReq(id, req); err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	collection := getCollection()
	update := bson.M{
		"$set": bson.M{
			"key":         req.Key,
			"name":        req.Name,
			"description": req.Description,
			"image_url":   req.ImageURL,
			"alt_url":     req.AltURL,
			"button_link": req.ButtonLink,
			"button_text": req.ButtonText,
			"order":       req.Order,
			"is_active":   req.IsActive,
		},
	}

	result, err := collection.UpdateOne(r.Context(), bson.M{"id": id}, update)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	if result.MatchedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("banner not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Banner updated successfully",
	}, nil
}

func DeleteBanner(w http.ResponseWriter, r *http.Request) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if err := validateBannerId(id); err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	collection := getCollection()
	result, err := collection.DeleteOne(r.Context(), bson.M{"id": id})
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	if result.DeletedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("banner not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Banner deleted successfully",
	}, nil
}
