import { apiClient } from './apiClient';
import type { Product } from '@/models';
import type { ProductsResponse } from '@/packets/product';

export async function getProducts(category?: string): Promise<ProductsResponse> {
  return apiClient('/products', {
    method: 'GET',
    params: category ? { category } : undefined,
  });
}

export async function getProductById(id: string): Promise<{ product: Product }> {
  if (!id || !id.trim()) {
    throw new Error('Product ID is required');
  }
  return apiClient('/products/get-product', {
    method: 'GET',
    params: { productId: id.trim() },
  });
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<ProductsResponse> {
  if (!product || !product.name?.trim()) {
    throw new Error('Product name is required');
  }
  return apiClient('/products/create', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<ProductsResponse> {
  if (!id || !id.trim()) {
    throw new Error('Product ID is required');
  }
  return apiClient(`/products/edit/${id.trim()}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string): Promise<ProductsResponse> {
  if (!id || !id.trim()) {
    throw new Error('Product ID is required');
  }
  return apiClient(`/products/delete/${id.trim()}`, {
    method: 'DELETE',
  });
}


export async function uploadProductImage(file: File): Promise<{ imageUrl: string }> {
  const form = new FormData();
  form.append('image', file);
  return apiClient('/upload-product-image', { method: 'POST', body: form });
}
