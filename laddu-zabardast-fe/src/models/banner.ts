export interface BannerItem {
  id: string;
  key: string;
  name: string;
  description: string;
  imageURL: string;
  altURL: string;
  buttonLink: string;
  buttonText: string;
  order: number;
  isActive: boolean;
}

export interface CreateBannerPayload {
  key?: string;
  name: string;
  description?: string;
  imageURL: string;
  altURL?: string;
  buttonLink?: string;
  buttonText?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateBannerPayload {
  key?: string;
  name: string;
  description?: string;
  imageURL: string;
  altURL?: string;
  buttonLink?: string;
  buttonText?: string;
  order?: number;
  isActive?: boolean;
}
