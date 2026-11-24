import type { Order } from "@/models";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
export function formatMoney(value: number) {
  return money.format(Number.isFinite(value) ? value : 0);
}
export function statusValue(value: unknown, fallback = "pending"): string {
  if (typeof value === "string" && value) return value.toLowerCase();
  if (value && typeof value === "object" && "status" in value && typeof value.status === "string") return value.status.toLowerCase();
  return fallback;
}
export const orderStatus = (order: Order) => statusValue(order.orderStatus, order.status || "processing");
export const isPaid = (order: Order) => ["paid", "completed"].includes(statusValue(order.paymentStatus));
export function formatOrderDate(value?: string) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
export const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;
