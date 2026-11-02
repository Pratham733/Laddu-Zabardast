package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	models "github.com/Pratham733/laddu-zabardast-be/src/model"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func GetAppUsers(w http.ResponseWriter, r *http.Request) {
	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		http.Error(w, "Failed to decode users", http.StatusInternalServerError)
		return
	}
	if users == nil {
		users = []models.User{}
	}

	// Strip passwords before sending
	type safeUser struct {
		ID        string           `json:"_id"`
		FirstName string           `json:"firstName"`
		LastName  string           `json:"lastName"`
		Email     string           `json:"email"`
		Phone     string           `json:"phone,omitempty"`
		Addresses []models.Address `json:"addresses,omitempty"`
	}
	safe := make([]safeUser, 0, len(users))
	for _, u := range users {
		safe = append(safe, safeUser{
			ID:        u.ID,
			FirstName: u.FirstName,
			LastName:  u.LastName,
			Email:     u.Email,
			Phone:     u.Phone,
			Addresses: u.Addresses,
		})
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"users": safe,
	}, "Users fetched successfully")
}

func GetAppUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"user": map[string]any{
			"_id":       user.ID,
			"firstName": user.FirstName,
			"lastName":  user.LastName,
			"email":     user.Email,
			"phone":     user.Phone,
			"addresses": user.Addresses,
		},
	}, "User fetched successfully")
}

func CreateAppUser(w http.ResponseWriter, r *http.Request) {
	// Use SignupHandler logic for creating users via API
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	user.ID = uuid.NewString()

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, user)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]any{
		"message": "User created",
		"_id":     user.ID,
	}, "User created")
}

func UpdateAppUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	var updates bson.M
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	delete(updates, "_id")
	delete(updates, "password") // Never allow password update via this route

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updates})
	if err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{"message": "User updated"}, "User updated")
}

func DeleteAppUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{"message": "User deleted"}, "User deleted")
}
