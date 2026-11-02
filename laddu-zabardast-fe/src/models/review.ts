export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
