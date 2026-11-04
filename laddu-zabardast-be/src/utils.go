package utils

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
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

// ParseClaims extracts and validates JWT claims from Bearer header or auth cookie
func ParseClaims(r *http.Request) (*Claims, error) {
	var tokenStr string
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
	} else if cookie, err := r.Cookie(AuthToken); err == nil && cookie.Value != "" {
		tokenStr = cookie.Value
	} else if authHeader != "" {
		tokenStr = authHeader
	}

	if tokenStr == "" {
		return nil, errors.New("authorization required")
	}

	claims := &Claims{}
	jwtSecret := []byte(config.AppConfig.Auth.JWTSecret)
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}

	return claims, nil
}

func GetUserID(r *http.Request) (string, error) {
	claims, err := ParseClaims(r)
	if err == nil && claims != nil && claims.UserID != "" {
		return claims.UserID, nil
	}

	if err != nil {
		return "", err
	}
	return "", errors.New("user ID not found in request")
}

type SuccessResponsePacket struct {
	Message string `json:"message"`
}

// WithResponse wraps a handler returning a typed response packet and an error.
func WithResponse[Resp any](fn func(w http.ResponseWriter, r *http.Request) (Resp, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp, err := fn(w, r)
		if err != nil {
			return
		}
		_ = json.NewEncoder(w).Encode(resp)
	}
}

// WithBodyAndResponse wraps a handler that accepts a request packet and returns a response packet.
func WithBodyAndResponse[Req any, Resp any](fn func(w http.ResponseWriter, r *http.Request, req Req) (Resp, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var req Req
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		resp, err := fn(w, r, req)
		if err != nil {
			return
		}
		_ = json.NewEncoder(w).Encode(resp)
	}
}

// WithBody decodes the JSON request body into req of type T and passes it into fn.
// If decoding fails, it returns 400 Bad Request immediately.
func WithBody[T any](fn func(w http.ResponseWriter, r *http.Request, req T)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req T
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		fn(w, r, req)
	}
}
