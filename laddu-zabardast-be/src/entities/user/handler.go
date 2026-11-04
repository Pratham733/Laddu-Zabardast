package user

import (
	"context"
	"errors"
	"net/http"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

func GetAppUsers(w http.ResponseWriter, r *http.Request) (*GetUsersResponsePacket, error) {
	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []User
	if err := cursor.All(ctx, &users); err != nil {
		http.Error(w, "Failed to decode users", http.StatusInternalServerError)
		return nil, err
	}

	userList := UsersToPacketList(users)
	return &GetUsersResponsePacket{
		Users:   userList,
		Message: "Users fetched successfully",
	}, nil
}

func GetAppUser(w http.ResponseWriter, r *http.Request) (*GetUserResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return nil, errors.New("user ID required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u User
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return nil, err
	}

	userPacket := UserToPacket(u)
	return &GetUserResponsePacket{
		User:    userPacket,
		Message: "User fetched successfully",
	}, nil
}

func CreateAppUser(w http.ResponseWriter, r *http.Request, req CreateUserRequest) (*CreateUserResponsePacket, error) {
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		http.Error(w, "First name, last name, email, and password are required", http.StatusBadRequest)
		return nil, errors.New("missing required fields")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := collection.CountDocuments(ctx, bson.M{"email": req.Email})
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return nil, err
	}
	if count > 0 {
		http.Error(w, "User with this email already exists", http.StatusConflict)
		return nil, errors.New("user already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return nil, err
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
		return nil, err
	}

	w.WriteHeader(http.StatusCreated)
	userPacket := UserToPacket(newUser)
	return &CreateUserResponsePacket{
		User:    userPacket,
		Message: "User created successfully",
	}, nil
}

func UpdateAppUser(w http.ResponseWriter, r *http.Request, req UpdateUserRequest) (*UpdateUserResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return nil, errors.New("user ID required")
	}

	collection := getCollection()
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
		return nil, errors.New("no fields to update")
	}

	result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updates})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Failed to update user or user not found", http.StatusNotFound)
		return nil, errors.New("user not found")
	}

	var updated User
	_ = collection.FindOne(ctx, bson.M{"_id": id}).Decode(&updated)

	userPacket := UserToPacket(updated)
	return &UpdateUserResponsePacket{
		User:    userPacket,
		Message: "User updated successfully",
	}, nil
}

func DeleteAppUser(w http.ResponseWriter, r *http.Request) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("user ID required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, "Failed to delete user or user not found", http.StatusNotFound)
		return utils.SuccessResponsePacket{}, errors.New("user not found")
	}

	return utils.SuccessResponsePacket{
		Message: "User deleted successfully",
	}, nil
}
