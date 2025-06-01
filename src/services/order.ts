// src/services/order.ts
import type { Order, SimplifiedOrder } from "@/types/order";

export async function getUserOrders(email: string, token: string): Promise<SimplifiedOrder[]> {
  const res = await fetch('/api/orders/by-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include', // Sends cookies automatically
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    // Keep this error for debugging API failures
    const text = await res.text();
    throw new Error('Failed to fetch orders');
  }

  const data = await res.json();

  return data.orders.map((order: any) => ({
    id: order.id,
    date: order.createdAt,
    totalAmount: order.totalAmount,
    status: order.orderStatus,
    items: order.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
  }));
}

export async function getOrderDetails(orderId: string): Promise<Order | null> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    // Keep this error for debugging API failures
    const text = await res.text();
    return null;
  }

  const data = await res.json();

  return data.order;
}
