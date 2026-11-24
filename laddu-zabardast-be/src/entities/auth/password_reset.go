package auth

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	utils "github.com/Pratham733/laddu-zabardast-be/src"
	"github.com/Pratham733/laddu-zabardast-be/src/config"
	"github.com/Pratham733/laddu-zabardast-be/src/email"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

const (
	resetLifetime = 30 * time.Minute
	resetCooldown = 2 * time.Minute
)

type passwordResetRequest struct {
	Email string `json:"email"`
}

type resetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

func passwordResetRequests() func(http.ResponseWriter, *http.Request, passwordResetRequest) (utils.SuccessResponsePacket, error) {
	smtp, smtpErr := email.LoadSMTP()
	origin := strings.TrimSpace(os.Getenv("PASSWORD_RESET_WEB_ORIGIN"))
	if origin == "" {
		origin = strings.TrimSpace(os.Getenv("GOOGLE_WEB_ORIGIN"))
	}
	if origin == "" && os.Getenv("APP_ENV") == "local" {
		origin = "http://localhost:7000"
	}
	web, urlErr := googleHTTPURL(origin)
	enabled := smtpErr == nil && smtp != nil && urlErr == nil && web.Path == "" && (!config.AppConfig.Production || web.Scheme == "https")
	requests := make(chan string, 32)
	if enabled {
		go func() {
			for address := range requests {
				if err := sendPasswordReset(smtp, origin, address); err != nil {
					log.Printf("Could not send password reset email: %T", err)
				}
			}
		}()
	}
	return func(_ http.ResponseWriter, _ *http.Request, req passwordResetRequest) (utils.SuccessResponsePacket, error) {
		address := strings.TrimSpace(req.Email)
		if len(address) > 254 || !email.IsMailbox(address) {
			return utils.SuccessResponsePacket{}, errors.New("enter a valid email address")
		}
		if !enabled {
			return utils.SuccessResponsePacket{}, errors.New("password reset email is currently unavailable")
		}
		// Queue before looking up the account so the public response does not disclose whether it exists.
		select {
		case requests <- address:
			return utils.SuccessResponsePacket{Message: "If this email belongs to an account with a password, we’ll send reset instructions. Check your inbox and spam folder."}, nil
		default:
			return utils.SuccessResponsePacket{}, errors.New("too many reset requests. Please try again shortly")
		}
	}
}

func sendPasswordReset(smtp *email.SMTP, origin, address string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	now := time.Now()
	secret := oauthSecret()
	digest := oauthDigest(secret)
	filter := bson.M{
		"email":                     address,
		"password":                  bson.M{"$type": "string", "$ne": ""},
		"passwordReset.requestedAt": bson.M{"$not": bson.M{"$gt": now.Add(-resetCooldown)}},
	}
	update := bson.M{"$set": bson.M{"passwordReset": bson.M{
		"digest": digest, "requestedAt": now, "expiresAt": now.Add(resetLifetime),
	}}}
	var account struct {
		ID    string `bson:"_id"`
		Email string `bson:"email"`
	}
	opts := options.FindOneAndUpdate().SetCollation(emailCollation).SetProjection(bson.M{"email": 1})
	accounts := getCollection()
	err := accounts.FindOneAndUpdate(ctx, filter, update, opts).Decode(&account)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil
	}
	if err != nil {
		return err
	}

	link := origin + "/reset-password#" + account.ID + "." + secret
	body := fmt.Sprintf("Use this link to reset your Laddu Zabardast password:\n\n%s\n\nThis link expires in 30 minutes and can only be used once. If you did not request a reset, ignore this email.", link)
	messageID := "password-reset." + uuid.NewString() + "@" + smtp.SenderDomain
	return smtp.Send(ctx, account.Email, messageID, "Reset your Laddu Zabardast password", body)
}

func resetPassword(_ http.ResponseWriter, r *http.Request, req resetPasswordRequest) (utils.SuccessResponsePacket, error) {
	id, secret, ok := strings.Cut(req.Token, ".")
	invalid := errors.New("this reset link is invalid or expired. Request a new link")
	if !ok || uuid.Validate(id) != nil || !validOAuthSecret(secret) {
		return utils.SuccessResponsePacket{}, invalid
	}
	if len(req.Password) < 6 || len(req.Password) > 72 || strings.TrimSpace(req.Password) == "" {
		return utils.SuccessResponsePacket{}, errors.New("use a password of at least 6 characters and at most 72 bytes")
	}
	filter := bson.M{"_id": id, "passwordReset.digest": oauthDigest(secret), "passwordReset.expiresAt": bson.M{"$gt": time.Now()}}
	accounts := getCollection()
	if err := accounts.FindOne(r.Context(), filter, options.FindOne().SetProjection(bson.M{"_id": 1})).Err(); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return utils.SuccessResponsePacket{}, invalid
		}
		return utils.SuccessResponsePacket{}, errors.New("password could not be reset. Please try again")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return utils.SuccessResponsePacket{}, errors.New("password could not be reset. Please try again")
	}
	filter["passwordReset.expiresAt"] = bson.M{"$gt": time.Now()}
	result, err := accounts.UpdateOne(r.Context(), filter, bson.M{
		"$set":   bson.M{"password": string(hash)},
		"$unset": bson.M{"passwordReset": ""},
	})
	if err != nil {
		return utils.SuccessResponsePacket{}, errors.New("password could not be reset. Please try again")
	}
	if result.MatchedCount == 0 {
		return utils.SuccessResponsePacket{}, invalid
	}
	return utils.SuccessResponsePacket{Message: "Password reset. You can now sign in with your new password."}, nil
}
