import { apiClient } from './apiClient';
import type { WishlistResponse } from '@/packets';

export async function getWishlist(userId: string, token: string): Promise<WishlistResponse> {
  return apiClient(`/wishlist/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateWishlist(userId: string, wishlist: any[], token: string): Promise<any> {
  return apiClient(`/wishlist/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items: wishlist }),
  });
}
