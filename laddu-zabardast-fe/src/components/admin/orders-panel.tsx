import { useEffect, useState } from "react";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import type { Order } from "@/models";
import { Button } from "@/components/ui/button-new";
import { Input } from "@/components/ui/input";
import { sweetenerLabel } from "@/lib/sweeteners";
import { BoxContents } from "@/components/box-contents";
import { OrderInstructions } from "@/components/order-instructions";
import { EmptyState, StatusBadge } from "@/components/store-feedback";
import { formatMoney, formatOrderDate, isPaid, orderStatus, statusValue } from "@/lib/store-display";
import { adminAction, adminSelect } from "./product-editor";

const statuses = ["pending", "processing", "shipped", "delivered"];
type Filter = "all" | "prepare" | "shipped" | "delivered" | "cancelled" | "unpaid";
interface Props {
  orders: Order[]; busy: string; query: string; filter: Filter;
  onQuery: (query: string) => void; onFilter: (filter: Filter) => void;
  onStatus: (id: string, status: string) => Promise<void>;
  onPaid: (order: Order) => void;
}

export function OrdersPanel({ orders, busy, query, filter, onQuery, onFilter, onStatus, onPaid }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = orders.filter(order => {
    const match = [order.id, order.shippingDetails?.name, order.shippingDetails?.email, order.email, ...order.items.map(item => item.name)].join(" ").toLowerCase().includes(query.trim().toLowerCase());
    const state = orderStatus(order);
    return match && (filter === "all" || (filter === "prepare" ? ["pending", "processing"].includes(state) : filter === "unpaid" ? !isPaid(order) && state !== "cancelled" : state === filter));
  });
  return <section aria-label="Manage orders" className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input type="search" aria-label="Search orders" placeholder="Search order ID, customer or product" value={query} onChange={e => onQuery(e.target.value)} className="h-11 pl-9" /></div>
      <select aria-label="Filter orders" className={`${adminSelect} sm:w-48`} value={filter} onChange={e => onFilter(e.target.value as Filter)}><option value="all">All orders</option><option value="prepare">To prepare</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="unpaid">Awaiting payment</option><option value="cancelled">Cancelled</option></select>
    </div>
    <p className="text-xs text-muted-foreground">{filtered.length} of {orders.length} orders</p>
    {filtered.length === 0 ? <EmptyState title={orders.length ? "No matching orders" : "No orders yet"} description={orders.length ? "Try a different search or order filter." : "Customer orders will appear here when they check out."} /> :
      <div className="overflow-hidden rounded-xl border bg-card">
        {filtered.map(order => order.id && <OrderRow key={order.id} order={order} busy={busy} expanded={expanded === order.id} onExpand={() => setExpanded(expanded === order.id ? null : order.id!)} onStatus={onStatus} onPaid={onPaid} />)}
      </div>}
  </section>;
}

function OrderRow({ order, busy, expanded, onExpand, onStatus, onPaid }: { order: Order; busy: string; expanded: boolean; onExpand: () => void; onStatus: Props["onStatus"]; onPaid: Props["onPaid"] }) {
  const id = order.id!;
  const current = orderStatus(order);
  const [next, setNext] = useState(current);
  useEffect(() => setNext(current), [current]);
  const [error, setError] = useState("");
  const step = statuses.indexOf(current);
  const availableStatuses = step < 0 ? [current] : statuses.slice(step);
  const selected = availableStatuses.includes(next) ? next : current;
  async function save() {
    setError("");
    try { await onStatus(id, selected); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update this order."); }
  }
  return <article className="border-b p-4 last:border-b-0 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-sm font-semibold">Order #{id.slice(-8).toUpperCase()}</p><p className="mt-1 text-xs text-muted-foreground">{formatOrderDate(order.createdAt || order.date)}</p><p className="mt-2 break-words text-sm">{order.shippingDetails?.name || "Customer"}</p></div>
      <div className="text-right"><p className="text-base font-semibold tabular-nums">{formatMoney(order.totalAmount)}</p><div className="mt-2 flex flex-wrap justify-end gap-2"><StatusBadge status={current} /><StatusBadge status={isPaid(order) ? "paid" : statusValue(order.paymentStatus)} /></div></div>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <select aria-label={`Status for order ${id.slice(-8)}`} value={selected} onChange={e => setNext(e.target.value)} className={`${adminSelect} min-w-0 flex-1 sm:max-w-44`} disabled={Boolean(busy) || availableStatuses.length === 1}>{availableStatuses.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select>
      <Button className={adminAction} disabled={Boolean(busy) || selected === current} onClick={save}>{busy === id && <Loader2 className="animate-spin" />}Save status</Button>
      {current === "pending" && <Button type="button" variant="outline" className="h-11 text-destructive" disabled={Boolean(busy)} onClick={() => void onStatus(id, "cancelled")}>Cancel order</Button>}
      <Button variant="outline" className="h-11" onClick={onExpand} aria-expanded={expanded} aria-controls={`admin-order-${id}`}><ChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} />{expanded ? "Hide details" : "View details"}</Button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {expanded && <div id={`admin-order-${id}`} className="mt-4 space-y-4 border-t pt-4">
      <p className="break-all font-mono text-xs text-muted-foreground">{id}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="text-sm"><h3 className="mb-2 font-semibold">Delivery</h3><p>{order.shippingDetails?.name}</p><p className="break-words text-muted-foreground">{order.shippingDetails?.address || order.shippingDetails?.streetAddress}</p><p className="text-muted-foreground">{order.shippingDetails?.city}, {order.shippingDetails?.state} {order.shippingDetails?.postalCode || order.shippingDetails?.zip}</p><p className="text-muted-foreground">{order.shippingDetails?.country}</p></div>
        <div className="min-w-0 text-sm"><h3 className="mb-2 font-semibold">Contact & payment</h3><p className="break-all">{order.shippingDetails?.email || order.email}</p><p className="mt-1">{order.shippingDetails?.phone}</p><p className="mt-2 text-muted-foreground">{order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod?.toUpperCase() || "Payment"}</p>{!isPaid(order) && current !== "cancelled" && <Button className="mt-2 h-11" variant="outline" disabled={Boolean(busy)} onClick={() => onPaid(order)}>Mark payment received</Button>}</div>
      </div>
      <OrderInstructions instructions={order.instructions} />
      <ul className="divide-y rounded-lg bg-muted/30 px-3">{order.items.map((item, index) => <li key={item.id || item.productId || index} className="flex justify-between gap-3 py-3 text-sm"><div className="min-w-0"><p className="font-medium">{item.quantity} × {item.name}</p>{item.sweetener && <p className="text-sm text-muted-foreground">{sweetenerLabel(item.sweetener)}</p>}<BoxContents box={item.box} /></div><span className="shrink-0 tabular-nums">{formatMoney(item.price * item.quantity)}</span></li>)}</ul>
    </div>}
  </article>;
}

export type { Filter as OrderFilter };
