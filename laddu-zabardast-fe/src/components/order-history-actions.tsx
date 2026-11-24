import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button-new";
import { useCart } from "@/hooks";
import { errorMessage } from "@/lib/store-display";
import { saveInvoice } from "@/mobile/invoice";
import { cancelOrder, generateInvoice, type ReorderResult } from "@/routes/orders";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function OrderHistoryActions({ orderId, status, onCancelled }: { orderId: string; status: string; onCancelled: () => void }) {
  const { reorder, isInitialised } = useCart();
  const requestId = useRef<string>();
  const [busy, setBusy] = useState<"invoice" | "reorder" | "cancel">();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Pick<ReorderResult, "added" | "skipped">>();

  async function run(action: "invoice" | "reorder" | "cancel") {
    setBusy(action);
    setError("");
    try {
      if (action === "invoice") {
        await saveInvoice(await generateInvoice(orderId), orderId);
      } else if (action === "cancel") {
        await cancelOrder(orderId);
        setConfirm(false);
        onCancelled();
      } else {
        requestId.current ??= crypto.randomUUID();
        setSummary(undefined);
        const { added, skipped } = await reorder(orderId, requestId.current);
        setSummary({ added, skipped });
        requestId.current = undefined;
      }
    } catch (reason) {
      setError(errorMessage(reason, "Could not complete this action. Please try again."));
    } finally {
      setBusy(undefined);
    }
  }

  return <div className="space-y-3 border-t px-4 py-3">
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className="h-11 rounded-xl shadow-none" onClick={() => void run("invoice")} disabled={!!busy}>
        <Download aria-hidden />{busy === "invoice" ? "Preparing invoice…" : "Download invoice"}
      </Button>
      <Button type="button" variant="outline" className="h-11 rounded-xl shadow-none" onClick={() => void run("reorder")} disabled={!!busy || !isInitialised}>
        <RotateCcw aria-hidden />{busy === "reorder" ? "Checking availability…" : "Buy again"}
      </Button>
      {status.toLowerCase() === "pending" && <Button type="button" variant="outline" className="h-11 rounded-xl text-destructive shadow-none" onClick={() => { setError(""); setConfirm(true); }} disabled={!!busy}>Cancel order</Button>}
      <a href="#store-contact" className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground underline">Contact support</a>
    </div>
    {!confirm && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Dialog open={confirm} onOpenChange={open => { if (busy !== "cancel") setConfirm(open); }}>
      <DialogContent className="w-[calc(100%_-_2rem)] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>You can cancel while the order is pending. If you’ve already paid, contact support about the payment.</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" className="h-11" disabled={!!busy} onClick={() => setConfirm(false)}>Keep order</Button>
          <Button type="button" variant="destructive" className="h-11" disabled={!!busy} onClick={() => void run("cancel")}>{busy === "cancel" ? "Cancelling…" : "Confirm cancellation"}</Button>
        </div>
      </DialogContent>
    </Dialog>
    {summary && <div role="status" className="space-y-2 text-sm">
      <p>{summary.added > 0
        ? `Added ${summary.added} ${summary.added === 1 ? "item" : "items"} at current prices.`
        : "None of the items in this order are available."}</p>
      {summary.skipped.length > 0 && <p className="break-words text-muted-foreground">Unavailable and skipped: {summary.skipped.join(", ")}.</p>}
      {summary.added > 0 && <Link to="/cart" className="inline-flex min-h-11 items-center font-semibold text-orange-700 underline dark:text-orange-400">View cart</Link>}
    </div>}
  </div>;
}
