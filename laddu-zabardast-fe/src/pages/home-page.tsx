import { useEffect, useState } from "react";
import { Cookie, Droplets, Gift, ShoppingBag, Sparkles, Star } from "lucide-react";
import { Box } from "@mui/material";
import { ErrorState, EmptyState, LoadingState } from "@/components/store-feedback";
import { HeroCarousel } from "@/components/hero-banner";
import { ProductStrip } from "@/components/product-strip";
import { CategoryStrip } from "@/components/category-strip";
import { TrustBadges } from "@/components/trust-badges";
import { HOME_SHORTCUTS, useStorefront } from "@/context/storefront-context";
import type { Product } from "@/models";
import { getProducts } from "@/routes/products";

const collections = [
  { id: "bestsellers", title: "Best sellers", icon: Star, includes: (p: Product) => p.bestSeller },
  { id: "new", title: "New arrivals", icon: Sparkles, includes: (p: Product) => p.newArrival },
  { id: "all", title: "All products", icon: ShoppingBag, includes: () => true },
  { id: "laddu", title: "Our laddus", icon: Cookie, includes: (p: Product) => p.category === "laddu" },
  { id: "pickle", title: "Homemade pickles", icon: Droplets, includes: (p: Product) => p.category === "pickle" },
  { id: "gifts", title: "Gift boxes", icon: Gift, includes: (p: Product) => p.category === "gift" },
] as const;

export default function Home() {
  const { hiddenShortcuts, status } = useStorefront();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getProducts().then(({ products }) => {
      if (!active) return;
      setProducts(Array.from(new Map(products.filter(p => p.available !== false).map(p => [p.id, p])).values()));
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const sections = collections.filter(section => !hiddenShortcuts.includes(section.id))
    .map(section => ({ ...section, products: products.filter(section.includes) }))
    .filter(section => section.products.length);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <HeroCarousel />
      {!loading && status !== "loading" && <CategoryStrip sectionIds={sections.map(section => section.id)} />}
      {loading || status === "loading" ? <LoadingState label="Loading products…" />
        : error ? <div className="p-4"><ErrorState message="The collection could not be loaded." onRetry={() => setAttempt(value => value + 1)} /></div>
        : products.length === 0 ? <div className="p-4"><EmptyState title="The collection is being prepared" description="Please check back shortly for your favourites." /></div>
        : sections.map(section => (
          <Box key={section.id} id={section.id} sx={{ scrollMarginTop: { xs: "145px", md: "174px" } }}>
            <ProductStrip title={section.title} icon={section.icon} products={section.products} viewAllLink={HOME_SHORTCUTS.find(shortcut => shortcut.id === section.id)?.href ?? "/shop"} />
          </Box>
        ))}
      <TrustBadges />
    </Box>
  );
}
