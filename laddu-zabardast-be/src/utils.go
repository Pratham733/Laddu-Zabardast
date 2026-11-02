package utils

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Pratham733/laddu-zabardast-be/src/config"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// GenerateToken helper signs a new JWT session token
func GenerateToken(ID, email string) (string, error) {
	claims := &Claims{
		UserID: ID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	jwtSecret := []byte(config.AppConfig.Auth.JWTSecret)
	return token.SignedString(jwtSecret)
}

func SetTokenCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     AuthToken,
		Value:    token,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
		Path:     "/",
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})
}

func SetHeader(w http.ResponseWriter, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
}

// WriteJSON formats and writes a JSON response.
// It merges the optional message parameter into the data map if provided.
func WriteJSON(w http.ResponseWriter, statusCode int, data map[string]any, message string) {
	SetHeader(w, statusCode)

	// Initialize map if nil to prevent panics
	if data == nil {
		data = make(map[string]any)
	}

	// Add message if it is not empty
	if message != "" {
		data["message"] = message
	}

	json.NewEncoder(w).Encode(data)
}
