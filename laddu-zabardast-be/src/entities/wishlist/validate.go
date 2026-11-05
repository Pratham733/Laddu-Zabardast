package wishlist

import (
	"errors"
	"strings"
)

func validateWishlistPayload(payload WishlistPayloadPacket) error {
	for _, itemPacket := range payload.Items {
		id := strings.TrimSpace(itemPacket.ID)
		if id == "" {
			id = strings.TrimSpace(itemPacket.MongoID)
		}
		if id == "" {
			return errors.New("empty product id")
		}
	}
	return nil
}
