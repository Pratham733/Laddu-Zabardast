package banner

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func seedInitialBanners(ctx context.Context) {
	collection := db.GetCollection(utils.LadduZabardast, CollectionBanners)
	_, _ = collection.DeleteMany(ctx, bson.M{"image_url": bson.M{"$in": []any{"", nil}}})
	count, err := collection.CountDocuments(ctx, bson.M{})
	if err != nil || count > 0 {
		return
	}

	initialBanners := []Banner{
		{
			ID:          "ban_1",
			Key:         "sweets",
			Name:        "Authentic Indian Sweets",
			Description: "Experience the taste of tradition with our handcrafted laddus, made with love and the finest ingredients.",
			ImageURL:    "https://d.imgvision.net/laddu-zabardast/gond-laddu.jpeg",
			AltURL:      "/images/ban1.jpg",
			ButtonLink:  "/shop",
			ButtonText:  "Shop Laddus",
			Order:       1,
			IsActive:    true,
		},
		{
			ID:          "ban_2",
			Key:         "pickles",
			Name:        "Tangy Homemade Pickles",
			Description: "Spice up your meals with our traditional homemade pickles, bursting with authentic flavors.",
			ImageURL:    "https://d.imgvision.net/laddu-zabardast/besan-laddu.png",
			AltURL:      "/images/ban2.jpg",
			ButtonLink:  "/shop",
			ButtonText:  "Explore Pickles",
			Order:       2,
			IsActive:    true,
		},
		{
			ID:          "ban_3",
			Key:         "delights",
			Name:        "LADDU ZABARDAST Delights",
			Description: "Freshly made daily, bringing the authentic taste of India right to your doorstep.",
			ImageURL:    "https://d.imgvision.net/laddu-zabardast/motichoor-laddu.jpeg",
			AltURL:      "/images/ban3.jpg",
			ButtonLink:  "/shop",
			ButtonText:  "View Our Shop",
			Order:       3,
			IsActive:    true,
		},
	}

	var docs []any
	for _, b := range initialBanners {
		docs = append(docs, b)
	}
	_, _ = collection.InsertMany(ctx, docs)
}

// GetBanners returns active banners sorted by order as a JSON array.
func GetBanners(w http.ResponseWriter, r *http.Request) {
	collection := db.GetCollection(utils.LadduZabardast, CollectionBanners)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	seedInitialBanners(ctx)

	findOpts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})
	cursor, err := collection.Find(ctx, bson.M{"is_active": true}, findOpts)
	if err != nil {
		http.Error(w, "Failed to fetch banners", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var banners []Banner
	if err := cursor.All(ctx, &banners); err != nil || banners == nil {
		banners = []Banner{}
	}

	packets := BannersToPacketList(banners)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(packets)
}

// GetAllBannersAdmin returns all banners (including inactive) for admin management.
func GetAllBannersAdmin(w http.ResponseWriter, r *http.Request) {
	collection := db.GetCollection(utils.LadduZabardast, CollectionBanners)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	seedInitialBanners(ctx)

	findOpts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})
	cursor, err := collection.Find(ctx, bson.M{}, findOpts)
	if err != nil {
		http.Error(w, "Failed to fetch banners", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var banners []Banner
	if err := cursor.All(ctx, &banners); err != nil || banners == nil {
		banners = []Banner{}
	}

	packets := BannersToPacketList(banners)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(packets)
}

// CreateBanner handles creating a new banner item in DB.
func CreateBanner(w http.ResponseWriter, r *http.Request, req CreateBannerRequest) {
	if req.Name == "" {
		http.Error(w, "Banner name is required", http.StatusBadRequest)
		return
	}
	if req.ImageURL == "" {
		http.Error(w, "Banner imageURL is required", http.StatusBadRequest)
		return
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

	collection := db.GetCollection(utils.LadduZabardast, CollectionBanners)
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
		return
	}

	packet := BannerToPacket(newBanner)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(packet)
}

// UpdateBanner handles updating an existing banner item in DB.
func UpdateBanner(w http.ResponseWriter, r *http.Request, req UpdateBannerRequest) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Banner ID is required", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "Banner name is required", http.StatusBadRequest)
		return
	}
	if req.ImageURL == "" {
		http.Error(w, "Banner imageURL is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionBanners)
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
		return
	}
	if result.MatchedCount == 0 {
		http.Error(w, "Banner not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message": "Banner updated successfully",
		"id":      id,
	})
}

// DeleteBanner handles deleting a banner item from DB.
func DeleteBanner(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Banner ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionBanners)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"id": id})
	if err != nil {
		http.Error(w, "Failed to delete banner: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if result.DeletedCount == 0 {
		http.Error(w, "Banner not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message": "Banner deleted successfully",
		"id":      id,
	})
}
