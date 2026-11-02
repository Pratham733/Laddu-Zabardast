import { apiClient } from './apiClient';
import type { Product } from '@/models';
import type { ProductsResponse } from '@/packets';

export async function getProducts(category?: string): Promise<ProductsResponse> {
  return apiClient('/products', {
    method: 'GET',
    params: category ? { category } : undefined,
  });
}

export async function getProductById(id: string): Promise<{ product: Product }> {
  return apiClient(`/products/${id}`, {
    method: 'GET',
  });
}

export async function addProduct(product: Omit<Product, 'id' | 'id'>): Promise<ProductsResponse> {
  return apiClient('/products/create', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<ProductsResponse> {
  return apiClient(`/products/edit/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string): Promise<ProductsResponse> {
  return apiClient(`/products/delete/${id}`, {
    method: 'DELETE',
  });
}

