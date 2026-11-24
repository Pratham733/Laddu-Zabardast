import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Cookie, Droplets, Gift, LayoutGrid, PackagePlus } from "lucide-react";
import type { Product } from "@/models";
import { useStorefront } from "@/context/storefront-context";
import { getProducts } from "@/routes/products";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button-new";
import { EmptyState, ErrorState, LoadingState } from "@/components/store-feedback";

const categories = [{ value: "all", label: "All", icon: LayoutGrid }, { value: "laddu", label: "Laddus", icon: Cookie }, { value: "pickle", label: "Pickles", icon: Droplets }, { value: "gift", label: "Gift boxes", icon: Gift }];
const sorts = [{ value: "default", label: "Recommended" }, { value: "price-asc", label: "Price: Low to high" }, { value: "price-desc", label: "Price: High to low" }, { value: "name-asc", label: "Name: A–Z" }, { value: "name-desc", label: "Name: Z–A" }];

export default function ShopPage() {
  const { hiddenShortcuts } = useStorefront();
  const [params, setParams] = useSearchParams();
  const category = categories.some(item => item.value === params.get("category")) ? params.get("category")! : "all";
  const collection = params.get("collection");
  const collectionLabel = collection === "bestsellers" ? "Best sellers" : collection === "new" ? "New arrivals" : "";
  const sort = sorts.some(item => item.value === params.get("sort")) ? params.get("sort")! : "default";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true);setError("");
    getProducts().then(result => { if (active) setProducts(result.products || []); }).catch(() => { if (active) setError("The catalog could not be loaded. Please check your connection and try again."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value === "all" || value === "default") next.delete(key); else next.set(key, value);setParams(next); };
  const filtered = useMemo(() => {
    const items = Array.from(new Map(products.filter(item => (category === "all" || item.category === category) && (collection !== "bestsellers" || item.bestSeller) && (collection !== "new" || item.newArrival)).map(item => [item.id, item])).values());
    if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
    if (sort === "name-asc") items.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "name-desc") items.sort((a, b) => b.name.localeCompare(a.name));
    return items;
  }, [products, category, sort, collection]);
  return <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-400">The collection</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{collectionLabel || "Shop your favourites"}</h1><p className="mt-2 text-sm text-muted-foreground">Choose laddus, pickles or a box made your way.</p></div>{!hiddenShortcuts.includes("custom-box") && <Button asChild variant="outline" className="h-11 rounded-lg"><Link to="/build-a-box"><PackagePlus />Create a box</Link></Button>}</header>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div role="group" aria-label="Product categories" className="flex flex-wrap gap-1.5">{categories.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={category === value} onClick={() => update("category", value)} className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === value ? "border-orange-700 bg-orange-700 text-white" : "border-border bg-card hover:bg-muted"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
      <label className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Sort</span><select aria-label="Sort products" value={sort} onChange={e => update("sort", e.target.value)} className="h-11 max-w-44 rounded-lg border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{sorts.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    </div>
    {loading ? <LoadingState label="Loading products…" /> : error ? <ErrorState message={error} onRetry={() => setAttempt(value => value + 1)} /> : <>
      <p className="mb-4 text-xs text-muted-foreground" role="status">{filtered.length} {filtered.length === 1 ? "product" : "products"}{category !== "all" && ` · ${categories.find(item => item.value === category)?.label}`}</p>
      {filtered.length ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">{filtered.map(product => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title={products.length ? "Nothing in this category yet" : "The collection is being prepared"} description={products.length ? "Browse the rest of the collection to find a favourite." : "Please check back shortly for products."} href={products.length ? "/shop" : undefined} action="View all products" />}
    </>}
  </div>;
}
