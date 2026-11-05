package review

import "encoding/json"

// ReviewPacket represents a review in API responses.
type ReviewPacket struct {
	ID        string `json:"id"`
	MongoID   string `json:"_id,omitempty"`
	ProductID string `json:"productId"`
	UserID    string `json:"userId"`
	UserName  string `json:"userName"`
	Rating    int    `json:"rating"`
	Comment   string `json:"comment"`
	Pinned    bool   `json:"pinned"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

func (r ReviewPacket) MarshalJSON() ([]byte, error) {
	type Alias ReviewPacket
	return json.Marshal(&struct {
		Alias
		ID      string `json:"id"`
		MongoID string `json:"_id"`
	}{
		Alias:   (Alias)(r),
		ID:      r.ID,
		MongoID: r.ID,
	})
}

type CreateReviewRequestPacket struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

type CreateReviewRequest = CreateReviewRequestPacket

// UpdateReviewRequest represents the incoming payload to update an existing review.
type UpdateReviewRequestPacket struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

type UpdateReviewRequest = UpdateReviewRequestPacket

// PinReviewRequest represents the incoming payload to toggle pin status on a review.
type PinReviewRequestPacket struct {
	Pinned bool `json:"pinned"`
}

type PinReviewRequest = PinReviewRequestPacket

type GetReviewsResponsePacket struct {
	Reviews []ReviewPacket `json:"reviews"`
}

type CreateReviewResponsePacket struct {
	Review  ReviewPacket `json:"review"`
	Success bool         `json:"success"`
	Message string       `json:"message,omitempty"`
}

type UpdateReviewResponsePacket struct {
	Review  ReviewPacket `json:"review"`
	Success bool         `json:"success"`
	Message string       `json:"message,omitempty"`
}

// Conversion helpers

func ReviewToPacket(r Review) ReviewPacket {
	return ReviewPacket{
		ID:        r.ID,
		MongoID:   r.ID,
		ProductID: r.ProductID,
		UserID:    r.UserID,
		UserName:  r.UserName,
		Rating:    r.Rating,
		Comment:   r.Comment,
		Pinned:    r.Pinned,
		CreatedAt: r.CreatedAt,
		UpdatedAt: r.UpdatedAt,
	}
}

func ReviewsToPacketList(reviews []Review) []ReviewPacket {
	result := make([]ReviewPacket, 0, len(reviews))
	for _, r := range reviews {
		result = append(result, ReviewToPacket(r))
	}
	return result
}
