// src/components/product-card.tsx

import Image from "next/image";
import { useState, useMemo, useCallback } from "react";
import type { Product } from "@/models";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button-new";
import { ShoppingCart, Heart } from "lucide-react";
import { useCart, useWishlist, toast } from "@/hooks";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isInitialised: cartReady } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist, isInitialised: wishlistReady } = useWishlist();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const canPurchase = Boolean(product.id) && product.available !== false;

  // Memoize wishlist check for performance
  const isProductInWishlist = useMemo(
    () =>
      wishlist.some((item) =>
        Boolean(item.id && product.id && item.id === product.id),
      ),
    [wishlist, product.id],
  );

  const handleAddToWishlist = useCallback(() => {
    isProductInWishlist ? removeFromWishlist(product) : addToWishlist(product);
  }, [isProductInWishlist, removeFromWishlist, addToWishlist, product]);

  const handleAddToCart = useCallback(() => {
    if (!canPurchase) return;
    addToCart(product);
    const price =
      typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price;
    const formattedPrice = Number.isFinite(price) ? price.toFixed(2) : "0.00";
    toast({
      title: `${product.name} added to cart`,
      description: `Price: ₹${formattedPrice}`,
    });
  }, [addToCart, canPurchase, product]);

  const productImage = (
    <Image
      src={imageError ? "/images/logo.png" : product.imageUrl}
      alt={product.name}
      width={400}
      height={300}
      className={`object-cover w-full h-full ${imgLoaded ? "" : "opacity-0"}`}
      data-ai-hint={product.aiHint}
      onLoad={() => setImgLoaded(true)}
      onError={() => { setImageError(true); setImgLoaded(true); }}
    />
  );

  return (
    <article className="h-full min-w-0" data-product-card>
      <Card className="overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md flex flex-col h-full border border-border">
        <CardHeader className="relative space-y-0 bg-muted/30 p-0">
          <div className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden bg-white relative">
            {!imgLoaded && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted animate-pulse z-10">
                <span className="h-6 w-6 rounded-full bg-primary/15" />
              </div>
            )}
            {product.id ? (
              <Link
                to={`/product/${encodeURIComponent(product.id)}`}
                aria-label={`View details for ${product.name}`}
                className="block h-full w-full"
              >
                {productImage}
              </Link>
            ) : (
              productImage
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddToWishlist}
            disabled={!product.id || !wishlistReady}
            aria-label={`${isProductInWishlist ? "Remove from" : "Add to"} Wishlist: ${product.name}`}
            aria-pressed={isProductInWishlist}
            className="group absolute right-1 top-1 z-20 h-11 w-11 rounded-full border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card/95 shadow-sm ring-1 ring-border/60 transition-colors group-hover:bg-card">
              <Heart className={isProductInWishlist ? "fill-red-500 text-red-500" : "text-foreground"} />
            </span>
          </Button>
          {!canPurchase && <span className="absolute bottom-2 left-2 rounded-md bg-card px-2 py-1 text-xs font-medium">Unavailable</span>}
        </CardHeader>
        <CardContent className="min-w-0 flex-grow p-3 pb-2 pt-2.5 sm:p-4 sm:pb-3">
          <CardTitle className="mb-1 min-h-6 text-sm font-semibold leading-5 line-clamp-2 break-words sm:min-h-7 sm:text-base sm:leading-6">
            {product.id ? (
              <Link to={`/product/${encodeURIComponent(product.id)}`}>{product.name}</Link>
            ) : product.name}
          </CardTitle>
          {product.description && (
            <CardDescription className="hidden text-sm text-muted-foreground mb-2 sm:line-clamp-2">
              {product.description}
            </CardDescription>
          )}
          {product.weight && <p className="mb-1 text-xs text-muted-foreground">{product.weight}</p>}
          <p className="text-base font-bold tracking-tight text-orange-700 tabular-nums dark:text-orange-400 sm:text-lg">
            ₹
            {(typeof product.price === "string"
              ? parseFloat(product.price)
              : product.price || 0
            ).toFixed(2)}
          </p>
        </CardContent>
        <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
          <Button
            type="button"
            disabled={!canPurchase || !cartReady}
            aria-label={`Add to cart: ${product.name}`}
            className="h-11 w-full rounded-lg bg-orange-600 px-2 text-sm font-semibold text-white shadow-none hover:bg-orange-700"
            onClick={handleAddToCart}
          >
            {canPurchase && <ShoppingCart className="h-4 w-4" />}
            <span>{canPurchase ? "Add" : "Unavailable"}</span>
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
}
