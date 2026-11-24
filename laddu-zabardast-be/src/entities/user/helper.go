package user

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/config"
	"github.com/Pratham733/laddu-zabardast-be/src/db"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func getCollection() *mongo.Collection {
	return db.GetCollection(db.DefaultDB, CollectionUsers)
}

func deleteAddress(ctx context.Context, userId string, addressId string) error {
	collection := getCollection()
	_, err := collection.UpdateOne(ctx, bson.M{"_id": userId}, bson.M{"$pull": bson.M{"addresses": bson.M{"_id": addressId}}})
	return err
}

func validateDeleteAddress(ctx context.Context, userId string, addressId string) error {
	collection := getCollection()
	var u User
	err := collection.FindOne(ctx, bson.M{"_id": userId}).Decode(&u)
	if err != nil {
		return err
	}
	if u.Addresses == nil {
		return errors.New("user does not have any addresses")
	}
	for _, address := range u.Addresses {
		if address.ID == addressId {
			return nil
		}
	}
	return errors.New("address not found")
}

func IsConfiguredAdminEmail(email string) bool {
	configured := strings.TrimSpace(config.AppConfig.Credentials.AdminEmail)
	return configured != "" && strings.EqualFold(strings.TrimSpace(email), configured)
}

func (u User) EffectiveRole() string {
	if !config.AppConfig.Production && IsConfiguredAdminEmail(u.Email) {
		return RoleAdmin
	}
	return u.Role
}

func (u User) IsAdmin() bool {
	return u.EffectiveRole() == RoleAdmin
}

func BuildUserResponse(u User) UserResponsePacket {
	var phone *string
	if u.Phone != "" {
		phone = &u.Phone
	}
	var role *string
	if effective := u.EffectiveRole(); effective != "" {
		role = &effective
	}
	var photoURL *string
	if u.PhotoURL != "" {
		photoURL = &u.PhotoURL
	}
	var picture *string
	if u.Picture != "" {
		picture = &u.Picture
	}

	return UserResponsePacket{
		GoogleConnected: u.GoogleSubject != "",
		PasswordLogin:   u.Password != "",
		ID:              u.ID,
		UserID:          u.ID,
		FirstName:       u.FirstName,
		LastName:        u.LastName,
		Email:           u.Email,
		Phone:           phone,
		Role:            role,
		IsAdmin:         u.IsAdmin(),
		PhotoURL:        photoURL,
		Picture:         picture,
		Addresses:       ModelAddressesToPacket(u.Addresses),
		CreatedAt:       u.CreatedAt,
	}
}

// AuthenticatedUser reads the current account so role changes take effect immediately.
func AuthenticatedUser(r *http.Request) (User, error) {
	id, err := utils.GetUserID(r)
	if err != nil {
		return User{}, err
	}
	var account User
	err = getCollection().FindOne(r.Context(), bson.M{"_id": id}).Decode(&account)
	return account, err
}

func AdminOnly(next http.HandlerFunc) http.HandlerFunc {
	return AdminOnlyWithTimeout(next, utils.DefaultTimeout)
}

func AdminOnlyWithTimeout(next http.HandlerFunc, timeout time.Duration) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), timeout)
		defer cancel()
		account, err := AuthenticatedUser(r.WithContext(ctx))
		if err != nil {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}
		if !account.IsAdmin() {
			http.Error(w, "Administrator access required", http.StatusForbidden)
			return
		}
		next(w, r.WithContext(ctx))
	}
}
