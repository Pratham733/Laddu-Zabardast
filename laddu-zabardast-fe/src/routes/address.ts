import { apiClient } from './apiClient';
import type { Address } from '@/models';

export async function getAddresses(token?: string): Promise<{ addresses: Address[] }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient('/address', {
    method: 'GET',
    headers,
  });
}

export async function saveAddress(address: Address, token?: string, method: 'POST' | 'PUT' = 'POST'): Promise<{ addresses: Address[] }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient('/address', {
    method,
    headers,
    body: JSON.stringify(address),
  });
}

export async function deleteAddress(id: string, token?: string): Promise<{ addresses: Address[] }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient(`/address/${id}`, {
    method: 'DELETE',
    headers,
  });
}
