package review

import "encoding/json"

// Review represents the database document for a customer review in MongoDB.
type Review struct {
	ID        string `bson:"_id,omitempty" json:"id"`
	ProductID string `bson:"productId" json:"productId"`
	UserID    string `bson:"userId" json:"userId"`
	UserName  string `bson:"userName" json:"userName"`
	Rating    int    `bson:"rating" json:"rating"`
	Comment   string `bson:"comment" json:"comment"`
	Pinned    bool   `bson:"pinned" json:"pinned"`
	CreatedAt string `bson:"createdAt" json:"createdAt"`
	UpdatedAt string `bson:"updatedAt" json:"updatedAt"`
}

func (r Review) MarshalJSON() ([]byte, error) {
	type Alias Review
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

func (r *Review) UnmarshalJSON(data []byte) error {
	type Alias Review
	aux := &struct {
		ID      string `json:"id"`
		MongoID string `json:"_id"`
		*Alias
	}{
		Alias: (*Alias)(r),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if aux.ID != "" {
		r.ID = aux.ID
	} else if aux.MongoID != "" {
		r.ID = aux.MongoID
	}
	return nil
}
