package auth

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

func SignupHandler(w http.ResponseWriter, r *http.Request, req SignupRequest) (*AuthResponsePacket, error) {
	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" ||
		strings.TrimSpace(req.FirstName) == "" || strings.TrimSpace(req.LastName) == "" {
		http.Error(w, "First name, last name, email, and password are required", http.StatusBadRequest)
		return nil, errors.New("missing required fields")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := collection.CountDocuments(ctx, bson.M{"email": strings.TrimSpace(req.Email)})
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

	userID := uuid.NewString()
	newUser := user.User{
		ID:        userID,
		FirstName: strings.TrimSpace(req.FirstName),
		LastName:  strings.TrimSpace(req.LastName),
		Email:     strings.TrimSpace(req.Email),
		Password:  string(hashedPassword),
		Role:      RoleCustomer,
		Addresses: []user.Address{},
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	_, err = collection.InsertOne(ctx, newUser)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return nil, err
	}

	token, err := utils.GenerateToken(userID, newUser.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return nil, err
	}

	utils.SetTokenCookie(w, token)
	w.WriteHeader(http.StatusCreated)

	return &AuthResponsePacket{
		Token:   token,
		User:    BuildUserResponse(newUser),
		Message: "Account created successfully",
	}, nil
}

func LoginHandler(w http.ResponseWriter, r *http.Request, req LoginRequest) (*AuthResponsePacket, error) {
	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return nil, errors.New("missing email or password")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err := collection.FindOne(ctx, bson.M{"email": strings.TrimSpace(req.Email)}).Decode(&u)
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return nil, errors.New("invalid credentials")
	}

	token, err := utils.GenerateToken(u.ID, u.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return nil, err
	}

	utils.SetTokenCookie(w, token)

	return &AuthResponsePacket{
		Token:   token,
		User:    BuildUserResponse(u),
		Message: "Logged in successfully",
	}, nil
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) (utils.SuccessResponsePacket, error) {
	http.SetCookie(w, &http.Cookie{
		Name:     utils.AuthToken,
		Value:    "",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	return utils.SuccessResponsePacket{
		Message: "Logged out successfully",
	}, nil
}

func GetUserHandler(w http.ResponseWriter, r *http.Request) (*GetUserResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return nil, err
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return nil, err
	}

	return &GetUserResponsePacket{
		User: BuildUserResponse(u),
	}, nil
}

func UpdateProfileHandler(w http.ResponseWriter, r *http.Request, req UpdateProfileRequest) (*UpdateProfileResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return nil, err
	}

	updates := bson.M{}
	if req.FirstName != "" {
		updates["firstName"] = strings.TrimSpace(req.FirstName)
	}
	if req.LastName != "" {
		updates["lastName"] = strings.TrimSpace(req.LastName)
	}
	if req.Phone != "" {
		updates["phone"] = strings.TrimSpace(req.Phone)
	}

	if len(updates) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return nil, errors.New("no fields to update")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": userId}, bson.M{"$set": updates})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return nil, errors.New("failed to update profile")
	}

	var updated user.User
	_ = collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&updated)

	return &UpdateProfileResponsePacket{
		User:    BuildUserResponse(updated),
		Message: "Profile updated successfully",
	}, nil
}

func ChangePasswordHandler(w http.ResponseWriter, r *http.Request, req ChangePasswordRequest) (utils.SuccessResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return utils.SuccessResponsePacket{}, err
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		http.Error(w, "Current password and new password are required", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("passwords required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return utils.SuccessResponsePacket{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.CurrentPassword)); err != nil {
		http.Error(w, "Incorrect current password", http.StatusBadRequest)
		return utils.SuccessResponsePacket{}, errors.New("incorrect password")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return utils.SuccessResponsePacket{}, err
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": userId}, bson.M{"$set": bson.M{"password": string(hashedPassword)}})
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return utils.SuccessResponsePacket{}, err
	}

	return utils.SuccessResponsePacket{
		Message: "Password changed successfully",
	}, nil
}

func GetAddressesHandler(w http.ResponseWriter, r *http.Request) (*GetAddressesResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return nil, err
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return nil, err
	}

	addresses := ModelAddressesToPacket(u.Addresses)

	return &GetAddressesResponsePacket{
		Addresses: addresses,
	}, nil
}

func SaveAddressHandler(w http.ResponseWriter, r *http.Request, req AddressRequest) (*utils.SuccessResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return nil, err
	}

	if strings.TrimSpace(req.Street) == "" || strings.TrimSpace(req.City) == "" {
		http.Error(w, "Street and city are required", http.StatusBadRequest)
		return nil, errors.New("street and city required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return nil, err
	}

	addressID := req.ID
	if addressID == "" {
		addressID = uuid.NewString()
	}

	newAddr := user.Address{
		ID:         addressID,
		Label:      req.Label,
		Street:     req.Street,
		City:       req.City,
		State:      req.State,
		Country:    req.Country,
		PostalCode: req.PostalCode,
		IsDefault:  req.IsDefault,
	}

	var updatedAddresses []user.Address
	found := false
	for _, a := range u.Addresses {
		if a.ID == addressID {
			updatedAddresses = append(updatedAddresses, newAddr)
			found = true
		} else {
			if newAddr.IsDefault {
				a.IsDefault = false
			}
			updatedAddresses = append(updatedAddresses, a)
		}
	}
	if !found {
		if newAddr.IsDefault {
			for i := range updatedAddresses {
				updatedAddresses[i].IsDefault = false
			}
		} else if len(updatedAddresses) == 0 {
			newAddr.IsDefault = true
		}
		updatedAddresses = append(updatedAddresses, newAddr)
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": userId}, bson.M{"$set": bson.M{"addresses": updatedAddresses}})
	if err != nil {
		http.Error(w, "Failed to save address", http.StatusInternalServerError)
		return nil, err
	}

	return &utils.SuccessResponsePacket{
		Message: "Address saved successfully",
	}, nil
}

func DeleteAddressHandler(w http.ResponseWriter, r *http.Request) (*utils.SuccessResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return nil, err
	}

	vars := mux.Vars(r)
	idxStr := vars["idx"]
	if idxStr == "" {
		http.Error(w, "Address index or ID is required", http.StatusBadRequest)
		return nil, errors.New("address index required")
	}

	collection := getCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return nil, err
	}

	var updatedAddresses []user.Address
	idx, err := strconv.Atoi(idxStr)
	if err == nil && idx >= 0 && idx < len(u.Addresses) {
		updatedAddresses = append(u.Addresses[:idx], u.Addresses[idx+1:]...)
	} else {
		for _, a := range u.Addresses {
			if a.ID != idxStr {
				updatedAddresses = append(updatedAddresses, a)
			}
		}
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": userId}, bson.M{"$set": bson.M{"addresses": updatedAddresses}})
	if err != nil {
		http.Error(w, "Failed to delete address", http.StatusInternalServerError)
		return nil, err
	}

	return &utils.SuccessResponsePacket{
		Message: "Address deleted successfully",
	}, nil
}
