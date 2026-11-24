package user

import (
	"context"
	"errors"
	"net/http"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

func GetUserHandler(w http.ResponseWriter, r *http.Request) (*GetUserResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	collection := getCollection()
	var u User
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		return nil, err
	}

	return &GetUserResponsePacket{
		User: BuildUserResponse(u),
	}, nil
}

func UpdateProfileHandler(w http.ResponseWriter, r *http.Request, req UpdateProfileRequestPacket) (*UpdateProfileResponsePacket, error) {
	userId, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}

	updates, err := validateUpdateProfileReq(req)
	if err != nil {
		return nil, err
	}

	collection := getCollection()
	result, err := collection.UpdateOne(r.Context(), bson.M{"_id": userId}, bson.M{"$set": updates})
	if err != nil || result.MatchedCount == 0 {
		return nil, errors.New("failed to update profile")
	}

	var updated User
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
	var u User
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

	result, err := collection.UpdateOne(r.Context(), bson.M{"_id": userId, "password": u.Password}, bson.M{
		"$set":   bson.M{"password": string(hashedPassword)},
		"$unset": bson.M{"passwordReset": ""},
	})
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}

	if result.MatchedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("password was changed. Please try again")
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
	var u User
	err = collection.FindOne(r.Context(), bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		return nil, err
	}

	addresses := ModelAddressesToPacket(u.Addresses)

	return &GetAddressesResponsePacket{
		Addresses: addresses,
	}, nil
}

func SaveAddressHandler(w http.ResponseWriter, r *http.Request, req AddressRequestPacket) (*AddressMutationResponse, error) {
	return saveUserAddress(r, req, false)
}

func UpdateAddressHandler(w http.ResponseWriter, r *http.Request, req AddressRequestPacket) (*AddressMutationResponse, error) {
	req.ID = mux.Vars(r)["id"]
	return saveUserAddress(r, req, true)
}

func saveUserAddress(r *http.Request, req AddressRequestPacket, requireExisting bool) (*AddressMutationResponse, error) {
	userID, err := utils.GetUserID(r)
	if err != nil {
		return nil, err
	}
	if err := validateSaveAddressReq(req); err != nil {
		return nil, err
	}
	if req.ID == "" {
		if requireExisting {
			return nil, errors.New("address ID required")
		}
		req.ID = uuid.NewString()
	}
	address := Address{
		ID: req.ID, Label: req.Label, Street: req.Street, City: req.City,
		State: req.State, Country: req.Country, PostalCode: req.PostalCode, IsDefault: req.IsDefault,
	}
	addresses, err := writeUserAddress(r.Context(), userID, address, requireExisting)
	if err != nil {
		return nil, err
	}
	return &AddressMutationResponse{
		Message: "Address saved successfully", AddressID: address.ID, Addresses: ModelAddressesToPacket(addresses),
	}, nil
}

func writeUserAddress(ctx context.Context, userID string, address Address, requireExisting bool) ([]Address, error) {
	collection := getCollection()
	for attempt := 0; attempt < 3; attempt++ {
		var snapshot bson.Raw
		if err := collection.FindOne(ctx, bson.M{"_id": userID}).Decode(&snapshot); err != nil {
			return nil, err
		}
		original := snapshot.Lookup("addresses")
		var account User
		if err := bson.Unmarshal(snapshot, &account); err != nil {
			return nil, err
		}

		next := address
		if len(account.Addresses) == 0 && !requireExisting {
			next.IsDefault = true
		}
		addresses := account.Addresses
		found := false
		for i, saved := range addresses {
			if saved.ID == next.ID {
				addresses[i] = next
				found = true
			} else if next.IsDefault {
				addresses[i].IsDefault = false
			}
		}
		if !found {
			if requireExisting {
				return nil, errors.New("address not found")
			}
			addresses = append(addresses, next)
		}

		// Match the address list we read so another add, edit or delete cannot be overwritten.
		filter := bson.M{"_id": userID}
		if original.Type == 0 {
			filter["addresses"] = bson.M{"$exists": false}
		} else {
			filter["addresses"] = original
		}
		result, err := collection.UpdateOne(ctx, filter, bson.M{"$set": bson.M{"addresses": addresses}})
		if err != nil {
			return nil, err
		}
		if result.MatchedCount == 1 {
			return addresses, nil
		}
	}
	return nil, errors.New("addresses changed, please try again")
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
	if err != nil {
		return nil, err
	}

	return &utils.SuccessResponsePacket{
		Message: "Address deleted successfully",
	}, nil
}

func GetAppUsers(w http.ResponseWriter, r *http.Request) (*GetUsersResponsePacket, error) {
	collection := getCollection()
	cursor, err := collection.Find(r.Context(), bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(r.Context())

	var users []User
	if err := cursor.All(r.Context(), &users); err != nil {
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
		User: UserResponsePacket{
			ID:        userPacket.ID,
			UserID:    userPacket.UserID,
			FirstName: userPacket.FirstName,
			LastName:  userPacket.LastName,
			Email:     userPacket.Email,
			Phone:     &userPacket.Phone,
			Role:      &userPacket.Role,
			IsAdmin:   userPacket.IsAdmin,
			PhotoURL:  &userPacket.PhotoURL,
			Picture:   &userPacket.Picture,
			Addresses: ModelAddressesToPacket(u.Addresses),
			CreatedAt: userPacket.CreatedAt,
		},
		Message: "User fetched successfully",
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
	if err != nil {
		return utils.SuccessResponsePacket{}, err
	}
	if result.DeletedCount == 0 {
		return utils.SuccessResponsePacket{}, errors.New("user not found")
	}

	return utils.SuccessResponsePacket{
		Message: "User deleted successfully",
	}, nil
}
