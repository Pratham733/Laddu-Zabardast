import { getOrderById, getOrders } from "@/routes/orders";
import type { Order, SimplifiedOrder } from "@/models";
import { format, parseISO, compareDesc } from "date-fns";

export const getUserOrders = async (email: string): Promise<SimplifiedOrder[]> => {
  if (!email || !email.trim()) {
    throw new Error("Email is required to fetch orders");
  }
  const { orders } = await getOrders(email.trim());
  return orders.flatMap((order) => order.id ? [{
    id: order.id,
    date: order.date || order.createdAt || new Date().toISOString(),
    totalAmount: order.totalAmount,
    status: order.status || "processing",
    items: order.items.reduce((quantity, item) => quantity + item.quantity, 0),
  }] : []);
};

export { getOrders };

export const getOrderDetails = async (orderId: string): Promise<Order | null> => {
  const { order } = await getOrderById(orderId);
  return order ?? null;
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