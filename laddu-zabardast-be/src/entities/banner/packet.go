package banner

// BannerPacket represents a banner in API responses.
type BannerPacket struct {
	ID          string `json:"id"`
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"imageURL"`
	AltURL      string `json:"altURL"`
	ButtonLink  string `json:"buttonLink"`
	ButtonText  string `json:"buttonText"`
	Order       int    `json:"order"`
	IsActive    bool   `json:"isActive"`
}

type CreateBannerRequestPacket struct {
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"imageURL"`
	AltURL      string `json:"altURL"`
	ButtonLink  string `json:"buttonLink"`
	ButtonText  string `json:"buttonText"`
	Order       int    `json:"order"`
	IsActive    bool   `json:"isActive"`
}

type CreateBannerRequest = CreateBannerRequestPacket

// UpdateBannerRequest represents the incoming payload to update an existing banner.
type UpdateBannerRequestPacket struct {
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"imageURL"`
	AltURL      string `json:"altURL"`
	ButtonLink  string `json:"buttonLink"`
	ButtonText  string `json:"buttonText"`
	Order       int    `json:"order"`
	IsActive    bool   `json:"isActive"`
}

type UpdateBannerRequest = UpdateBannerRequestPacket

// Conversion helpers

func BannerToPacket(b Banner) BannerPacket {
	return BannerPacket{
		ID:          b.ID,
		Key:         b.Key,
		Name:        b.Name,
		Description: b.Description,
		ImageURL:    b.ImageURL,
		AltURL:      b.AltURL,
		ButtonLink:  b.ButtonLink,
		ButtonText:  b.ButtonText,
		Order:       b.Order,
		IsActive:    b.IsActive,
	}
}

func BannersToPacketList(banners []Banner) []BannerPacket {
	result := make([]BannerPacket, 0, len(banners))
	for _, b := range banners {
		result = append(result, BannerToPacket(b))
	}
	return result
}
