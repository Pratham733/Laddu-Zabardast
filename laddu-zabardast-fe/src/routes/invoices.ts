import { apiClient } from "./apiClient";

export interface InvoiceHistoryRow {
  orderId: string;
  number: string;
  issuedAt: string;
  customerName: string;
  totalAmount: number;
}

export function getInvoiceHistory(month: string, signal?: AbortSignal) {
  return apiClient<{ month: string; invoices: InvoiceHistoryRow[] }>("/admin/invoices", {
    params: { month },
    signal,
  });
}

export function exportInvoices(month: string, selection: { all: true } | { orderIds: string[] }) {
  return apiClient<Response>("/admin/invoices/export", {
    method: "POST",
    body: JSON.stringify({ month, ...selection }),
    responseType: "download",
  });
}
