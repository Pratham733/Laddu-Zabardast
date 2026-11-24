import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ExternalLink, FileText, LayoutDashboard, ListOrdered, Package, PanelsTopLeft, RefreshCw, Store } from "lucide-react";
import type { Order, Product } from "@/models";
import type { BannerItem, CreateBannerPayload } from "@/models/banner";
import { getOrders, updateOrderStatus, updatePaymentStatus } from "@/routes/orders";
import { addProduct, deleteProduct, getProducts, updateProduct } from "@/routes/products";
import { createBanner, deleteBanner, getAllBannersAdmin, updateBanner } from "@/routes/banner";
import { toast } from "@/hooks";
import { Button } from "@/components/ui/button-new";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/store-feedback";
import { ProductEditor, adminAction } from "@/components/admin/product-editor";
import { BannerEditor } from "@/components/admin/banner-editor";
import { StorefrontPanel } from "@/components/admin/storefront-panel";
import { CatalogPanel } from "@/components/admin/catalog-panel";
import { BannersPanel } from "@/components/admin/banners-panel";
import { OrdersPanel, type OrderFilter } from "@/components/admin/orders-panel";
import { errorMessage, formatMoney, formatOrderDate, isPaid, orderStatus } from "@/lib/store-display";

const InvoiceHistoryPanel = lazy(() => import("@/components/admin/invoice-history-panel"));

const sections = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "orders", label: "Orders", icon: ListOrdered },
  { value: "history", label: "Order History", icon: FileText },
  { value: "products", label: "Products", icon: Package },
  { value: "banners", label: "Banners", icon: PanelsTopLeft },
  { value: "storefront", label: "Storefront", icon: Store },
] as const;
type Section = typeof sections[number]["value"];
interface Confirmation { title: string; description: string; label: string; action: () => Promise<void> }
const sortBanners = (items: BannerItem[]) => [...items].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

export default function AdminPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const section = sections.some(item => item.value === requested) ? requested as Section : "overview";
  const navigate = (tab: string) => setParams({ tab });
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<Section, string>>>({});
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [productEditor, setProductEditor] = useState<{ product: Product | null }>();
  const [bannerEditor, setBannerEditor] = useState<{ banner: BannerItem | null }>();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current; setLoading(true);
    const [orderResult, productResult, bannerResult] = await Promise.allSettled([getOrders(), getProducts(), getAllBannersAdmin()]);
    if (request !== generation.current) return;
    const failures: Partial<Record<Section, string>> = {};
    if (orderResult.status === "fulfilled") setOrders([...(orderResult.value.orders || [])].sort((a, b) => (b.createdAt || b.date || "").localeCompare(a.createdAt || a.date || ""))); else failures.orders = "Orders could not be loaded. Your other store tools are still available.";
    if (productResult.status === "fulfilled") setProducts(productResult.value.products || []); else failures.products = "Your catalog could not be loaded. Try again to see the latest products.";
    if (bannerResult.status === "fulfilled") setBanners(sortBanners(bannerResult.value)); else failures.banners = "Banners could not be loaded. Try again before editing slides.";
    setErrors(failures); setLoading(false);
  }, []);
  useEffect(() => { void refresh(); return () => { generation.current++; }; }, [refresh]);

  async function mutate(key: string, action: () => Promise<void>, message: string) {
    setBusy(key); setActionError("");
    try { await action(); toast({ title: message }); }
    catch (reason) { setActionError(errorMessage(reason, "Could not save this change. Please try again.")); throw reason; }
    finally { setBusy(""); }
  }
  const openOrders = (next: OrderFilter = "all", search = "") => { setFilter(next); setQuery(search); navigate("orders"); };
  const changeStatus = (id: string, status: string) => mutate(id, async () => {
    await updateOrderStatus(id, status); setOrders(current => current.map(order => order.id === id ? { ...order, orderStatus: status, status } : order));
  }, "Order status updated");
  const handleStatus = async (id: string, status: string) => {
    if (status === "cancelled") { setActionError(""); setConfirmation({ title: "Cancel this order?", description: "The customer will see this order as cancelled. Check the order details before continuing.", label: "Cancel order", action: () => changeStatus(id, status) }); }
    else await changeStatus(id, status);
  };
  const saveProduct = (value: Omit<Product, "id">) => mutate("product", async () => {
    const result = productEditor?.product?.id ? await updateProduct(productEditor.product.id, value) : await addProduct(value);
    setProducts(result.products || []);
  }, productEditor?.product ? "Product updated" : "Product added");
  const saveBanner = (value: CreateBannerPayload) => mutate("banner", async () => {
    const edited = bannerEditor?.banner;
    if (edited) { await updateBanner(edited.id, value); setBanners(current => sortBanners(current.map(item => item.id === edited.id ? { ...item, ...value } : item))); }
    else { const created = await createBanner(value); setBanners(current => sortBanners([...current, created])); }
  }, bannerEditor?.banner ? "Banner updated" : "Banner added");
  const removeProduct = (product: Product) => {
    setActionError(""); setConfirmation({ title: `Delete ${product.name}?`, description: "This product will be removed from your catalog. Existing order records stay available.", label: "Delete product", action: () => mutate(product.id!, async () => { const result = await deleteProduct(product.id!); setProducts(result.products || []); }, "Product deleted") });
  };
  const removeBanner = (banner: BannerItem) => {
    setActionError(""); setConfirmation({ title: `Delete ${banner.name}?`, description: "This slide will be removed from the home-page carousel.", label: "Delete banner", action: () => mutate(banner.id, async () => { await deleteBanner(banner.id); setBanners(current => current.filter(item => item.id !== banner.id)); }, "Banner deleted") });
  };
  const toggleBanner = (banner: BannerItem) => { void mutate(banner.id, async () => { await updateBanner(banner.id, { ...banner, isActive: !banner.isActive }); setBanners(current => current.map(item => item.id === banner.id ? { ...item, isActive: !item.isActive } : item)); }, banner.isActive ? "Banner hidden" : "Banner visible").catch(() => {}); };
  const moveBanner = (index: number, direction: -1 | 1) => {
    const next = [...banners]; [next[index], next[index + direction]] = [next[index + direction], next[index]];
    const ordered = next.map((item, position) => ({ ...item, order: position + 1 }));
    void mutate("reorder", async () => {
      try { await Promise.all(ordered.map(item => updateBanner(item.id, item))); setBanners(ordered); }
      catch (reason) { try { setBanners(sortBanners(await getAllBannersAdmin())); } catch { /* The refresh control remains available if the connection is down. */ } throw reason; }
    }, "Slide order saved").catch(() => {});
  };
  const awaiting = orders.filter(order => ["pending", "processing"].includes(orderStatus(order)));
  const inTransit = orders.filter(order => orderStatus(order) === "shipped");
  const paidTotal = orders.filter(order => isPaid(order) && orderStatus(order) !== "cancelled").reduce((sum, order) => sum + order.totalAmount, 0);

  return <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-400">Laddu Zabardast · Store operations</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin dashboard</h1><p className="mt-2 text-sm text-muted-foreground">Manage orders, products and your storefront.</p></div>
      <div className="flex gap-2"><Button variant="outline" className="h-11" disabled={loading || Boolean(busy)} onClick={() => void refresh()}><RefreshCw className={loading ? "animate-spin" : ""} />Refresh</Button><Button asChild variant="outline" className="h-11"><Link to="/"><ExternalLink />View store</Link></Button></div>
    </header>
    <Tabs value={section} onValueChange={navigate}>
      <TabsList className="mb-6 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border bg-card p-1">
        {sections.map(({ value, label, icon: Icon }) => <TabsTrigger key={value} value={value} className="min-h-11 shrink-0 gap-2 rounded-lg px-4 data-[state=active]:bg-orange-600/10 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400"><Icon className="h-4 w-4" />{label}</TabsTrigger>)}
      </TabsList>
      {actionError && !confirmation && !productEditor && !bannerEditor && <div className="mb-4"><ErrorState message={actionError} onRetry={() => { setActionError(""); void refresh(); }} /></div>}
      <TabsContent value="overview" className="space-y-6">
        {loading ? <LoadingState label="Loading your store…" /> : <>
          {Object.values(errors).length > 0 && <ErrorState message={Object.values(errors).join(" ")} onRetry={() => void refresh()} />}
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border bg-card lg:grid-cols-4">
            {[{ label: "To prepare", value: errors.orders ? "—" : awaiting.length, action: () => openOrders("prepare") }, { label: "On the way", value: errors.orders ? "—" : inTransit.length, action: () => openOrders("shipped") }, { label: "Paid sales", value: errors.orders ? "—" : formatMoney(paidTotal), action: () => openOrders() }, { label: "Products available", value: errors.products ? "—" : products.filter(item => item.available !== false).length, action: () => navigate("products") }].map(metric => <button key={metric.label} className="border-b border-r p-5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-6" onClick={metric.action}><span className="text-xs font-medium text-muted-foreground">{metric.label}</span><span className="mt-3 block text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{metric.value}</span><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-700 dark:text-orange-400">View details<ArrowRight className="h-3 w-3" /></span></button>)}
          </div>
          <section><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Latest orders</h2><p className="mt-1 text-sm text-muted-foreground">Start with the customers waiting for their delivery.</p></div><Button variant="ghost" className="h-11 shrink-0" onClick={() => openOrders()}>All orders<ArrowRight /></Button></div>
            {orders.length === 0 ? <EmptyState title="Ready for your first order" description="New customer orders will appear here." /> : <div className="divide-y overflow-hidden rounded-xl border bg-card">{orders.slice(0, 5).map(order => <button key={order.id} onClick={() => openOrders("all", order.id)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-muted/30"><div className="min-w-0"><p className="text-sm font-semibold">{order.shippingDetails?.name || "Customer"}</p><p className="mt-1 text-xs text-muted-foreground">#{order.id?.slice(-8).toUpperCase()} · {formatOrderDate(order.createdAt || order.date)}</p></div><div className="flex items-center gap-3"><span className="text-sm font-semibold tabular-nums">{formatMoney(order.totalAmount)}</span><StatusBadge status={orderStatus(order)} /></div></button>)}</div>}
          </section>
        </>}
      </TabsContent>
      <TabsContent value="history">
        {section === "history" && <Suspense fallback={<LoadingState label="Opening order history…" />}><InvoiceHistoryPanel /></Suspense>}
      </TabsContent>
      <TabsContent value="storefront"><StorefrontPanel /></TabsContent>
      {(["orders", "products", "banners"] as const).map(tab => <TabsContent key={tab} value={tab}>
        {loading ? <LoadingState label={`Loading ${tab}…`} /> : errors[tab] ? <ErrorState message={errors[tab]!} onRetry={() => void refresh()} /> : tab === "orders" ? <OrdersPanel orders={orders} busy={busy} query={query} filter={filter} onQuery={setQuery} onFilter={setFilter} onStatus={handleStatus} onPaid={order => { setActionError(""); setConfirmation({ title: "Confirm payment received", description: `Mark ${formatMoney(order.totalAmount)} as received for this order. Use this after collecting the customer's payment.`, label: "Mark as paid", action: () => mutate(order.id!, async () => { await updatePaymentStatus(order.id!, "paid"); setOrders(current => current.map(item => item.id === order.id ? { ...item, paymentStatus: "paid" } : item)); }, "Payment recorded") }); }} /> : tab === "products" ? <CatalogPanel products={products} busy={busy} onAdd={() => setProductEditor({ product: null })} onEdit={product => setProductEditor({ product })} onDelete={removeProduct} /> : <BannersPanel banners={banners} busy={busy} onAdd={() => setBannerEditor({ banner: null })} onEdit={banner => setBannerEditor({ banner })} onDelete={removeBanner} onToggle={toggleBanner} onMove={moveBanner} />}
      </TabsContent>)}
    </Tabs>
    {productEditor && <ProductEditor product={productEditor.product} onClose={() => setProductEditor(undefined)} onSave={saveProduct} />}
    {bannerEditor && <BannerEditor banner={bannerEditor.banner} nextOrder={Math.max(0, ...banners.map(item => item.order)) + 1} onClose={() => setBannerEditor(undefined)} onSave={saveBanner} />}
    <Dialog open={Boolean(confirmation)} onOpenChange={open => { if (!open && !busy) { setConfirmation(undefined); setActionError(""); } }}><DialogContent className="w-[calc(100%_-_2rem)] rounded-2xl"><DialogHeader><DialogTitle>{confirmation?.title}</DialogTitle><DialogDescription>{confirmation?.description}</DialogDescription></DialogHeader>{actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}<div className="flex justify-end gap-2"><Button variant="outline" className="h-11" disabled={Boolean(busy)} onClick={() => { setConfirmation(undefined); setActionError(""); }}>Go back</Button><Button className={adminAction} disabled={Boolean(busy)} onClick={() => { if (confirmation) void confirmation.action().then(() => setConfirmation(undefined)).catch(() => {}); }}>{busy ? "Saving…" : confirmation?.label}</Button></div></DialogContent></Dialog>
  </div>;
}
