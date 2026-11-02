package utils

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Pratham733/laddu-zabardast-be/src/packet"
)

func ValidateSignup(req *packet.SignupRequest, w http.ResponseWriter, r *http.Request) error {
	err := json.NewDecoder(r.Body).Decode(req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return err
	}

	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return errors.New("missing registration fields")
	}

	return nil
}

func ValidateLogin(req *packet.LoginRequest, w http.ResponseWriter, r *http.Request) error {
	err := json.NewDecoder(r.Body).Decode(req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return err
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return errors.New("missing login fields")
	}

	return nil
}
