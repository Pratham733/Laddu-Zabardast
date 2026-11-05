package review

import (
	"errors"
	"strings"
)

func validateProductId(productId string) error {
	if strings.TrimSpace(productId) == "" {
		return errors.New("product ID is required")
	}
	return nil
}

func validateReviewId(reviewId string) error {
	if strings.TrimSpace(reviewId) == "" {
		return errors.New("review ID is required")
	}
	return nil
}

func validateCreateReviewReq(productId string, req CreateReviewRequestPacket) error {
	if err := validateProductId(productId); err != nil {
		return err
	}
	if req.Rating < 1 || req.Rating > 5 || strings.TrimSpace(req.Comment) == "" {
		return errors.New("valid rating (1-5) and non-empty comment are required")
	}
	return nil
}

func validateUpdateReviewReq(reviewId string, req UpdateReviewRequestPacket) error {
	if err := validateReviewId(reviewId); err != nil {
		return err
	}
	if req.Rating < 1 || req.Rating > 5 || strings.TrimSpace(req.Comment) == "" {
		return errors.New("valid rating (1-5) and non-empty comment are required")
	}
	return nil
}
