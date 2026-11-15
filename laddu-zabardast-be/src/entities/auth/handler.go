package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

func SignupHandler(w http.ResponseWriter, r *http.Request, req SignupRequestPacket) (*AuthResponsePacket, error) {
	err := validateSignupReq(req)
	if err != nil {
		return nil, err
	}

	if user.IsConfiguredAdminEmail(req.Email) {
		return nil, errors.New("this address is reserved for the local admin account")
	}

	collection := getCollection()
	count, err := collection.CountDocuments(r.Context(), bson.M{"email": strings.TrimSpace(req.Email)})
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

	_, err = collection.InsertOne(r.Context(), newUser)
	if err != nil {
		return nil, err
	}

	token, err := utils.GenerateToken(userID, newUser.Email)
	if err != nil {
		return nil, err
	}

	utils.SetTokenCookie(w, token)

	return &AuthResponsePacket{
		Token:   token,
		User:    user.BuildUserResponse(newUser),
		Message: "Account created successfully",
	}, nil
}

func LoginHandler(w http.ResponseWriter, r *http.Request, req LoginRequestPacket) (*AuthResponsePacket, error) {
	err := validateLoginReq(req)
	if err != nil {
		return nil, err
	}

	collection := getCollection()
	var u user.User
	err = collection.FindOne(r.Context(), bson.M{"email": strings.TrimSpace(req.Email)}).Decode(&u)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := utils.GenerateToken(u.ID, u.Email)
	if err != nil {
		return nil, err
	}

	utils.SetTokenCookie(w, token)

	return &AuthResponsePacket{
		Token:   token,
		User:    user.BuildUserResponse(u),
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
