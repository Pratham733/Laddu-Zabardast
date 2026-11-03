import { apiClient } from './apiClient';
import type { WishlistResponse } from '@/packets';

export async function getWishlist(userId: string, token?: string): Promise<WishlistResponse> {
  if (!userId || !userId.trim()) {
    throw new Error('User ID is required');
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient(`/wishlist/${userId.trim()}`, {
    method: 'GET',
    headers,
  });
}

export async function updateWishlist(userId: string, wishlist: any[], token?: string): Promise<any> {
  if (!userId || !userId.trim()) {
    throw new Error('User ID is required');
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient(`/wishlist/${userId.trim()}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ items: wishlist }),
  });
}
