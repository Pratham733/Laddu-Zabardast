"use client";

import { useMemo, useState, useEffect } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/types/product";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Apple, Cookie, LayoutGrid, Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<string>("default");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/add-product");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Remove duplicates by _id or id
  const uniqueProducts = useMemo(
    () => Array.from(new Map(products.map((p) => [(p._id || p.id), p])).values()),
    [products]
  );

  // Filtering by category
  const laddusOnly = useMemo(
    () => uniqueProducts.filter((p) => p.category === "laddu"),
    [uniqueProducts]
  );
  const picklesOnly = useMemo(
    () => uniqueProducts.filter((p) => p.category === "pickle"),
    [uniqueProducts]
  );

  // Sorting logic
  const sortProducts = (arr: Product[]) => {
    switch (sort) {
      case "price-asc":
        return [...arr].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...arr].sort((a, b) => b.price - a.price);
      case "name-asc":
        return [...arr].sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return [...arr].sort((a, b) => b.name.localeCompare(a.name));
      default:
        return arr;
    }
  };

  const renderProductGrid = (products: Product[]) => (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <span className="font-semibold text-lg">{products.length} Products</span>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {isMobile ? (
            <Button
              onClick={() => setFilterSheetOpen(true)}
              variant="outline"
              className="w-full justify-between md:w-auto"
            >
              <span>Sort & Filter</span>
              <SlidersHorizontal className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <label htmlFor="sort" className="text-sm font-medium">
                Sort by:
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm border rounded-md px-2 py-1.5 w-[140px] bg-background"
              >
                <option value="default">Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {sortProducts(products).map((product) => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </div>
  );

  // Mobile Filter Sheet
  const MobileFilterSheet = (
    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
      <SheetContent side="bottom" className="h-[90%] sm:h-[580px]">
        <SheetHeader>
          <SheetTitle>Sort & Filter</SheetTitle>
          <SheetDescription>
            Choose how you want to sort and filter the products
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="sort" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sort">Sort</TabsTrigger>
            <TabsTrigger value="filter">Filter</TabsTrigger>
          </TabsList>
          <TabsContent value="sort" className="mt-4">
            <div className="space-y-4">
              {Object.entries({
                "price-asc": "Price: Low to High",
                "price-desc": "Price: High to Low",
                "name-asc": "Name: A-Z",
                "name-desc": "Name: Z-A",
              }).map(([value, label]) => (
                <div
                  key={value}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                    sort === value
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setSort(value)}
                >
                  <span className="text-sm font-medium">{label}</span>
                  {sort === value && <Check className="h-4 w-4 text-primary" />}
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="filter" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Categories</h4>
                <div className="grid grid-cols-2 gap-2">
                  {["all", "laddu", "pickle"].map((category) => (
                    <div
                      key={category}
                      className={cn(
                        "flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors text-center capitalize",
                        "border-input hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="mt-6">
          <Button className="w-full" onClick={() => setFilterSheetOpen(false)}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  if (loading) return <p className="text-center py-10">Loading products...</p>;

  return (
    <div className="container py-8 relative min-h-[calc(100vh-4rem)]">
      <Tabs defaultValue="all" className="h-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:mx-auto mb-8">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <LayoutGrid className="size-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="laddu" className="flex items-center gap-2">
            <Cookie className="size-4" />
            Laddus
          </TabsTrigger>
          <TabsTrigger value="pickle" className="flex items-center gap-2">
            <Apple className="size-4" />
            Pickles
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="h-full">
          {renderProductGrid(uniqueProducts)}
        </TabsContent>
        <TabsContent value="laddu" className="h-full">
          {renderProductGrid(laddusOnly)}
        </TabsContent>
        <TabsContent value="pickle" className="h-full">
          {renderProductGrid(picklesOnly)}
        </TabsContent>
      </Tabs>
      {MobileFilterSheet}
    </div>
  );
}
