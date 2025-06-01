"use client";

import type { Product } from '@/types/product';
import { ProductCard } from '@/components/product-card';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductShowcaseProps {
  id?: string;
  title: string;
  products: Product[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export function ProductShowcase({ id, title, products }: ProductShowcaseProps) {
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('name-asc');

  // Memoize category list
  const allCategories = useMemo(() => Array.from(new Set(products.map((p: Product) => p.category))), [products]);

  // Memoize filtered products
  const filteredProducts = useMemo(() =>
    products.filter((product: Product) =>
      !filteredCategory || product.category === filteredCategory
    ), [products, filteredCategory]
  );

  // Memoize sorted products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a: Product, b: Product) => {
      if (sortOption === "name-asc") return a.name.localeCompare(b.name);
      if (sortOption === "name-desc") return b.name.localeCompare(a.name);
      if (sortOption === "price-asc") return a.price - b.price;
      if (sortOption === "price-desc") return b.price - a.price;
      return 0;
    });
  }, [filteredProducts, sortOption]);

  const handleCategoryChange = (category: string | null) => {
    setFilteredCategory(category);
  };

  const handleSortChange = (sort: string) => {
    setSortOption(sort);
  };

  return (
    <section id={id} className="py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="container px-4 md:px-6">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gradient"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {title}
        </motion.h2>

        {/* Filter and Sort Controls */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            
            {allCategories.map((category) => (
              <Button
                key={category}
                variant={filteredCategory === category ? "gradient" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className="capitalize transition-all"
              >
                {category}
              </Button>
            ))}

          <Select onValueChange={handleSortChange} defaultValue={sortOption}>
  <SelectTrigger className="select-trigger w-full">
    <SelectValue placeholder="Sort by..." />
  </SelectTrigger>
  <SelectContent className="text-sm">
    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
    <SelectItem value="price-asc">Price (Low to High)</SelectItem>
    <SelectItem value="price-desc">Price (High to Low)</SelectItem>
  </SelectContent>
</Select>

          </div>
        </motion.div>

        {/* Product Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {sortedProducts.length > 0 ? sortedProducts.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          )) : (
            <p className="text-center text-muted-foreground col-span-full">
              No products found for this category.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
