package banner

import (
	"context"
	"errors"
	"net/http"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetBanners(w http.ResponseWriter, r *http.Request) ([]BannerPacket, error) {
	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	findOpts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})
	cursor, err := collection.Find(ctx, bson.M{"is_active": true}, findOpts)
	if err != nil {
		http.Error(w, "Failed to fetch banners", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(ctx)

	var banners []Banner
	if err := cursor.All(ctx, &banners); err != nil || banners == nil {
		banners = []Banner{}
	}

	return BannersToPacketList(banners), nil
}

func GetAllBannersAdmin(w http.ResponseWriter, r *http.Request) ([]BannerPacket, error) {
	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	findOpts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})
	cursor, err := collection.Find(ctx, bson.M{}, findOpts)
	if err != nil {
		http.Error(w, "Failed to fetch banners", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(ctx)

	var banners []Banner
	if err := cursor.All(ctx, &banners); err != nil || banners == nil {
		banners = []Banner{}
	}

	return BannersToPacketList(banners), nil
}

func CreateBanner(w http.ResponseWriter, r *http.Request, req CreateBannerRequest) (*BannerPacket, error) {
	if req.Name == "" {
		http.Error(w, "Banner name is required", http.StatusBadRequest)
		return nil, errors.New("banner name required")
	}
	if req.ImageURL == "" {
		http.Error(w, "Banner imageURL is required", http.StatusBadRequest)
		return nil, errors.New("banner imageURL required")
	}
	if req.ButtonLink == "" {
		req.ButtonLink = "/shop"
	}
	if req.ButtonText == "" {
		req.ButtonText = "Shop Now"
	}
	if req.Key == "" {
		req.Key = "banner"
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if req.Order <= 0 {
		count, _ := collection.CountDocuments(ctx, bson.M{})
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

	_, err := collection.InsertOne(ctx, newBanner)
	if err != nil {
		http.Error(w, "Failed to create banner: "+err.Error(), http.StatusInternalServerError)
		return nil, err
	}

	w.WriteHeader(http.StatusCreated)
	packet := BannerToPacket(newBanner)
	return &packet, nil
}

// UpdateBanner handles updating an existing banner item in DB.
func UpdateBanner(w http.ResponseWriter, r *http.Request, req UpdateBannerRequest) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Banner ID is required", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("banner ID required")
	}
	if req.Name == "" {
		http.Error(w, "Banner name is required", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("banner name required")
	}
	if req.ImageURL == "" {
		http.Error(w, "Banner imageURL is required", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("banner imageURL required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

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

	result, err := collection.UpdateOne(ctx, bson.M{"id": id}, update)
	if err != nil {
		http.Error(w, "Failed to update banner: "+err.Error(), http.StatusInternalServerError)
		return utils.SuccessResponsePacket{}, err
	}
	if result.MatchedCount == 0 {
		http.Error(w, "Banner not found", http.StatusNotFound)
		return utils.SuccessResponsePacket{}, errors.New("banner not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Banner updated successfully",
	}, nil
}

// DeleteBanner handles deleting a banner item from DB.
func DeleteBanner(w http.ResponseWriter, r *http.Request) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Banner ID is required", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("banner ID required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"id": id})
	if err != nil {
		http.Error(w, "Failed to delete banner: "+err.Error(), http.StatusInternalServerError)
		return utils.SuccessResponsePacket{}, err
	}
	if result.DeletedCount == 0 {
		http.Error(w, "Banner not found", http.StatusNotFound)
		return utils.SuccessResponsePacket{}, errors.New("banner not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Banner deleted successfully",
	}, nil
}
