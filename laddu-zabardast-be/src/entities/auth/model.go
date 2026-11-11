package auth

import (
	"github.com/golang-jwt/jwt/v5"
)

type SessionClaims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}
