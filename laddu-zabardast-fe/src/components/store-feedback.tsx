import { Link } from "react-router-dom";
import { AlertCircle, Loader2, PackageSearch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button-new";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div role="status" className="flex min-h-40 items-center justify-center gap-3 py-10 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{label}</div>;
}
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-5">
    <p className="flex items-start gap-2 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />{message}</p>
    <Button variant="outline" className="h-11" onClick={onRetry}><RefreshCw />Try again</Button>
  </div>;
}
export function EmptyState({ title, description, href, action }: { title: string; description: string; href?: string; action?: string }) {
  return <div className="flex flex-col items-center rounded-xl border border-dashed px-5 py-12 text-center">
    <PackageSearch className="mb-4 h-8 w-8 text-orange-600" aria-hidden="true" />
    <h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    {href && action && <Button asChild className="mt-5 h-11 rounded-lg bg-orange-700 text-white hover:bg-orange-800"><Link to={href}>{action}</Link></Button>}
  </div>;
}
export function StatusBadge({ status }: { status: string }) {
  const tone = ["paid", "completed", "delivered", "available"].includes(status) ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : ["cancelled", "failed", "unavailable"].includes(status) ? "bg-red-500/10 text-red-700 dark:text-red-300"
    : status === "shipped" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-300";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tone}`}>{status}</span>;
}
