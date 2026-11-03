import { apiClient } from './apiClient';
import type { Review } from '@/models';

export async function getProductReviews(productId: string): Promise<{ reviews: Review[] }> {
  if (!productId || !productId.trim()) {
    throw new Error('Product ID is required');
  }
  return apiClient(`/products/${productId.trim()}/reviews`, {
    method: 'GET',
  });
}

export async function submitReview(productId: string, formState: { rating: number; comment: string }): Promise<{ review: Review }> {
  if (!productId || !productId.trim()) {
    throw new Error('Product ID is required');
  }
  return apiClient(`/products/${productId.trim()}/reviews`, {
    method: 'POST',
    body: JSON.stringify(formState),
  });
}

export async function updateReview(productId: string, reviewId: string, formState: { rating: number; comment: string }): Promise<{ review: Review }> {
  if (!productId || !productId.trim()) {
    throw new Error('Product ID is required');
  }
  if (!reviewId || !reviewId.trim()) {
    throw new Error('Review ID is required');
  }
  return apiClient(`/products/${productId.trim()}/reviews/${reviewId.trim()}`, {
    method: 'PUT',
    body: JSON.stringify(formState),
  });
}

export async function deleteReview(reviewId: string): Promise<any> {
  if (!reviewId || !reviewId.trim()) {
    throw new Error('Review ID is required');
  }
  return apiClient(`/reviews/${reviewId.trim()}`, {
    method: 'DELETE',
  });
}

export async function pinReview(reviewId: string, pin: boolean): Promise<any> {
  if (!reviewId || !reviewId.trim()) {
    throw new Error('Review ID is required');
  }
  return apiClient(`/reviews/${reviewId.trim()}`, {
    method: 'PATCH',
    body: JSON.stringify({ pinned: pin }),
  });
}
