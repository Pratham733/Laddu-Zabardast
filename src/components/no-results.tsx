'use client';

import Link from 'next/link';
import { SearchX } from 'lucide-react';

interface NoResultsProps {
  query: string | null;
}

export function NoResults({ query }: NoResultsProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center py-12 mt-8 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-background/50 backdrop-blur-sm">
        <div className="relative mb-6">
          <SearchX className="h-16 w-16 mx-auto text-muted-foreground" />
          <div className="absolute inset-0 animate-pulse opacity-50 blur-xl">
            <SearchX className="h-16 w-16 mx-auto text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">
          No Results Found
        </h3>
        <p className="text-muted-foreground mb-8 px-6">
          {query 
            ? `We couldn't find any products matching "${query}". Try adjusting your filters or search terms.`
            : 'Start by entering a search term to find products.'}
        </p>
        <Link href="/shop" className="inline-block">
          <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200">
            Browse All Products
          </button>
        </Link>
      </div>
    </div>
  );
}
