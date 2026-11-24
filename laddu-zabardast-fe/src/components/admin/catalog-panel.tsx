import { useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Product } from "@/models";
import { Button } from "@/components/ui/button-new";
import { Input } from "@/components/ui/input";
import { EmptyState, StatusBadge } from "@/components/store-feedback";
import { formatMoney } from "@/lib/store-display";
import { adminAction, adminSelect } from "./product-editor";

export function CatalogPanel({ products, busy, onAdd, onEdit, onDelete }: { products: Product[]; busy: string; onAdd: () => void; onEdit: (product: Product) => void; onDelete: (product: Product) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const filtered = products.filter(product => (category === "all" || product.category === category) && (availability === "all" || (availability === "available") === (product.available !== false)) && `${product.name} ${product.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section aria-label="Manage products" className="space-y-4">
    <div className="flex flex-wrap gap-3">
      <div className="relative min-w-0 flex-1 basis-52"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search products in catalog" type="search" placeholder="Search your catalog" className="h-11 pl-9" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <Button className={adminAction} onClick={onAdd} disabled={Boolean(busy)}><Plus />Add product</Button>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:max-w-md"><select aria-label="Filter product category" className={adminSelect} value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option><option value="laddu">Laddus</option><option value="pickle">Pickles</option><option value="gift">Gift boxes</option></select><select aria-label="Filter availability" className={adminSelect} value={availability} onChange={e => setAvailability(e.target.value)}><option value="all">All availability</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></div>
    <p className="text-xs text-muted-foreground">{filtered.length} of {products.length} products</p>
    {filtered.length === 0 ? <EmptyState title={products.length ? "No matching products" : "Your catalog starts here"} description={products.length ? "Try a different search or filter." : "Add a product with an image, price and description to start selling."} /> : <div className="overflow-hidden rounded-xl border bg-card">
      {filtered.map(product => <article key={product.id} className="flex flex-wrap items-center gap-3 border-b p-4 last:border-b-0">
        <Image src={product.imageUrl || "/images/logo.png"} alt={product.name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-lg border object-cover" />
        <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{product.name}</h3><p className="mt-1 text-xs text-muted-foreground">{product.category === "laddu" ? "Laddus" : "Pickles"}{product.weight && ` · ${product.weight}`}</p><p className="mt-1 text-sm font-semibold text-orange-700 dark:text-orange-400">{formatMoney(product.price)}</p></div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t pt-3 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0"><StatusBadge status={product.available === false ? "unavailable" : "available"} /><div className="flex gap-1"><Button variant="outline" className="h-11" disabled={Boolean(busy)} onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`}><Pencil />Edit</Button><Button variant="ghost" className="h-11 w-11 text-destructive" disabled={Boolean(busy)} onClick={() => onDelete(product)} aria-label={`Delete ${product.name}`}><Trash2 /></Button></div></div>
      </article>)}
    </div>}
  </section>;
}
