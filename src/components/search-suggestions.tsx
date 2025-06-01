import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import type { Product } from '@/types/product';
import { Card } from '@/components/ui/card';

interface SearchSuggestionsProps {
  query: string | null;
  products: Product[];
  onSelect?: () => void;
}

export function SearchSuggestions({ query, products, onSelect }: SearchSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [touchStartY, setTouchStartY] = useState(0);

  const suggestions = useMemo(() => {
    if (!query) return [];

    const lowerCaseQuery = query.toLowerCase();
    return products
      .filter(product => 
        // Only include products that exist and have all required fields
        product && 
        product.name &&
        product.price &&
        product.category &&
        (product._id || product.id) &&
        // Then check if they match the search query
        (product.name.toLowerCase().includes(lowerCaseQuery) ||
         (product.description && product.description.toLowerCase().includes(lowerCaseQuery)) ||
         product.category.toLowerCase().includes(lowerCaseQuery))
      )
      .slice(0, 6); // Show slightly more suggestions on mobile
  }, [query, products]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (suggestions.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          if (selectedIndex >= 0) {
            event.preventDefault();
            const selectedProduct = suggestions[selectedIndex];
            const productIdOrSlug = selectedProduct._id || selectedProduct.id || encodeURIComponent(selectedProduct.name.toLowerCase().replace(/\s+/g, '-'));
            window.location.href = `/product/${productIdOrSlug}`;
            onSelect?.();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onSelect?.();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex, onSelect]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchEndY = e.touches[0].clientY;
    const deltaY = touchEndY - touchStartY;

    // If scrolling up/down significantly, prevent suggestion selection
    if (Math.abs(deltaY) > 10) {
      setSelectedIndex(-1);
    }
  };

  if (!query || suggestions.length === 0) return null;

  return (
    <Card className="absolute z-50 w-full mt-1 shadow-lg overflow-hidden border border-border max-h-[65vh] sm:max-h-[50vh] overflow-y-auto">
      <ul className="divide-y divide-border">
        {suggestions.map((product, index) => (
          <li 
            key={product.id}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <Link 
              href={`/product/${product._id || product.id || encodeURIComponent(product.name.toLowerCase().replace(/\s+/g, '-'))}`}
              className={`flex items-center justify-between p-4 sm:p-3 transition-colors ${
                index === selectedIndex ? 'bg-accent' : 'hover:bg-accent active:bg-accent/70'
              }`}
              onClick={onSelect}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-sm font-medium truncate mb-1">{product.name}</p>
                <p className="text-sm sm:text-xs text-muted-foreground">{product.category}</p>
              </div>
              <p className="text-base sm:text-sm font-medium text-primary ml-4 whitespace-nowrap">
                ₹{Number(product.price).toFixed(2)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
