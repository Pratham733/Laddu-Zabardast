import { apiClient } from './apiClient';
import type { CartLineInput, CartResponse } from '@/packets/cart';

export async function getCart(userId: string, token?: string): Promise<CartResponse> {
  if (!userId || !userId.trim()) {
    throw new Error('User ID is required');
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient(`/cart/${userId.trim()}`, {
    method: 'GET',
    headers,
  });
}

export async function updateCart(userId: string, items: CartLineInput[], token?: string): Promise<CartResponse> {
  if (!userId || !userId.trim()) {
    throw new Error('User ID is required');
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient(`/cart/${userId.trim()}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ items }),
  });
}
