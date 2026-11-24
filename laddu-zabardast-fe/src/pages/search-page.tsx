import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX, Loader2, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@mui/material";
import { NoResults } from "@/components/no-results";
import { ProductCard } from "@/components/product-card";
import { Container, Column, Row, Box } from "@/components/ui/layout";

import type { Product } from "@/models";
import { getProducts } from "@/routes/products";

interface FilterAndSortProps {
  onCategoryChange: (category: string | null) => void;
  onSortChange: (sort: string) => void;
  onPriceRangeChange: (min: number, max: number) => void;
  resultCount: number;
  minPrice: number;
  maxPrice: number;
}

const FilterAndSort: React.FC<FilterAndSortProps> = ({
  onCategoryChange,
  onSortChange,
  onPriceRangeChange,
  resultCount,
  minPrice,
  maxPrice,
}) => {
  const [priceRange, setPriceRange] = useState({
    min: minPrice,
    max: maxPrice,
  });

  const handlePriceChange = (type: "min" | "max", value: string) => {
    const numValue =
      value === "" ? (type === "min" ? 0 : Infinity) : Number(value);
    const newRange = { ...priceRange, [type]: numValue };
    setPriceRange(newRange);

    // Add debounced price change to prevent too many updates
    const timeoutId = setTimeout(() => {
      onPriceRangeChange(newRange.min, newRange.max);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      const inputs = document.querySelectorAll('input[type="number"], select');
      const currentIndex = Array.from(inputs).indexOf(e.target as HTMLElement);

      if (e.shiftKey && currentIndex > 0) {
        e.preventDefault();
        (inputs[currentIndex - 1] as HTMLElement).focus();
      } else if (!e.shiftKey && currentIndex < inputs.length - 1) {
        e.preventDefault();
        (inputs[currentIndex + 1] as HTMLElement).focus();
      }
    }
  };
  return (
    <details className="group rounded-xl border border-border bg-card p-4 sm:p-5 mb-6 filter-group">
      <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-semibold text-foreground">
          Refine Results
        </h2>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {resultCount} items<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <Box className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Column
          className="space-y-2 group"
          style={{
            transition: "transform 0.2s ease-out",
          }}
        >
          <label htmlFor="search-category" className="text-sm font-medium flex items-center gap-2">
            <span className="group-hover:text-primary transition-colors">
              Category
            </span>
          </label>
          <select
            id="search-category"
            className="w-full rounded-lg p-3 bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all hover:bg-background/70"
            onChange={(e) => onCategoryChange(e.target.value || null)}
            onKeyDown={handleKeyDown}
            defaultValue=""
            style={{
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
            }}
          >
            <option value="">All Categories</option>
            <option value="laddu">Laddu</option>
            <option value="pickle">Pickle</option>
          </select>
        </Column>

        <Column className="space-y-2">
          <label htmlFor="search-sort" className="text-sm font-medium">Sort By</label>{" "}
          <select
            id="search-sort"
            className="w-full rounded-lg p-3 bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            onChange={(e) => onSortChange(e.target.value)}
            defaultValue="name-asc"
          >
            <option value="relevance">✨ Most Relevant</option>
            <option value="name-asc">↓ Name (A-Z)</option>
            <option value="name-desc">↑ Name (Z-A)</option>
            <option value="price-asc">↓ Price (Low to High)</option>
            <option value="price-desc">↑ Price (High to Low)</option>
          </select>
        </Column>

        <Column className="space-y-2">
          <label htmlFor="search-min-price" className="text-sm font-medium">Min Price</label>{" "}
          <Box className="relative">
            <input
              id="search-min-price"
              type="number"
              className="w-full rounded-lg p-3 pl-7 bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              value={priceRange.min === 0 ? "" : priceRange.min}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              placeholder="Min Price"
              min="0"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₹
            </span>
          </Box>
        </Column>

        <Column className="space-y-2">
          <label htmlFor="search-max-price" className="text-sm font-medium">Max Price</label>{" "}
          <Box className="relative">
            <input
              id="search-max-price"
              type="number"
              className="w-full rounded-lg p-3 pl-7 bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              value={priceRange.max === Infinity ? "" : priceRange.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              placeholder="Max Price"
              min="0"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₹
            </span>
          </Box>
        </Column>
      </Box>
    </details>
  );
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || null;
  const [products, setProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState("relevance");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: Infinity,
  }); // Fetch all products from shop
  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getProducts();
        if (data.products) {
          // Filter out any invalid products
          const validProducts = data.products.filter(
            (p: Product) => p && p.name && p.price && p.category && p.id,
          );
          setProducts(validProducts);
          performSearch(validProducts, query);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []); // Only fetch products once

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams?.get("category");
    const sort = searchParams?.get("sort");
    const minPrice = searchParams?.get("minPrice");
    const maxPrice = searchParams?.get("maxPrice");
    if (category) setFilteredCategory(category || null);
    if (sort) setSortOption(sort || "relevance");
    if (minPrice) setPriceRange((prev) => ({ ...prev, min: Number(minPrice) }));
    if (maxPrice) setPriceRange((prev) => ({ ...prev, max: Number(maxPrice) }));
  }, [searchParams]);
  // Perform search function with proper typing
  const performSearch = (
    productList: Product[],
    searchQuery: string | null,
  ) => {
    if (!searchQuery) {
      setResults([]);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const searchResults = productList.filter(
      (product) =>
        product && // Ensure product exists
        product.name && // Ensure required fields exist
        product.price &&
        product.category &&
        product.id && // Must have an ID
        (product.name.toLowerCase().includes(lowerCaseQuery) ||
          (product.description &&
            product.description.toLowerCase().includes(lowerCaseQuery)) ||
          product.category.toLowerCase().includes(lowerCaseQuery)) &&
        Number(product.price) >= priceRange.min &&
        Number(product.price) <= priceRange.max &&
        product.available !== false, // Show product unless explicitly marked as unavailable
    );
    setResults(searchResults);
  };

  // Handle search when query or price range changes
  useEffect(() => {
    performSearch(products, query);
  }, [query, priceRange, products]);

  const handleCategoryChange = (category: string | null) => {
    setFilteredCategory(category);
    updateUrlParams({ category: category || null });
  };

  const handleSortChange = (sort: string) => {
    setSortOption(sort);
    updateUrlParams({ sort });
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    updateUrlParams({
      minPrice: min.toString(),
      maxPrice: max === Infinity ? undefined : max.toString(),
    });
  };

  // Update URL params function
  const updateUrlParams = (params: {
    [key: string]: string | undefined | null;
  }) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.pushState({}, "", url);
  };

  const filteredProducts = results.filter(
    (product) => !filteredCategory || product.category === filteredCategory,
  );
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Add a small delay to make the animation more noticeable
    requestAnimationFrame(() => {
      const container = document.querySelector(".product-grid");
      if (container) {
        container.classList.add("sorting");
        setTimeout(() => container.classList.remove("sorting"), 300);
      }
    });

    switch (sortOption) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "relevance":
      default:
        // For relevance, keep the original search order
        return 0;
    }
  });

  // Calculate price range for all products
  const allPrices = products.map((product) => product.price);
  const minAvailablePrice = Math.min(...allPrices, Infinity);
  const maxAvailablePrice = Math.max(...allPrices, 0);

  return (
    <Container className="px-4 py-8 md:px-6 md:py-12">
      <Box className="max-w-2xl mx-auto mb-6 md:mb-12 text-center">
        <h1 className="text-2xl md:text-4xl font-bold mb-3 text-foreground">
          Search Results {query ? <span className="font-normal">for</span> : ""}
        </h1>
        {query && (
          <p className="text-lg md:text-2xl font-light text-muted-foreground break-words">
            "{query}"
          </p>
        )}
      </Box>{" "}
      <FilterAndSort
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
        onPriceRangeChange={handlePriceRangeChange}
        resultCount={sortedProducts.length}
        minPrice={minAvailablePrice}
        maxPrice={maxAvailablePrice}
      />{" "}
      {isLoading ? (
        <Column className="justify-center items-center py-16 space-y-4">
          <Box className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Box className="absolute inset-0 h-12 w-12 animate-ping opacity-20 rounded-full bg-primary" />
          </Box>
          <p className="text-base font-medium text-primary animate-pulse">
            Finding the perfect products for you...
          </p>
        </Column>
      ) : sortedProducts.length > 0 ? (
        <Box className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Box>
      ) : (
        <NoResults query={query} />
      )}
    </Container>
  );
}
