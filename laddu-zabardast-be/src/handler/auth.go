package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"strconv"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/config"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	models "github.com/Pratham733/laddu-zabardast-be/src/model"
	"github.com/Pratham733/laddu-zabardast-be/src/packet"
	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

func SignupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req packet.SignupRequest
	err := utils.ValidateSignup(&req, w, r)
	if err != nil {
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingUser models.User
	err = collection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	} else if !errors.Is(err, mongo.ErrNoDocuments) {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	newUser := models.User{
		ID:        uuid.NewString(),
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Addresses: []models.Address{},
	}

	_, err = collection.InsertOne(ctx, newUser)
	if err != nil {
		http.Error(w, "Error inserting user", http.StatusInternalServerError)
		return
	}

	token, err := utils.GenerateToken(newUser.ID, newUser.Email)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	utils.SetTokenCookie(w, token)

	resUser := packet.UserResponse{
		ID:        newUser.ID,
		FirstName: newUser.FirstName,
		LastName:  newUser.LastName,
		Email:     newUser.Email,
		Addresses: []packet.AddressResponse{},
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]any{
		utils.User: resUser,
	}, "User created successfully")
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req packet.LoginRequest
	err := utils.ValidateLogin(&req, w, r)
	if err != nil {
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	loginErr := collection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if loginErr != nil {
		if errors.Is(loginErr, mongo.ErrNoDocuments) {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Email)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	utils.SetTokenCookie(w, token)

	utils.WriteJSON(w, http.StatusOK, nil, "Login successful")
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     utils.AuthToken,
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Path:     "/",
	})

	utils.WriteJSON(w, http.StatusOK, nil, "Logged out successfully")
}

// parseClaims extracts and validates the JWT from the request cookie.
func parseClaims(r *http.Request) (*utils.Claims, error) {
	cookie, err := r.Cookie(utils.AuthToken)
	if err != nil {
		return nil, err
	}
	tokenStr := cookie.Value
	claims := &utils.Claims{}
	jwtSecret := []byte(config.AppConfig.Auth.JWTSecret)
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// modelAddressesToPacket converts model addresses to packet addresses.
func modelAddressesToPacket(addrs []models.Address) []packet.AddressResponse {
	if addrs == nil {
		return []packet.AddressResponse{}
	}
	result := make([]packet.AddressResponse, 0, len(addrs))
	for _, a := range addrs {
		result = append(result, packet.AddressResponse{
			ID:         a.ID,
			Label:      a.Label,
			Street:     a.Street,
			City:       a.City,
			State:      a.State,
			Country:    a.Country,
			PostalCode: a.PostalCode,
			IsDefault:  a.IsDefault,
		})
	}
	return result
}

func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	resUser := packet.UserResponse{
		ID:        user.ID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Email:     user.Email,
		Phone:     user.Phone,
		Addresses: modelAddressesToPacket(user.Addresses),
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		utils.User: resUser,
	}, "Profile fetched successfully")
}

func GetUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		utils.User: map[string]any{
			utils.Email: user.Email,
			utils.Name:  user.FirstName + " " + user.LastName,
			"firstName": user.FirstName,
			"lastName":  user.LastName,
		},
	}, "User fetched successfully")
}

func UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	var req packet.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updateFields := bson.M{}
	if req.FirstName != "" {
		updateFields["firstName"] = req.FirstName
	}
	if req.LastName != "" {
		updateFields["lastName"] = req.LastName
	}
	// Allow clearing phone by allowing empty string update
	if req.Phone != "" || r.ContentLength > 0 {
		updateFields["phone"] = req.Phone
	}

	if len(updateFields) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.UpdateOne(
		ctx,
		bson.M{"_id": claims.UserID},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Profile updated successfully")
}

func ChangePasswordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	var req struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		http.Error(w, "Incorrect current password", http.StatusUnauthorized)
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": claims.UserID}, bson.M{"$set": bson.M{"password": string(hashed)}})
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Password changed successfully")
}

func GetAddressesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"addresses": modelAddressesToPacket(user.Addresses),
	}, "Addresses fetched successfully")
}

func SaveAddressHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	var addr models.Address
	if err := json.NewDecoder(r.Body).Decode(&addr); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if user.Addresses == nil {
		user.Addresses = []models.Address{}
	}

	// Handle defaults logic
	if addr.IsDefault {
		for i := range user.Addresses {
			user.Addresses[i].IsDefault = false
		}
	}

	if r.Method == http.MethodPut && addr.ID != "" {
		// Update existing
		found := false
		for i, existing := range user.Addresses {
			if existing.ID == addr.ID {
				user.Addresses[i] = addr
				found = true
				break
			}
		}
		if !found {
			// Fallback: append if not found
			addr.ID = uuid.NewString()
			user.Addresses = append(user.Addresses, addr)
		}
	} else {
		// Create new
		addr.ID = uuid.NewString()
		user.Addresses = append(user.Addresses, addr)
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": claims.UserID}, bson.M{"$set": bson.M{"addresses": user.Addresses}})
	if err != nil {
		http.Error(w, "Failed to save address", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"addresses": modelAddressesToPacket(user.Addresses),
	}, "Address saved successfully")
}

func DeleteAddressHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, err := parseClaims(r)
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	idxStr := vars["idx"]
	idx, err := strconv.Atoi(idxStr)
	if err != nil {
		http.Error(w, "Invalid address index", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection(utils.LadduZabardast, utils.Users)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": claims.UserID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if idx < 0 || idx >= len(user.Addresses) {
		http.Error(w, "Address index out of bounds", http.StatusBadRequest)
		return
	}

	user.Addresses = append(user.Addresses[:idx], user.Addresses[idx+1:]...)

	_, err = collection.UpdateOne(ctx, bson.M{"_id": claims.UserID}, bson.M{"$set": bson.M{"addresses": user.Addresses}})
	if err != nil {
		http.Error(w, "Failed to delete address", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"addresses": modelAddressesToPacket(user.Addresses),
	}, "Address deleted successfully")
}
