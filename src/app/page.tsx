"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeroCarousel } from '@/components/hero-banner';
import { ProductShowcase } from '@/components/product-showcase';
import type { Product } from '@/types/product';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";

export default function Home() {
  const { token, loading } = useAuth(); // ✅ loading added to avoid premature redirect
  const router = useRouter();

  const [laddus, setLaddus] = useState<Product[]>([]);
  const [pickles, setPickles] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // ✅ Redirect ONLY after auth check is done
  useEffect(() => {
    if (!loading && !token) {
      router.push("/login");
    }
  }, [loading, token, router]);

  // ✅ Fetch products only if token exists
  useEffect(() => {
    if (!token) return;

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/add-product');
        const data = await res.json();

        const products: Product[] = (data.products || []).map((item: any) => ({
          ...item,
          id: item._id || item.id,
        }));

        // Remove duplicates by _id or id
        const uniqueProducts = Array.from(
          new Map(products.map((p) => [(p._id || p.id), p])).values()
        );
        // For 'Laddus', show only products with category 'laddu' (not 'all')
        const laddusOnly = uniqueProducts.filter((p) => p.category === "laddu");
        // For 'Pickles', show only products with category 'pickle' (not 'all')
        const picklesOnly = uniqueProducts.filter((p) => p.category === "pickle");

        setAllProducts(uniqueProducts);
        setLaddus(laddusOnly);
        setPickles(picklesOnly);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProducts();
  }, [token]);

  // ✅ Don't render anything during auth check
  if (loading || (!token && !loading)) {
    return null;
  }

  return (
    <>
      <HeroCarousel />
      {!productLoading && (
        <>
          <ProductShowcase id="laddu" title="Our Delicious Laddus" products={laddus} />
          <ProductShowcase id="pickle" title="Tangy Homemade Pickles" products={pickles} />
        </>
      )}
    </>
  );
}
