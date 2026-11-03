package model

import "encoding/json"

type Product struct {
	ID          string  `bson:"_id,omitempty" json:"id"`
	Key         string  `bson:"key" json:"key"`
	Name        string  `bson:"name" json:"name"`
	Description string  `bson:"description" json:"description"`
	Price       float64 `bson:"price" json:"price"`
	ImageUrl    string  `bson:"imageUrl" json:"imageUrl"`
	Category    string  `bson:"category" json:"category"`
	Available   bool    `bson:"available" json:"available"`
	Weight      string  `bson:"weight,omitempty" json:"weight,omitempty"`
}

func (p Product) MarshalJSON() ([]byte, error) {
	type Alias Product
	return json.Marshal(&struct {
		Alias
		ID      string `json:"id"`
		MongoID string `json:"_id"`
	}{
		Alias:   (Alias)(p),
		ID:      p.ID,
		MongoID: p.ID,
	})
}

func (p *Product) UnmarshalJSON(data []byte) error {
	type Alias Product
	aux := &struct {
		ID      string `json:"id"`
		MongoID string `json:"_id"`
		*Alias
	}{
		Alias: (*Alias)(p),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if aux.ID != "" {
		p.ID = aux.ID
	} else if aux.MongoID != "" {
		p.ID = aux.MongoID
	}
	return nil
}
