package handler

import (
	"context"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	models "github.com/Pratham733/laddu-zabardast-be/src/model"
	"github.com/Pratham733/laddu-zabardast-be/src/packet"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetProductReviews(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	productId := vars["productId"]
	if productId == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Reviews)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	findOpts := options.Find().SetSort(bson.D{{Key: "pinned", Value: -1}, {Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(ctx, bson.M{"productId": productId}, findOpts)
	if err != nil {
		http.Error(w, "Failed to fetch reviews", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var reviews []models.Review
	if err := cursor.All(ctx, &reviews); err != nil || reviews == nil {
		reviews = []models.Review{}
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"reviews": reviews,
	}, "")
}

func CreateReview(w http.ResponseWriter, r *http.Request, req packet.CreateReviewRequest) {
	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	productId := vars["productId"]
	if productId == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	if req.Rating < 1 || req.Rating > 5 || strings.TrimSpace(req.Comment) == "" {
		http.Error(w, "Valid rating (1-5) and non-empty comment are required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get user name for review display
	userName := "Customer"
	userCol := db.GetCollection(utils.LadduZabardast, utils.Users)
	var user models.User
	if err := userCol.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&user); err == nil {
		if user.FirstName != "" {
			userName = strings.TrimSpace(user.FirstName + " " + user.LastName)
		} else if user.Email != "" {
			userName = strings.Split(user.Email, "@")[0]
		}
	}

	now := time.Now().UTC().Format(time.RFC3339)
	review := models.Review{
		ID:        uuid.NewString(),
		ProductID: productId,
		UserID:    claims.UserID,
		UserName:  userName,
		Rating:    req.Rating,
		Comment:   strings.TrimSpace(req.Comment),
		Pinned:    false,
		CreatedAt: now,
		UpdatedAt: now,
	}

	reviewCol := db.GetCollection(utils.LadduZabardast, utils.Reviews)
	_, err = reviewCol.InsertOne(ctx, review)
	if err != nil {
		http.Error(w, "Failed to create review", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]any{
		"review":  review,
		"success": true,
	}, "Review submitted successfully")
}

func UpdateReview(w http.ResponseWriter, r *http.Request, req packet.UpdateReviewRequest) {
	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	reviewId := vars["reviewId"]
	if reviewId == "" {
		http.Error(w, "Review ID is required", http.StatusBadRequest)
		return
	}

	if req.Rating < 1 || req.Rating > 5 || strings.TrimSpace(req.Comment) == "" {
		http.Error(w, "Valid rating (1-5) and non-empty comment are required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := db.GetCollection(utils.LadduZabardast, utils.Reviews)
	now := time.Now().UTC().Format(time.RFC3339)

	filter := bson.M{"_id": reviewId}
	if claims.Email != "spratham388@gmail.com" {
		filter["userId"] = claims.UserID
	}

	update := bson.M{
		"$set": bson.M{
			"rating":    req.Rating,
			"comment":   strings.TrimSpace(req.Comment),
			"updatedAt": now,
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Review not found or unauthorized", http.StatusNotFound)
		return
	}

	var updated models.Review
	_ = collection.FindOne(ctx, bson.M{"_id": reviewId}).Decode(&updated)

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"review":  updated,
		"success": true,
	}, "Review updated successfully")
}

func DeleteReview(w http.ResponseWriter, r *http.Request) {
	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	reviewId := vars["reviewId"]
	if reviewId == "" {
		http.Error(w, "Review ID is required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := db.GetCollection(utils.LadduZabardast, utils.Reviews)
	filter := bson.M{"_id": reviewId}
	if claims.Email != "spratham388@gmail.com" {
		filter["userId"] = claims.UserID
	}

	result, err := collection.DeleteOne(ctx, filter)
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Review not found or unauthorized", http.StatusNotFound)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Review deleted successfully",
	}, "Review deleted successfully")
}

func PinReview(w http.ResponseWriter, r *http.Request, req packet.PinReviewRequest) {
	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}
	_ = claims

	vars := mux.Vars(r)
	reviewId := vars["reviewId"]
	if reviewId == "" {
		http.Error(w, "Review ID is required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := db.GetCollection(utils.LadduZabardast, utils.Reviews)
	result, err := collection.UpdateOne(ctx, bson.M{"_id": reviewId}, bson.M{"$set": bson.M{"pinned": req.Pinned}})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Review not found", http.StatusNotFound)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Review pin status updated",
	}, "Review pin status updated")
}
