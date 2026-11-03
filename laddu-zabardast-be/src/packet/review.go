package packet

type CreateReviewRequest struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

type UpdateReviewRequest struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

type PinReviewRequest struct {
	Pinned bool `json:"pinned"`
}
