package cart

import (
	"errors"
	"strings"
)

func validateCartPayload(payload CartPayloadPacket) error {
	for _, itemPacket := range payload.Items {
		pID := strings.TrimSpace(itemPacket.ProductID)
		if pID == "" {
			return errors.New("empty productId")
		}
		if itemPacket.Quantity <= 0 {
			return errors.New("invalid quantity")
		}
	}
	return nil
}
