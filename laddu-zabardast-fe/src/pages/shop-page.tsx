"use client";

import { useMemo, useState, useEffect } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/models";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Apple,
  Cookie,
  LayoutGrid,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@mui/material";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks";
import { Container, Column, Row, Box } from "@/components/ui/layout";

import { getProducts } from "@/routes";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<string>("default");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const categoryParam =
          activeCategory === "all" ? undefined : activeCategory;
        const data = await getProducts(categoryParam);
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [activeCategory]);

  // Remove duplicates
  const uniqueProducts = useMemo(
    () => Array.from(new Map(products.map((p) => [p.id || p.id, p])).values()),
    [products],
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

  const renderProductGrid = (productsList: Product[]) => (
    <Column className="w-full gap-4">
      <Row className="flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <span className="font-semibold text-lg">
          {productsList.length} Products
        </span>
        <Row className="items-center gap-2 w-full md:w-auto">
          {isMobile ? (
            <Button
              onClick={() => setFilterSheetOpen(true)}
              variant="outlined"
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
        </Row>
      </Row>
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {sortProducts(productsList).map((product) => (
          <ProductCard key={product.id || product.id} product={product} />
        ))}
      </Box>
    </Column>
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
            <Column className="space-y-4">
              {Object.entries({
                "price-asc": "Price: Low to High",
                "price-desc": "Price: High to Low",
                "name-asc": "Name: A-Z",
                "name-desc": "Name: Z-A",
              }).map(([value, label]) => (
                <Row
                  key={value}
                  className={cn(
                    "items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                    sort === value
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setSort(value)}
                >
                  <span className="text-sm font-medium">{label}</span>
                  {sort === value && <Check className="h-4 w-4 text-primary" />}
                </Row>
              ))}
            </Column>
          </TabsContent>
          <TabsContent value="filter" className="mt-4">
            <Column className="space-y-4">
              <Column className="space-y-2">
                <h4 className="font-medium text-sm">Categories</h4>
                <Box className="grid grid-cols-3 gap-2">
                  {["all", "laddu", "pickle"].map((category) => (
                    <Row
                      key={category}
                      className={cn(
                        "items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors text-center capitalize",
                        activeCategory === category
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => {
                        setActiveCategory(category);
                        setFilterSheetOpen(false);
                      }}
                    >
                      {category}
                    </Row>
                  ))}
                </Box>
              </Column>
            </Column>
          </TabsContent>
        </Tabs>
        <Box className="mt-6">
          <Button className="w-full" onClick={() => setFilterSheetOpen(false)}>
            Close
          </Button>
        </Box>
      </SheetContent>
    </Sheet>
  );

  return (
    <Container className="py-8 relative min-h-[calc(100vh-4rem)]">
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="h-full space-y-6"
      >
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

        {loading ? (
          <p className="text-center py-10">Loading products...</p>
        ) : (
          <>
            <TabsContent value="all" className="h-full">
              {renderProductGrid(uniqueProducts)}
            </TabsContent>
            <TabsContent value="laddu" className="h-full">
              {renderProductGrid(uniqueProducts)}
            </TabsContent>
            <TabsContent value="pickle" className="h-full">
              {renderProductGrid(uniqueProducts)}
            </TabsContent>
          </>
        )}
      </Tabs>
      {MobileFilterSheet}
    </Container>
  );
}
