import { apiClient } from './apiClient';
import type { GetOrdersResponse } from '@/packets';

export async function getOrders(email?: string): Promise<GetOrdersResponse> {
  const params: Record<string, string> = {};
  if (email) {
    params.email = email;
  }
  return apiClient('/orders', {
    method: 'GET',
    params,
  });
}

export async function getOrderById(orderId: string): Promise<any> {
  return apiClient(`/orders/${orderId}`, {
    method: 'GET',
  });
}

export async function createOrder(orderData: any): Promise<{ orderId: string }> {
  return apiClient('/create-order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

export async function updateOrderStatus(orderId: string, status: string): Promise<any> {
  return apiClient('/orders', {
    method: 'PATCH',
    body: JSON.stringify({ orderId, status }),
  });
}

export async function updatePaymentStatus(orderId: string, paymentStatus: 'completed' | 'paid'): Promise<any> {
  return apiClient('/orders', {
    method: 'PATCH',
    body: JSON.stringify({ orderId, paymentStatus }),
  });
}

export async function generateInvoice(orderId: string): Promise<Response> {
  return apiClient(`/generate-invoice`, {
    method: 'GET',
    params: { orderId },
    responseType: 'response',
  });
}
