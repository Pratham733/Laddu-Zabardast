import type { Product } from "@/models";
import { ProductCard } from "@/components/product-card";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button-new";

interface Props { id?: string; title: string; products: Product[]; viewAllLink?: string; bgColor?: string; icon?: LucideIcon }
export function ProductStrip({ id, title, products, viewAllLink = "/shop", icon: Icon }: Props) {
  const heading = useId();
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const check = useCallback(() => { const element = row.current;if (element) setEdges({ left: element.scrollLeft > 4, right: element.scrollLeft < element.scrollWidth - element.clientWidth - 4 }); }, []);
  useEffect(() => {
    const element = row.current;if (!element) return;check();
    const observer = new ResizeObserver(check);observer.observe(element);element.addEventListener("scroll", check, { passive: true });
    return () => { observer.disconnect();element.removeEventListener("scroll", check); };
  }, [check, products]);
  const scroll = (direction: -1 | 1) => row.current?.scrollBy({ left: row.current.clientWidth * 0.8 * direction, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  if (!products.length) return null;
  return <section id={id} aria-labelledby={heading} className="py-4 md:py-6">
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 id={heading} className="flex min-w-0 items-center gap-2 text-base font-bold tracking-tight sm:text-xl">{Icon && <Icon className="h-5 w-5 shrink-0 text-orange-700 dark:text-orange-400" aria-hidden="true" />}{title}</h2><Button asChild variant="ghost" className="h-11 shrink-0 px-2 text-xs font-semibold text-orange-700 dark:text-orange-400 sm:text-sm"><Link to={viewAllLink}>View all<ArrowRight /></Link></Button></div>
      <div ref={row} className="flex snap-x snap-proximity gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 md:gap-5" style={{ overscrollBehaviorX: "contain" }}>
        {products.map((product, index) => <div key={product.id || product.key || index} className="w-[calc((100%_-_12px)/2)] min-w-0 shrink-0 snap-start sm:w-60 md:w-[260px]"><ProductCard product={product} /></div>)}
      </div>
      {(edges.left || edges.right) && <div className="mt-2 hidden justify-end gap-2 sm:flex"><Button variant="outline" size="icon" className="h-11 w-11 rounded-full" aria-label={`Scroll ${title} left`} disabled={!edges.left} onClick={() => scroll(-1)}><ArrowLeft /></Button><Button variant="outline" size="icon" className="h-11 w-11 rounded-full" aria-label={`Scroll ${title} right`} disabled={!edges.right} onClick={() => scroll(1)}><ArrowRight /></Button></div>}
    </div>
  </section>;
}
