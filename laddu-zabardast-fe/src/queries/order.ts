import { apiClient } from "@/routes/apiClient";
import type { Order, SimplifiedOrder } from "@/models";
import { format, parseISO, compareDesc } from "date-fns";

export const getUserOrders = async (email: string): Promise<SimplifiedOrder[]> => {
  const data = await apiClient(`/orders?email=${encodeURIComponent(email)}`, {
    method: "GET",
  });
  return data.orders || [];
};

export const getOrders = async (): Promise<{ orders: Order[] }> => {
  return apiClient("/orders", { method: "GET" });
};

export const getOrderDetails = async (orderId: string): Promise<Order | null> => {
  const data = await apiClient(`/orders/${orderId}`, { method: "GET" });
  return data.order || null;
};

export const groupOrdersByMonth = (orders: SimplifiedOrder[]) => {
  const sortedOrders = [...orders].sort((a, b) =>
    compareDesc(parseISO(a.date), parseISO(b.date)),
  );
  return sortedOrders.reduce(
    (acc, order) => {
      const monthYear = format(parseISO(order.date), "MMMM yyyy");
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(order);
      return acc;
    },
    {} as Record<string, SimplifiedOrder[]>,
  );
};