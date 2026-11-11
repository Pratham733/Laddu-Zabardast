package auth

import (
	"github.com/Pratham733/laddu-zabardast-be/src/entities/user"
)

type SignupRequestPacket struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type LoginRequestPacket struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponsePacket struct {
	Token   string                  `json:"token,omitempty"`
	User    user.UserResponsePacket `json:"user,omitempty"`
	Message string                  `json:"message,omitempty"`
}
