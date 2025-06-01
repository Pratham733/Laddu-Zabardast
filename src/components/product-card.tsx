// src/components/product-card.tsx
"use client";

import Image from 'next/image';
import { useState, useMemo, useCallback } from 'react';
import type { Product } from '@/types/product';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, HeartIcon } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

function slugifyName(name: string) {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [imgLoaded, setImgLoaded] = useState(false);
  const router = useRouter();

  // Memoize wishlist check for performance
  const isProductInWishlist = useMemo(() =>
    wishlist.some(
      (item) => (item._id && product._id && item._id === product._id) || (item.id && product.id && item.id === product.id)
    ), [wishlist, product._id, product.id]
  );

  const handleAddToWishlist = useCallback(() => {
    isProductInWishlist ? removeFromWishlist(product) : addToWishlist(product);
  }, [isProductInWishlist, removeFromWishlist, addToWishlist, product]);

  const handleAddToCart = useCallback(() => {
    addToCart(product);
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const formattedPrice = Number.isFinite(price) ? price.toFixed(2) : '0.00';
    toast({
      title: `${product.name} added to cart`,
      description: `Price: ₹${formattedPrice}`,
    });
  }, [addToCart, product]);

  // Handler to prevent click bubbling from action buttons
  const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);
  const productSlug = product.name ? slugifyName(product.name) : (product.id || product._id);

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full cursor-default"
    >
      <Card className="overflow-hidden rounded-xl shadow-md transition-all hover:shadow-lg flex flex-col h-full border border-border hover:border-primary/30 cursor-default">
        <CardHeader className="p-0 relative bg-muted/30">
          <div className="w-full aspect-[4/3] min-h-[180px] max-h-[240px] flex items-center justify-center overflow-hidden bg-white rounded-t-xl relative">
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse z-10">
                <span className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 blur-sm" />
              </div>
            )}
            <Image
              src={product.imageUrl || "https://via.placeholder.com/600x400?text=No+Image"}
              alt={product.name}
              width={400}
              height={300}
              className={`object-cover w-full h-full transition-transform duration-300 hover:scale-105 ${imgLoaded ? '' : 'opacity-0'}`}
              data-ai-hint={product.aiHint}
              priority={true}
              onLoad={() => setImgLoaded(true)}
            />
          </div>
        </CardHeader>          <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-semibold mb-1">{product.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {product.description}
          </CardDescription>
          <p className="text-lg font-bold text-primary">₹{(typeof product.price === 'string' ? parseFloat(product.price) : product.price || 0).toFixed(2)}</p>
        </CardContent>

        <CardFooter className="p-4 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={e => { stopPropagation(e); handleAddToWishlist(); }}
            aria-label="Add to Wishlist"
            className="transition-colors duration-200"
          >
            {isProductInWishlist ? (
              <HeartIcon className="h-4 w-4 text-red-500 fill-red-500 transition-all duration-300" />
            ) : (
              <Heart className="h-4 w-4 text-muted-foreground transition-all duration-300" />
            )}
          </Button>

          {/* <InteractiveHoverButton className="w-[80%] bg-orange-600 text-white shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2" onClick={e => { stopPropagation(e); handleAddToCart(); }}>
            <ShoppingCart className="h-4 w-4" /> Add to Cart
          </InteractiveHoverButton> */}
          <InteractiveHoverButton
  className="w-[80%] bg-orange-600 text-white shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
  onClick={e => {
    stopPropagation(e);
    handleAddToCart();
  }}
>
  <div className="flex items-center gap-2">
    <ShoppingCart className="h-4 w-4" />
    <span>Add to Cart</span>
  </div>
</InteractiveHoverButton>

        </CardFooter>
      </Card>
    </motion.div>
  );
}
