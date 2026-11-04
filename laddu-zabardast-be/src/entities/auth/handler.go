package auth

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

func SignupHandler(w http.ResponseWriter, r *http.Request, req SignupRequest) {
	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" ||
		strings.TrimSpace(req.FirstName) == "" || strings.TrimSpace(req.LastName) == "" {
		http.Error(w, "First name, last name, email, and password are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if user already exists
	count, err := collection.CountDocuments(ctx, bson.M{"email": strings.TrimSpace(req.Email)})
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
		return
	}

	token, err := utils.GenerateToken(userID, newUser.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	utils.SetTokenCookie(w, token)

	userResp := BuildUserResponse(newUser)
	utils.WriteJSON(w, http.StatusCreated, map[string]any{
		"token": token,
		"user":  userResp,
	}, "Account created successfully")
}

func LoginHandler(w http.ResponseWriter, r *http.Request, req LoginRequest) {
	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err := collection.FindOne(ctx, bson.M{"email": strings.TrimSpace(req.Email)}).Decode(&u)
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	token, err := utils.GenerateToken(u.ID, u.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	utils.SetTokenCookie(w, token)

	userResp := BuildUserResponse(u)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"token": token,
		"user":  userResp,
	}, "Logged in successfully")
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     utils.AuthToken,
		Value:    "",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
	}, "Logged out successfully")
}

func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	claims, err := utils.ParseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	userResp := BuildUserResponse(u)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"user": userResp,
	}, "")
}

func GetUserHandler(w http.ResponseWriter, r *http.Request) {
	GetProfileHandler(w, r)
}

func UpdateProfileHandler(w http.ResponseWriter, r *http.Request, req UpdateProfileRequest) {
	claims, err := utils.ParseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
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
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": claims.UserID}, bson.M{"$set": updates})
	if err != nil || result.MatchedCount == 0 {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	var updated user.User
	_ = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&updated)

	userResp := BuildUserResponse(updated)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"user": userResp,
	}, "Profile updated successfully")
}

func ChangePasswordHandler(w http.ResponseWriter, r *http.Request, req ChangePasswordRequest) {
	claims, err := utils.ParseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		http.Error(w, "Current password and new password are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.CurrentPassword)); err != nil {
		http.Error(w, "Incorrect current password", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": claims.UserID}, bson.M{"$set": bson.M{"password": string(hashedPassword)}})
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
	}, "Password changed successfully")
}

func GetAddressesHandler(w http.ResponseWriter, r *http.Request) {
	claims, err := utils.ParseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	resp := ModelAddressesToPacket(u.Addresses)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"addresses": resp,
	}, "")
}

func SaveAddressHandler(w http.ResponseWriter, r *http.Request, req AddressRequest) {
	claims, err := utils.ParseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	if strings.TrimSpace(req.Street) == "" || strings.TrimSpace(req.City) == "" {
		http.Error(w, "Street and city are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
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

	// Update existing or append new
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

	_, err = collection.UpdateOne(ctx, bson.M{"_id": claims.UserID}, bson.M{"$set": bson.M{"addresses": updatedAddresses}})
	if err != nil {
		http.Error(w, "Failed to save address", http.StatusInternalServerError)
		return
	}

	resp := ModelAddressesToPacket(updatedAddresses)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"addresses": resp,
		"address":   AddressResponse(req),
	}, "Address saved successfully")
}

func DeleteAddressHandler(w http.ResponseWriter, r *http.Request) {
	claims, err := utils.ParseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	idxStr := vars["idx"]
	if idxStr == "" {
		http.Error(w, "Address index or ID is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, CollectionUsers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u user.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&u)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	var updatedAddresses []user.Address
	idx, err := strconv.Atoi(idxStr)
	if err == nil && idx >= 0 && idx < len(u.Addresses) {
		updatedAddresses = append(u.Addresses[:idx], u.Addresses[idx+1:]...)
	} else {
		// Try matching by ID
		for _, a := range u.Addresses {
			if a.ID != idxStr {
				updatedAddresses = append(updatedAddresses, a)
			}
		}
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": claims.UserID}, bson.M{"$set": bson.M{"addresses": updatedAddresses}})
	if err != nil {
		http.Error(w, "Failed to delete address", http.StatusInternalServerError)
		return
	}

	resp := ModelAddressesToPacket(updatedAddresses)
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"addresses": resp,
	}, "Address deleted successfully")
}
