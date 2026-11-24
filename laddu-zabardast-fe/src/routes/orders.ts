import { apiClient } from './apiClient';
import type { CartLineInput, CartResponse } from "@/packets/cart";
import type { FormSchema } from "@/schema";
import type { GetOrdersResponse, OrderCreateResponse, OrderDetailsResponse, OrderUpdateResponse } from '@/packets/order';

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

export async function getOrderById(orderId: string, signal?: AbortSignal): Promise<OrderDetailsResponse> {
  if (!orderId || !orderId.trim()) {
    throw new Error('Order ID is required');
  }
  return apiClient(`/orders/${encodeURIComponent(orderId.trim())}`, {
    method: 'GET',
    signal,
  });
}

export interface ReorderResult extends CartResponse {
  added: number;
  skipped: string[];
}

export function reorderItems(orderId: string, requestId: string): Promise<ReorderResult> {
  return apiClient(`/orders/${encodeURIComponent(orderId)}/reorder`, {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
}

export function cancelOrder(orderId: string): Promise<OrderUpdateResponse> {
  return apiClient(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: "POST" });
}

export async function createOrder(orderData: { shippingDetails: Omit<FormSchema, "instructions">; instructions?: string; items: CartLineInput[]; totalAmount: number; paymentMethod: "cod" | "upi" }): Promise<OrderCreateResponse> {
  if (!orderData) {
    throw new Error('Order data is required');
  }
  return apiClient('/create-order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

export async function updateOrderStatus(orderId: string, status: string): Promise<OrderUpdateResponse> {
  if (!orderId || !orderId.trim()) {
    throw new Error('Order ID is required');
  }
  if (!status || !status.trim()) {
    throw new Error('Status is required');
  }
  return apiClient('/orders', {
    method: 'PATCH',
    body: JSON.stringify({ orderId: orderId.trim(), orderStatus: status.trim() }),
  });
}

export async function updatePaymentStatus(orderId: string, paymentStatus: 'completed' | 'paid'): Promise<OrderUpdateResponse> {
  if (!orderId || !orderId.trim()) {
    throw new Error('Order ID is required');
  }
  if (!paymentStatus || !paymentStatus.trim()) {
    throw new Error('Payment status is required');
  }
  return apiClient('/orders', {
    method: 'PATCH',
    body: JSON.stringify({ orderId: orderId.trim(), paymentStatus: paymentStatus.trim() }),
  });
}

export async function generateInvoice(orderId: string): Promise<Response> {
  if (!orderId || !orderId.trim()) {
    throw new Error('Order ID is required');
  }
  return apiClient(`/generate-invoice`, {
    method: 'GET',
    params: { orderId: orderId.trim() },
    responseType: 'download',
  });
}
