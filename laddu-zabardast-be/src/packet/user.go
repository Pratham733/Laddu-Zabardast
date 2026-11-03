package packet

import "encoding/json"

type User struct {
	ID        string `bson:"_id,omitempty" json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

func (u User) MarshalJSON() ([]byte, error) {
	type Alias User
	return json.Marshal(&struct {
		Alias
		ID      string `json:"id"`
		UserID  string `json:"userId"`
		MongoID string `json:"_id"`
	}{
		Alias:   (Alias)(u),
		ID:      u.ID,
		UserID:  u.ID,
		MongoID: u.ID,
	})
}
