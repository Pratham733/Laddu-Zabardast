// src/types/review.ts
export interface Review {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
