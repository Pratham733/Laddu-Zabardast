package banner

// Banner represents a hero or promotional banner document in MongoDB.
type Banner struct {
	ID          string `bson:"id" json:"id"`
	Key         string `bson:"key" json:"key"`
	Name        string `bson:"name" json:"name"`
	Description string `bson:"description" json:"description"`
	ImageURL    string `bson:"image_url" json:"imageURL"`
	AltURL      string `bson:"alt_url" json:"altURL"`
	ButtonLink  string `bson:"button_link" json:"buttonLink"`
	ButtonText  string `bson:"button_text" json:"buttonText"`
	Order       int    `bson:"order" json:"order"`
	IsActive    bool   `bson:"is_active" json:"isActive"`
}
