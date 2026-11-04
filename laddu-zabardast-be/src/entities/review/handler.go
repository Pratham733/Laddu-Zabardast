package review

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetProductReviews(w http.ResponseWriter, r *http.Request) (*GetReviewsResponsePacket, error) {
	vars := mux.Vars(r)
	productId := vars["productId"]
	if productId == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return nil, errors.New("product ID required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	findOpts := options.Find().SetSort(bson.D{{Key: "pinned", Value: -1}, {Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(ctx, bson.M{"productId": productId}, findOpts)
	if err != nil {
		http.Error(w, "Failed to fetch reviews", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(ctx)

	var reviews []Review
	if err := cursor.All(ctx, &reviews); err != nil || reviews == nil {
		reviews = []Review{}
	}

	packets := ReviewsToPacketList(reviews)
	return &GetReviewsResponsePacket{
		Reviews: packets,
	}, nil
}

func CreateReview(w http.ResponseWriter, r *http.Request, req CreateReviewRequest) (*CreateReviewResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return nil, err
	}

	vars := mux.Vars(r)
	productId := vars["productId"]
	if productId == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return nil, errors.New("product ID required")
	}

	if req.Rating < 1 || req.Rating > 5 || strings.TrimSpace(req.Comment) == "" {
		http.Error(w, "Valid rating (1-5) and non-empty comment are required", http.StatusBadRequest)
		return nil, errors.New("invalid rating or comment")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get user name for review display
	userName := "Customer"
	userCol := db.GetCollection(db.DefaultDB, user.CollectionUsers)
	var u user.User
	if err := userCol.FindOne(ctx, bson.M{"_id": userId}).Decode(&u); err == nil {
		if u.FirstName != "" {
			userName = strings.TrimSpace(u.FirstName + " " + u.LastName)
		} else if u.Email != "" {
			userName = strings.Split(u.Email, "@")[0]
		}
	}

	now := time.Now().UTC().Format(time.RFC3339)
	newReview := Review{
		ID:        uuid.NewString(),
		ProductID: productId,
		UserID:    userId,
		UserName:  userName,
		Rating:    req.Rating,
		Comment:   strings.TrimSpace(req.Comment),
		Pinned:    false,
		CreatedAt: now,
		UpdatedAt: now,
	}

	reviewCol := getCollection()
	_, err = reviewCol.InsertOne(ctx, newReview)
	if err != nil {
		http.Error(w, "Failed to create review", http.StatusInternalServerError)
		return nil, err
	}

	w.WriteHeader(http.StatusCreated)
	packet := ReviewToPacket(newReview)
	return &CreateReviewResponsePacket{
		Review:  packet,
		Success: true,
		Message: "Review submitted successfully",
	}, nil
}

func UpdateReview(w http.ResponseWriter, r *http.Request, req UpdateReviewRequest) (*UpdateReviewResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return nil, err
	}

	vars := mux.Vars(r)
	reviewId := vars["reviewId"]
	if reviewId == "" {
		http.Error(w, "Review ID is required", http.StatusBadRequest)
		return nil, errors.New("review ID required")
	}

	if req.Rating < 1 || req.Rating > 5 || strings.TrimSpace(req.Comment) == "" {
		http.Error(w, "Valid rating (1-5) and non-empty comment are required", http.StatusBadRequest)
		return nil, errors.New("invalid rating or comment")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := getCollection()
	now := time.Now().UTC().Format(time.RFC3339)

	filter := bson.M{"_id": reviewId}
	if userId != user.AdminEmail {
		filter["userId"] = userId
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
		return nil, errors.New("review not found")
	}

	var updated Review
	_ = collection.FindOne(ctx, bson.M{"_id": reviewId}).Decode(&updated)
	packet := ReviewToPacket(updated)

	return &UpdateReviewResponsePacket{
		Review:  packet,
		Success: true,
		Message: "Review updated successfully",
	}, nil
}

func DeleteReview(w http.ResponseWriter, r *http.Request) (utils.SuccessResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return utils.SuccessResponsePacket{}, err
	}

	vars := mux.Vars(r)
	reviewId := vars["reviewId"]
	if reviewId == "" {
		http.Error(w, "Review ID is required", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("review ID required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := getCollection()
	filter := bson.M{"_id": reviewId}
	if userId != user.AdminEmail {
		filter["userId"] = userId
	}

	result, err := collection.DeleteOne(ctx, filter)
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Review not found or unauthorized", http.StatusNotFound)
		return utils.SuccessResponsePacket{}, errors.New("review not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Review deleted successfully",
	}, nil
}

func PinReview(w http.ResponseWriter, r *http.Request, req PinReviewRequest) (utils.SuccessResponsePacket, error) {
	_, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return utils.SuccessResponsePacket{}, err
	}

	vars := mux.Vars(r)
	reviewId := vars["reviewId"]
	if reviewId == "" {
		http.Error(w, "Review ID is required", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("review ID required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := getCollection()
	result, err := collection.UpdateOne(ctx, bson.M{"_id": reviewId}, bson.M{"$set": bson.M{"pinned": req.Pinned}})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Review not found", http.StatusNotFound)
		return utils.SuccessResponsePacket{}, errors.New("review not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Review pin status updated",
	}, nil
}
