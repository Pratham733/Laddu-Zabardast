

// src/app/wishlist/page.tsx
"use client";
import React from "react";
import { useWishlist } from "@/context/wishlist-context";
import { ProductCard } from "@/components/product-card";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HeartOff } from "lucide-react"; // Icon for empty wishlist

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const WishlistPage: React.FC = () => {
  const { wishlist, isInitialised } = useWishlist();

  // Defensive: filter out undefined/null products
  const validWishlist = Array.isArray(wishlist)
    ? wishlist.filter((p) => p && (p._id || p.id))
    : [];

  if (!isInitialised) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex items-center justify-center min-h-[40vh]">
        <span className="text-lg text-muted-foreground animate-pulse">Loading your wishlist...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gradient"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        My Wishlist
      </motion.h1>

      {validWishlist.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center py-12 mt-8 shadow-sm border-dashed border-muted-foreground/50">
            <CardHeader>
              <HeartOff className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="text-2xl font-semibold">Your Wishlist is Empty</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added any favorites yet. Explore our products and save what you love!
              </p>
              <Link href="/shop">
                <Button variant="gradient">
                  Discover Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <span className="font-semibold text-lg">{validWishlist.length} Saved Product{validWishlist.length > 1 ? 's' : ''}</span>
            <Link href="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {validWishlist.map((product, idx) => (
              <motion.div
                key={product._id || product.id || idx}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                whileHover={{ scale: 1.03, boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
                className="transition-all"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
