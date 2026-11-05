package banner

import (
	"errors"
	"strings"
)

func validateCreateBannerReq(req *CreateBannerRequestPacket) error {
	if strings.TrimSpace(req.Name) == "" {
		return errors.New("banner name required")
	}
	if strings.TrimSpace(req.ImageURL) == "" {
		return errors.New("banner imageURL required")
	}
	if req.ButtonLink == "" {
		req.ButtonLink = "/shop"
	}
	if req.ButtonText == "" {
		req.ButtonText = "Shop Now"
	}
	if req.Key == "" {
		req.Key = "banner"
	}
	return nil
}

func validateUpdateBannerReq(id string, req UpdateBannerRequestPacket) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("banner ID required")
	}
	if strings.TrimSpace(req.Name) == "" {
		return errors.New("banner name required")
	}
	if strings.TrimSpace(req.ImageURL) == "" {
		return errors.New("banner imageURL required")
	}
	return nil
}

func validateBannerId(id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("banner ID required")
	}
	return nil
}
