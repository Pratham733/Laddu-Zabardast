package auth

import (
	"github.com/golang-jwt/jwt/v5"
)

// SessionClaims represents the JWT claims stored in auth tokens.
type SessionClaims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}
