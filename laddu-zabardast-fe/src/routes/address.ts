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

export async function saveAddress(address: Address, token?: string): Promise<{ addresses: Address[]; addressId: string }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const endpoint = address.id ? `/address/update/${encodeURIComponent(address.id)}` : "/address/create";
  return apiClient(endpoint, {
    method: address.id ? "PUT" : "POST",
    headers,
    body: JSON.stringify(address),
  });
}

export async function deleteAddress(id: string, token?: string): Promise<{ message: string }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient(`/address/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
}
