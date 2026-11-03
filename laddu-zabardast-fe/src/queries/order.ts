import { apiClient } from "@/routes/apiClient";
import type { Order, SimplifiedOrder } from "@/models";
import { format, parseISO, compareDesc } from "date-fns";

export const getUserOrders = async (email: string): Promise<SimplifiedOrder[]> => {
  if (!email || !email.trim()) {
    throw new Error("Email is required to fetch orders");
  }
  const data = await apiClient(`/orders?email=${encodeURIComponent(email.trim())}`, {
    method: "GET",
  });
  return (data.orders || []).map((o: any) => ({
    id: o.id,
    date: o.date || o.createdAt || new Date().toISOString(),
    totalAmount: typeof o.totalAmount === "number" ? o.totalAmount : 0,
    status: o.status || o.orderStatus || "Processing",
    items: Array.isArray(o.items)
      ? o.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0)
      : typeof o.items === "number"
      ? o.items
      : 1,
  }));
};

export const getOrders = async (): Promise<{ orders: Order[] }> => {
  return apiClient("/orders", { method: "GET" });
};

export const getOrderDetails = async (orderId: string): Promise<Order | null> => {
  if (!orderId || !orderId.trim()) {
    throw new Error("Order ID is required");
  }
  const data = await apiClient(`/orders/${orderId.trim()}`, { method: "GET" });
  return data.order || null;
};

export const groupOrdersByMonth = (orders: SimplifiedOrder[]) => {
  const safeDate = (d: string) => {
    try {
      const parsed = parseISO(d);
      if (isNaN(parsed.getTime())) return new Date();
      return parsed;
    } catch {
      return new Date();
    }
  };

  const sortedOrders = [...orders].sort((a, b) =>
    compareDesc(safeDate(a.date), safeDate(b.date)),
  );
  return sortedOrders.reduce(
    (acc, order) => {
      const monthYear = format(safeDate(order.date), "MMMM yyyy");
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(order);
      return acc;
    },
    {} as Record<string, SimplifiedOrder[]>,
  );
};