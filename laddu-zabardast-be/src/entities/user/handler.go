package user

import (
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
	cursor, err := collection.Find(r.Context(), bson.M{})
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return nil, err
	}
	defer cursor.Close(r.Context())

	var users []User
	if err := cursor.All(r.Context(), &users); err != nil {
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
	if err := validateUserId(id); err != nil {
		return nil, err
	}

	collection := getCollection()
	var u User
	err := collection.FindOne(r.Context(), bson.M{"_id": id}).Decode(&u)
	if err != nil {
		return nil, errors.New("user not found")
	}

	userPacket := UserToPacket(u)
	return &GetUserResponsePacket{
		User:    userPacket,
		Message: "User fetched successfully",
	}, nil
}

func CreateAppUser(w http.ResponseWriter, r *http.Request, req CreateUserRequestPacket) (*CreateUserResponsePacket, error) {
	if err := validateCreateAppUserReq(req); err != nil {
		return nil, err
	}

	collection := getCollection()
	count, err := collection.CountDocuments(r.Context(), bson.M{"email": req.Email})
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("user already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
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

	_, err = collection.InsertOne(r.Context(), newUser)
	if err != nil {
		return nil, err
	}

	w.WriteHeader(http.StatusCreated)
	userPacket := UserToPacket(newUser)
	return &CreateUserResponsePacket{
		User:    userPacket,
		Message: "User created successfully",
	}, nil
}

func UpdateAppUser(w http.ResponseWriter, r *http.Request, req UpdateUserRequestPacket) (*UpdateUserResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	updates, err := validateUpdateAppUserReq(id, req)
	if err != nil {
		return nil, err
	}

	collection := getCollection()
	result, err := collection.UpdateOne(r.Context(), bson.M{"_id": id}, bson.M{"$set": updates})
	if err != nil || result.MatchedCount == 0 {
		return nil, errors.New("user not found")
	}

	var updated User
	_ = collection.FindOne(r.Context(), bson.M{"_id": id}).Decode(&updated)

	userPacket := UserToPacket(updated)
	return &UpdateUserResponsePacket{
		User:    userPacket,
		Message: "User updated successfully",
	}, nil
}

func DeleteAppUser(w http.ResponseWriter, r *http.Request) (utils.SuccessResponsePacket, error) {
	vars := mux.Vars(r)
	id := vars["id"]
	if err := validateUserId(id); err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	collection := getCollection()
	result, err := collection.DeleteOne(r.Context(), bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("user not found")
	}

	return utils.SuccessResponsePacket{
		Message: "User deleted successfully",
	}, nil
}
