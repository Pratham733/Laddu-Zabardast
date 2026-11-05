package review

import (
	"errors"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetProductReviews(w http.ResponseWriter, r *http.Request) (*GetReviewsResponsePacket, error) {
	vars := mux.Vars(r)
	productId := vars["productId"]
	if err := validateProductId(productId); err != nil {
		return nil, err
	}

	collection := getCollection()
	findOpts := options.Find().SetSort(bson.D{{Key: "pinned", Value: -1}, {Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(r.Context(), bson.M{"productId": productId}, findOpts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(r.Context())

	var reviews []Review
	if err := cursor.All(r.Context(), &reviews); err != nil || reviews == nil {
		reviews = []Review{}
	}

	packets := ReviewsToPacketList(reviews)
	return &GetReviewsResponsePacket{
		Reviews: packets,
	}, nil
}

func CreateReview(w http.ResponseWriter, r *http.Request, req CreateReviewRequestPacket) (*CreateReviewResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	vars := mux.Vars(r)
	productId := vars["productId"]
	if err := validateCreateReviewReq(productId, req); err != nil {
		return nil, err
	}

	userName := resolveReviewerName(r.Context(), userId)

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
	_, err = reviewCol.InsertOne(r.Context(), newReview)
	if err != nil {
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

func UpdateReview(w http.ResponseWriter, r *http.Request, req UpdateReviewRequestPacket) (*UpdateReviewResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	vars := mux.Vars(r)
	reviewId := vars["reviewId"]
	if err := validateUpdateReviewReq(reviewId, req); err != nil {
		return nil, err
	}

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

	result, err := collection.UpdateOne(r.Context(), filter, update)
	if err != nil {
		return nil, err
	}
	if result.MatchedCount == 0 {
		return nil, errors.New("review not found or unauthorized")
	}

	var updated Review
	_ = collection.FindOne(r.Context(), bson.M{"_id": reviewId}).Decode(&updated)
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
		return utils.SuccessResponsePacket{}, err
	}

	vars := mux.Vars(r)
	reviewId := vars["reviewId"]
	if err := validateReviewId(reviewId); err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	collection := getCollection()
	filter := bson.M{"_id": reviewId}
	if userId != user.AdminEmail {
		filter["userId"] = userId
	}

	result, err := collection.DeleteOne(r.Context(), filter)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	if result.DeletedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("review not found or unauthorized")
	}

	return utils.SuccessResponsePacket{
		Message: "Review deleted successfully",
	}, nil
}

func PinReview(w http.ResponseWriter, r *http.Request, req PinReviewRequestPacket) (utils.SuccessResponsePacket, error) {
	_, err := utils.GetUserID(r)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	vars := mux.Vars(r)
	reviewId := vars["reviewId"]
	if err := validateReviewId(reviewId); err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	collection := getCollection()
	result, err := collection.UpdateOne(r.Context(), bson.M{"_id": reviewId}, bson.M{"$set": bson.M{"pinned": req.Pinned}})
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	if result.MatchedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("review not found")
	}

	return utils.SuccessResponsePacket{
		Message: "Review pin status updated",
	}, nil
}
