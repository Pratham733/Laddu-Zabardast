package cart

import (
	"errors"
	"github.com/Pratham733/laddu-zabardast-be/src/entities/box"
)

func validateCartPayload(payload CartPayloadPacket) error {
	for _, itemPacket := range payload.Items {
		if itemPacket.Box != nil && itemPacket.Sweetener != "" {
			return errors.New("sweetener is only supported on individual products")
		}
		if err := box.ValidateItem(itemPacket.ProductID, itemPacket.Box); err != nil {
			return err
		}
		if itemPacket.Quantity <= 0 {
			return errors.New("invalid quantity")
		}
	}
	return nil
}
