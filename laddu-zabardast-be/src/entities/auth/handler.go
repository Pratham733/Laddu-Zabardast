package auth

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
	"golang.org/x/crypto/bcrypt"
)

func SignupHandler(w http.ResponseWriter, r *http.Request, req SignupRequestPacket) (*AuthResponsePacket, error) {
	err := validateSignupReq(req)
	if err != nil {
		return nil, err
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
		User:    BuildUserResponse(newUser),
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
		return nil, err
	}

	collection := getCollection()
	var u user.User
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		return nil, err
	}

	return &GetUserResponsePacket{
		User: BuildUserResponse(u),
	}, nil
}

func UpdateProfileHandler(w http.ResponseWriter, r *http.Request, req UpdateProfileRequest) (*UpdateProfileResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	err = validateUpdateProfileReq(req)
	if err != nil {
		return nil, err
	}

	collection := getCollection()
	result, err := collection.UpdateOne(r.Context(), bson.M{"_id": userId}, bson.M{"$set": req})
	if err != nil || result.MatchedCount == 0 {
		return nil, errors.New("failed to update profile")
	}

	var updated user.User
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&updated)
	if err != nil {
		return nil, err
	}

	return &UpdateProfileResponsePacket{
		User:    BuildUserResponse(updated),
		Message: "Profile updated successfully",
	}, nil
}

func ChangePasswordHandler(w http.ResponseWriter, r *http.Request, req ChangePasswordRequestPacket) (utils.SuccessResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	if err := validateChangePasswordReq(req); err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	collection := getCollection()
	var u user.User
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.CurrentPassword)); err != nil {
		return utils.SuccessResponsePacket{}, errors.New("incorrect password")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	_, err = collection.UpdateOne(r.Context(), bson.M{"_id": userId}, bson.M{"$set": bson.M{"password": string(hashedPassword)}})
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	return utils.SuccessResponsePacket{
		Message: "Password changed successfully",
	}, nil
}

func GetAddressesHandler(w http.ResponseWriter, r *http.Request) (*GetAddressesResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	collection := getCollection()
	var u user.User
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		return nil, err
	}

	addresses := ModelAddressesToPacket(u.Addresses)

	return &GetAddressesResponsePacket{
		Addresses: addresses,
	}, nil
}

func SaveAddressHandler(w http.ResponseWriter, r *http.Request, req AddressRequestPacket) (*utils.SuccessResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	if err := validateSaveAddressReq(req); err != nil {
		return nil, err
	}

	collection := getCollection()
	var u user.User
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&u)
	if err != nil {
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

	_, err = collection.UpdateOne(r.Context(), bson.M{"_id": userId}, bson.M{"$set": bson.M{"addresses": updatedAddresses}})
	if err != nil {
		return nil, err
	}

	return &utils.SuccessResponsePacket{
		Message: "Address saved successfully",
	}, nil
}

func DeleteAddressHandler(w http.ResponseWriter, r *http.Request) (*utils.SuccessResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	addressId := mux.Vars(r)["id"]
	if err := validateAddressId(addressId); err != nil {
		return nil, err
	}

	err = validateDeleteAddress(r.Context(), userId, addressId)
	if err != nil {
		return nil, err
	}

	err = deleteAddress(r.Context(), userId, addressId)

	return &utils.SuccessResponsePacket{
		Message: "Address deleted successfully",
	}, nil
}
