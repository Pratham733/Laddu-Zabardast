import { SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { Box } from "@/components/ui/layout";

interface NoResultsProps {
  query: string | null;
}

export function NoResults({ query }: NoResultsProps) {
  return (
    <Box className="max-w-xl mx-auto">
      <Box className="text-center py-12 mt-8 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-background/50 backdrop-blur-sm">
        <Box className="relative mb-6">
          <SearchX className="h-16 w-16 mx-auto text-muted-foreground" />
          <Box className="absolute inset-0 animate-pulse opacity-50 blur-xl">
            <SearchX className="h-16 w-16 mx-auto text-primary" />
          </Box>
        </Box>
        <h3 className="text-xl font-semibold mb-4 text-foreground">
          No Results Found
        </h3>
        <p className="text-muted-foreground mb-8 px-6">
          {query
            ? `We couldn't find any products matching "${query}". Try adjusting your filters or search terms.`
            : "Start by entering a search term to find products."}
        </p>
        <Link to="/shop" className="inline-block">
          <button className="min-h-11 px-6 py-3 rounded-lg bg-orange-600 text-white font-medium transition-colors hover:bg-orange-700">
            Browse All Products
          </button>
        </Link>
      </Box>
    </Box>
  );
}
