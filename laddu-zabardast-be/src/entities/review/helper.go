package review

import (
	"context"
	"strings"

	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func getCollection() *mongo.Collection {
	return db.GetCollection(db.DefaultDB, CollectionReviews)
}

func resolveReviewerName(ctx context.Context, userId string) string {
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
	return userName
}
