import { apiClient } from './apiClient';
import type { Review } from '@/models';

export async function getProductReviews(productId: string): Promise<{ reviews: Review[] }> {
  return apiClient(`/products/${productId}/reviews`, {
    method: 'GET',
  });
}

export async function submitReview(productId: string, formState: { rating: number; comment: string }): Promise<{ review: Review }> {
  return apiClient(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(formState),
  });
}

export async function updateReview(productId: string, reviewId: string, formState: { rating: number; comment: string }): Promise<{ review: Review }> {
  return apiClient(`/products/${productId}/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(formState),
  });
}

// Support alternative `/reviews` endpoints if used in some parts of the codebase:
export async function submitReviewLegacy(formState: any): Promise<Review> {
  return apiClient('/reviews', {
    method: 'POST',
    body: JSON.stringify(formState),
  });
}

export async function updateReviewLegacy(reviewId: string, formState: any): Promise<Review> {
  return apiClient(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(formState),
  });
}

export async function deleteReview(reviewId: string): Promise<any> {
  return apiClient(`/reviews/${reviewId}`, {
    method: 'DELETE',
  });
}

export async function pinReview(reviewId: string, pin: boolean): Promise<any> {
  return apiClient(`/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify({ pinned: pin }),
  });
}
