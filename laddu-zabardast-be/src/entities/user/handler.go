package user

import (
	"context"
	"net/http"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

func GetAppUsers(w http.ResponseWriter, r *http.Request) {
	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var users []User
	if err := cursor.All(ctx, &users); err != nil {
		http.Error(w, "Failed to decode users", http.StatusInternalServerError)
		return
	}

	packets := UsersToPacketList(users)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"users": packets,
	}, "Users fetched successfully")
}

func GetAppUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u User
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	packet := UserToPacket(u)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"user": packet,
	}, "User fetched successfully")
}

func CreateAppUser(w http.ResponseWriter, r *http.Request, req CreateUserRequest) {
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		http.Error(w, "First name, last name, email, and password are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if user already exists
	count, err := collection.CountDocuments(ctx, bson.M{"email": req.Email})
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if count > 0 {
		http.Error(w, "User with this email already exists", http.StatusConflict)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	role := req.Role
	if role == "" {
		role = RoleCustomer
	}

	newUser := User{
		ID:        uuid.NewString(),
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Phone:     req.Phone,
		Role:      role,
		Addresses: []Address{},
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	_, err = collection.InsertOne(ctx, newUser)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	packet := UserToPacket(newUser)
	utils.WriteJSON(w, http.StatusCreated, map[string]any{
		"user": packet,
	}, "User created successfully")
}

func UpdateAppUser(w http.ResponseWriter, r *http.Request, req UpdateUserRequest) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updates := bson.M{}
	if req.FirstName != "" {
		updates["firstName"] = req.FirstName
	}
	if req.LastName != "" {
		updates["lastName"] = req.LastName
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}

	if len(updates) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updates})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Failed to update user or user not found", http.StatusNotFound)
		return
	}

	var updated User
	_ = collection.FindOne(ctx, bson.M{"_id": id}).Decode(&updated)

	packet := UserToPacket(updated)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"user": packet,
	}, "User updated successfully")
}

func DeleteAppUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Failed to delete user or user not found", http.StatusNotFound)
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "User deleted successfully")
}
