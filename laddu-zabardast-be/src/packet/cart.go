package packet

import "github.com/Pratham733/laddu-zabardast-be/src/model"

type CartPayload struct {
	Items []model.CartItem `json:"items"`
}
