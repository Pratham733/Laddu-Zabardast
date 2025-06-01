'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchX, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NoResults } from '@/components/no-results';
import { ProductCard } from '@/components/product-card';

import type { Product } from '@/types/product';

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
  const [priceRange, setPriceRange] = useState({ min: minPrice, max: maxPrice });

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? (type === 'min' ? 0 : Infinity) : Number(value);
    const newRange = { ...priceRange, [type]: numValue };
    setPriceRange(newRange);
    
    // Add debounced price change to prevent too many updates
    const timeoutId = setTimeout(() => {
      onPriceRangeChange(newRange.min, newRange.max);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
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
  };  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 p-4 sm:p-6 mb-8 filter-group">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">
          Refine Results
        </h2>
        <p className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary hover-lift">
          {resultCount} items found
        </p>
      </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div 
          className="space-y-2 group"
          style={{
            transition: 'transform 0.2s ease-out'
          }}
        >
          <label className="text-sm font-medium flex items-center gap-2">
            <span className="group-hover:text-primary transition-colors">Category</span>
          </label>
          <select
            className="w-full rounded-lg p-3 bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all hover:bg-background/70"
            onChange={(e) => onCategoryChange(e.target.value || null)}
            onKeyDown={handleKeyDown}
            defaultValue=""
            style={{
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          >
            <option value="">All Categories</option>
            <option value="laddu">Laddu</option>
            <option value="pickle">Pickle</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sort By</label>            <select
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
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Min Price</label>          <div className="relative">
            <input
              type="number"
              className="w-full rounded-lg p-3 pl-7 bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              value={priceRange.min === 0 ? '' : priceRange.min}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              placeholder="Min Price"
              min="0"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Max Price</label>          <div className="relative">
            <input
              type="number"
              className="w-full rounded-lg p-3 pl-7 bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              value={priceRange.max === Infinity ? '' : priceRange.max}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              placeholder="Max Price"
              min="0"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || null;
  const [products, setProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('relevance');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: Infinity });  // Fetch all products from shop
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/add-product');
        const data = await res.json();
        if (data.products) {
          // Filter out any invalid products
          const validProducts = data.products.filter((p: Product) => 
            p && p.name && p.price && p.category && (p._id || p.id)
          );
          setProducts(validProducts);
          performSearch(validProducts, query);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []); // Only fetch products once

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams?.get('category');
    const sort = searchParams?.get('sort');
    const minPrice = searchParams?.get('minPrice');
    const maxPrice = searchParams?.get('maxPrice');    if (category) setFilteredCategory(category || null);
    if (sort) setSortOption(sort || 'relevance');
    if (minPrice) setPriceRange(prev => ({ ...prev, min: Number(minPrice) }));
    if (maxPrice) setPriceRange(prev => ({ ...prev, max: Number(maxPrice) }));
  }, [searchParams]);
  // Perform search function with proper typing
  const performSearch = (productList: Product[], searchQuery: string | null) => {
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
        (product._id || product.id) && // Must have an ID
        (product.name.toLowerCase().includes(lowerCaseQuery) ||
         (product.description && product.description.toLowerCase().includes(lowerCaseQuery)) ||
         product.category.toLowerCase().includes(lowerCaseQuery)) &&
        (Number(product.price) >= priceRange.min && Number(product.price) <= priceRange.max) &&
        (product.available !== false) // Show product unless explicitly marked as unavailable
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
    updateUrlParams({ minPrice: min.toString(), maxPrice: max === Infinity ? undefined : max.toString() });
  };

  // Update URL params function
  const updateUrlParams = (params: { [key: string]: string | undefined | null }) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.pushState({}, '', url);
  };

  const filteredProducts = results.filter(product =>
    !filteredCategory || product.category === filteredCategory
  );
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Add a small delay to make the animation more noticeable
    requestAnimationFrame(() => {
      const container = document.querySelector('.product-grid');
      if (container) {
        container.classList.add('sorting');
        setTimeout(() => container.classList.remove('sorting'), 300);
      }
    });

    switch (sortOption) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'relevance':
      default:
        // For relevance, keep the original search order
        return 0;
    }
  });

  // Calculate price range for all products
  const allPrices = products.map(product => product.price);
  const minAvailablePrice = Math.min(...allPrices, Infinity);
  const maxAvailablePrice = Math.max(...allPrices, 0);
  // Calculate price range for all products

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-2xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">
          Search Results {query ? <span className="font-normal">for</span> : ''}
        </h1>
        {query && (
          <p className="text-2xl md:text-3xl font-light text-muted-foreground animate-fade-in">
            "{query}"
          </p>
        )}
      </div>      <FilterAndSort
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
        onPriceRangeChange={handlePriceRangeChange}
        resultCount={sortedProducts.length}
        minPrice={minAvailablePrice}
        maxPrice={maxAvailablePrice}
      />      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-16 space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 h-12 w-12 animate-ping opacity-20 rounded-full bg-primary" />
          </div>
          <p className="text-lg font-medium bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text animate-pulse">
            Finding the perfect products for you...
          </p>
        </div>
      ) : sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      ) : (
        <NoResults query={query} />
      )}
    </div>
  );
}
