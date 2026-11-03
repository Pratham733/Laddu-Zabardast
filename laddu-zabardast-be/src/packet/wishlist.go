package packet

import "github.com/Pratham733/laddu-zabardast-be/src/model"

type WishlistPayload struct {
	Items []model.Product `json:"items"`
}
