import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Image from "next/image";
import { ArrowRight, ArrowLeft, Minus, Package, Plus, Trash2, Truck } from "lucide-react";
import { useCart, toast } from "@/hooks";
import { Button } from "@/components/ui/button-new";
import { Input } from "@/components/ui/input";
import { SweetenerSelect } from "@/components/sweetener-select";
import { BoxContents } from "@/components/box-contents";
import { CheckoutJourney } from "@/components/checkout-journey";
import { EmptyState, ErrorState, LoadingState } from "@/components/store-feedback";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/store-display";

function QuantityControl({ quantity, name, onChange }: { quantity: number; name: string; onChange: (quantity: number) => void }) {
  const [draft, setDraft] = useState(String(quantity));
  useEffect(() => setDraft(String(quantity)), [quantity]);
  const parsed = Number(draft);
  const valid = Number.isSafeInteger(parsed) && parsed > 0;
  const commit = () => { const next = valid ? parsed : quantity;setDraft(String(next));if (next !== quantity) onChange(next); };
  const adjust = (delta: number) => { const next = Math.max(1, (valid ? parsed : quantity) + delta);setDraft(String(next));onChange(next); };
  return <div className="flex items-center overflow-hidden rounded-lg border bg-background">
    <Button variant="ghost" className="h-11 w-11 shrink-0 rounded-none px-0" aria-label={`Decrease quantity of ${name}`} disabled={(valid ? parsed : quantity) <= 1} onClick={() => adjust(-1)}><Minus /></Button>
    <Input type="number" inputMode="numeric" min="1" step="1" aria-label={`Quantity for ${name}`} className="h-11 w-12 rounded-none border-x border-y-0 px-1 text-center shadow-none focus-visible:ring-inset" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
    <Button variant="ghost" className="h-11 w-11 shrink-0 rounded-none px-0" aria-label={`Increase quantity of ${name}`} onClick={() => adjust(1)}><Plus /></Button>
  </div>;
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, updateSweetener, getCartTotal, clearCart, isInitialised, loadError, saveError, retryLoad, syncCart } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const total = getCartTotal();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unavailable = cart.some(item => item.sweetenerUnavailable);
  const checkout = unavailable ? <Button disabled>Checkout</Button> : <Link to="/checkout" aria-label="Proceed to Checkout" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Checkout<ArrowRight className="h-4 w-4" /></Link>;
  return <div className="mx-auto max-w-6xl px-4 py-4 pb-28 sm:px-6 sm:py-6 lg:pb-6">
    <CheckoutJourney step={1} />
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your Shopping Cart</h1>{isInitialised && <p className="mt-2 text-sm text-muted-foreground">{count} {count === 1 ? "item" : "items"} selected</p>}</div><Button asChild variant="ghost" className="h-11"><Link to="/shop"><ArrowLeft />Continue shopping</Link></Button></header>
    {loadError ? <ErrorState message={loadError} onRetry={retryLoad} /> : !isInitialised ? <LoadingState label="Loading your cart…" /> : cart.length === 0 ? <EmptyState title="Your Cart is Empty" description="Pick a favourite from the collection or create a laddu box of your own." href="/shop" action="Start shopping" /> : <>
      {unavailable && <p role="alert" className="mb-4 rounded-lg border p-3 text-sm text-destructive">Choose an available sweetener or remove the affected product to continue.</p>}
      {saveError && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-500/5 p-4 text-sm"><p>{saveError}</p><Button variant="outline" className="h-11" disabled={retrying} onClick={() => { setRetrying(true);void syncCart().catch(() => {}).finally(() => setRetrying(false)); }}>{retrying ? "Saving…" : "Retry saving"}</Button></div>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Cart items" className="min-w-0">
          <div className="divide-y overflow-hidden rounded-xl border bg-card">{cart.map(item => <article key={item.id} className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              {item.box ? <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-orange-600/10"><Package className="h-8 w-8 text-orange-700 dark:text-orange-400" /></div> : <Link to={`/product/${encodeURIComponent(item.productId ?? item.id)}`}><Image src={item.imageUrl} alt={item.name} width={80} height={80} className="h-20 w-20 shrink-0 rounded-xl border object-cover" /></Link>}
              <div className="min-w-0 flex-1"><h2 className="break-words text-sm font-semibold sm:text-base">{item.name}</h2><BoxContents box={item.box} /><p className="mt-1 text-sm text-muted-foreground">{formatMoney(item.price)} each</p></div>
              <Button variant="ghost" className="h-11 w-11 shrink-0 px-0 text-muted-foreground hover:text-destructive" aria-label={`Remove ${item.name}`} onClick={() => { removeFromCart(item.id);toast({ title: `${item.name} removed from cart` }); }}><Trash2 /></Button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3"><QuantityControl name={item.name} quantity={item.quantity} onChange={value => updateQuantity(item.id, value)} /><p className="font-semibold tabular-nums">{formatMoney(item.price * item.quantity)}</p></div>
            {!item.box && <div className="mt-3"><SweetenerSelect product={item} value={item.sweetener}
              unavailable={item.sweetenerUnavailable} onChange={choice => updateSweetener(item.id, choice)} /></div>}
          </article>)}</div>
          <Button variant="ghost" className="mt-3 h-11 text-destructive" onClick={() => setConfirmClear(true)}><Trash2 />Clear cart</Button>
        </section>
        <aside className="rounded-xl border bg-card p-5 lg:sticky lg:top-20" aria-label="Order summary"><h2 className="mb-4 text-lg font-semibold">Order Summary</h2><dl className="space-y-3 text-sm"><div className="flex justify-between gap-2"><dt>Subtotal</dt><dd className="tabular-nums">{formatMoney(total)}</dd></div><div className="flex justify-between gap-2"><dt>Shipping</dt><dd>Free</dd></div><div className="flex justify-between gap-2 border-t pt-4 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(total)}</dd></div></dl><p className="my-4 flex items-center gap-2 text-xs text-muted-foreground"><Truck className="h-4 w-4" />Cash on delivery is available at checkout.</p><div className="hidden lg:block [&>a]:w-full">{checkout}</div></aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden"><div className="min-w-0"><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-bold tabular-nums">{formatMoney(total)}</p></div>{checkout}</div>
    </>}
    <Dialog open={confirmClear} onOpenChange={setConfirmClear}><DialogContent className="w-[calc(100%_-_2rem)] rounded-2xl"><DialogHeader><DialogTitle>Clear your cart?</DialogTitle><DialogDescription>All selected products and custom boxes will be removed from your cart.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" className="h-11" onClick={() => setConfirmClear(false)}>Keep shopping</Button><Button className="h-11 bg-orange-700 text-white hover:bg-orange-800" onClick={() => { clearCart();setConfirmClear(false); }}>Clear cart</Button></div></DialogContent></Dialog>
  </div>;
}
