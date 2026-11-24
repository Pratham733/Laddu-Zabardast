import { useEffect, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button-new";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/store-feedback";
import { errorMessage, formatMoney, orderStatus, statusValue } from "@/lib/store-display";
import { saveInvoice, saveInvoiceArchive } from "@/mobile/invoice";
import { exportInvoices, getInvoiceHistory, type InvoiceHistoryRow } from "@/routes/invoices";
import { generateInvoice, getOrderById } from "@/routes/orders";

import type { Order } from "@/models";
import { BoxContents } from "@/components/box-contents";
import { OrderInstructions } from "@/components/order-instructions";
import { sweetenerLabel } from "@/lib/sweeteners";

const indiaMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" });
const invoiceDate = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });

function currentMonth() {
  const parts = indiaMonth.formatToParts();
  return `${parts.find(part => part.type === "year")?.value}-${parts.find(part => part.type === "month")?.value}`;
}

export default function InvoiceHistoryPanel() {
  const [month, setMonth] = useState(currentMonth);
  const [rows, setRows] = useState<InvoiceHistoryRow[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState<string>();
  const [busy, setBusy] = useState("");
  const [loadError, setLoadError] = useState("");
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void getInvoiceHistory(month, controller.signal).then(({ invoices }) => {
      if (!controller.signal.aborted) setRows(invoices);
    }).catch(reason => {
      if (controller.signal.aborted) return;
      const message = errorMessage(reason, "Could not load invoice history.").trim();
      setLoadError(message === "404 page not found"
        ? "Invoice history is unavailable on this backend. Restart it with the latest code and try again."
        : message);
    });
    return () => controller.abort();
  }, [month, attempt]);

  function resetResults() {
    setRows(null);
    setExpanded(undefined);
    setSelected(new Set());
    setLoadError("");
    setDownloadError("");
  }

  function toggle(orderId: string) {
    setSelected(previous => {
      const next = new Set(previous);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  const allSelected = Boolean(rows?.length && selected.size === rows.length);
  async function download(orderId?: string) {
    setBusy(orderId || "archive");
    setDownloadError("");
    try {
      if (orderId) {
        await saveInvoice(await generateInvoice(orderId), orderId);
      } else {
        const selection = allSelected ? { all: true as const } : { orderIds: [...selected] };
        await saveInvoiceArchive(await exportInvoices(month, selection), month);
      }
    } catch (reason) {
      setDownloadError(errorMessage(reason, "Could not download the invoices."));
    } finally {
      setBusy("");
    }
  }

  return <section aria-labelledby="invoice-history-title" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id="invoice-history-title" className="text-xl font-semibold">Invoice history</h2>
        <label htmlFor="invoice-month" className="mt-2 block text-sm font-medium">Invoice month</label>
        <Input id="invoice-month" type="month" value={month} disabled={Boolean(busy)} className="mt-1 min-h-11 w-auto"
          onChange={event => {
            const value = event.target.value;
            if (!/^\d{4}-\d{2}$/.test(value) || value === month) return;
            resetResults();
            setMonth(value);
          }} />
      </div>
      {Boolean(rows?.length) && <Button className="min-h-11" disabled={!selected.size || Boolean(busy)} onClick={() => void download()}>
        <Download />{busy === "archive" ? "Preparing ZIP…" : `Download selected (${selected.size})`}
      </Button>}
    </div>
    {downloadError && <p className="text-sm text-destructive" role="alert">{downloadError}</p>}
    {loadError ? <ErrorState message={loadError} onRetry={() => { resetResults(); setAttempt(value => value + 1); }} />
      : !rows ? <LoadingState label="Loading invoices…" />
      : rows.length === 0 ? <EmptyState title="No invoices for this month" description="Choose another month to view its invoices." />
      : <div className="divide-y rounded-xl border bg-card">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 text-sm font-semibold">
          <input type="checkbox" checked={allSelected} disabled={Boolean(busy)} className="h-4 w-4 accent-primary"
            onChange={event => setSelected(event.target.checked ? new Set(rows.map(row => row.orderId)) : new Set())} />
          Select all ({rows.length})
        </label>
        <ul className="divide-y" aria-label="Monthly invoices">
          {rows.map(row => (
            <li key={row.orderId} className="px-4 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={selected.has(row.orderId)} disabled={Boolean(busy)} onChange={() => toggle(row.orderId)}
                  className="h-4 w-4 shrink-0 accent-primary" />
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold">{row.customerName || "Customer"}</span>
                  <span className="block text-xs text-muted-foreground">{row.number} · {invoiceDate.format(new Date(row.issuedAt))} · {formatMoney(row.totalAmount)}</span>
                </span>
              </label>
              <Button type="button" variant="outline" className="min-h-11 shrink-0"
                aria-expanded={expanded === row.orderId} aria-controls={`invoice-order-${row.orderId}`}
                onClick={() => setExpanded(expanded === row.orderId ? undefined : row.orderId)}>
                <ChevronDown className={expanded === row.orderId ? "rotate-180" : ""} />
                {expanded === row.orderId ? "Hide details" : "View details"}
              </Button>
              <Button variant="outline" className="min-h-11 shrink-0" disabled={Boolean(busy)}
                aria-label={`Download invoice ${row.number}`} onClick={() => void download(row.orderId)}>
                <Download />{busy === row.orderId ? "Preparing…" : "PDF"}
              </Button>
              </div>
              <div id={`invoice-order-${row.orderId}`} hidden={expanded !== row.orderId}>
                {expanded === row.orderId && <InvoiceOrderDetails orderId={row.orderId} />}
              </div>
            </li>
          ))}
        </ul>
      </div>}
  </section>;
}


function InvoiceOrderDetails({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getOrderById(orderId, controller.signal).then(({ order }) => {
      if (!controller.signal.aborted) setOrder(order);
    }).catch(reason => {
      if (!controller.signal.aborted) setError(errorMessage(reason, "Could not load order details."));
    });
    return () => controller.abort();
  }, [orderId, attempt]);

  const shipping = order?.shippingDetails;
  return <div className="mt-3 space-y-3 border-t py-3">
    {error ? /order not found/i.test(error)
      ? <p className="text-sm text-muted-foreground">The original order is unavailable. Its PDF is still available above.</p>
      : <ErrorState message={error} onRetry={() => { setError(""); setAttempt(value => value + 1); }} />
    : !order ? <LoadingState label="Loading order details…" />
    : <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={orderStatus(order)} />
        <StatusBadge status={statusValue(order.paymentStatus)} />
        {order.paymentMethod && <span className="text-sm text-muted-foreground">
          {["cod", "cash"].includes(order.paymentMethod) ? "Cash on delivery" : order.paymentMethod.toUpperCase()}
        </span>}
      </div>
      <h3 className="text-sm font-semibold">Items ordered</h3>
      <ul className="divide-y rounded-lg bg-muted/30 px-3">
        {order.items.map((item, index) => (
          <li className="flex justify-between gap-3 py-3 text-sm" key={`${item.id ?? item.productId}-${index}`}>
            <div className="min-w-0">
              <p className="break-words font-medium">{item.quantity} × {item.name}</p>
              {item.sweetener && <p className="text-muted-foreground">{sweetenerLabel(item.sweetener)}</p>}
              <BoxContents box={item.box} />
            </div>
            <span className="shrink-0 tabular-nums">{formatMoney(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      {shipping && <div className="text-sm">
        <h3 className="font-semibold">Delivery and contact</h3>
        <p className="break-words">{[shipping.address || shipping.streetAddress, shipping.city, shipping.state, shipping.postalCode || shipping.zip, shipping.country].filter(Boolean).join(", ")}</p>
        <p className="break-all text-muted-foreground">{[shipping.email || order.email, shipping.phone].filter(Boolean).join(" · ")}</p>
      </div>}
      <OrderInstructions instructions={order.instructions} />
    </>}
  </div>;
}
