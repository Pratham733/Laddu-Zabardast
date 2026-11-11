import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroCarousel } from "@/components/hero-banner";
import { ProductStrip } from "@/components/product-strip";
import { CategoryStrip } from "@/components/category-strip";
import { PromoBanner } from "@/components/promo-banner";
import { TrustBadges } from "@/components/trust-badges";
import type { Product } from "@/types";
import { useAuth } from "@/hooks";
import { getProducts } from "@/routes/products";
import { motion } from "framer-motion";
import { Box, Typography, CircularProgress } from "@mui/material";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [laddus, setLaddus] = useState<Product[]>([]);
  const [pickles, setPickles] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();

        const products: Product[] = (data.products || []).map((item: any) => ({
          ...item,
          id: item.id,
        }));

        const uniqueProducts = Array.from(
          new Map(products.map((p) => [p.id, p])).values(),
        );
        const laddusOnly = uniqueProducts.filter((p) => p.category === "laddu");
        const picklesOnly = uniqueProducts.filter(
          (p) => p.category === "pickle",
        );

        setAllProducts(uniqueProducts);
        setLaddus(laddusOnly);
        setPickles(picklesOnly);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  if (loading) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <HeroCarousel />
      <CategoryStrip />

      {productLoading ? (
        <Box
          component="section"
          sx={{
            py: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress color="primary" size={44} thickness={4} />
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontWeight: 500 }}
            >
              Loading delicious products...
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          {allProducts.length > 0 && (
            <Box
              id="bestsellers"
              sx={{ scrollMarginTop: { xs: "130px", md: "150px" } }}
            >
              <ProductStrip
                title="⭐ Best Sellers"
                products={allProducts.slice(0, 8)}
                viewAllLink="/shop"
              />
            </Box>
          )}

          {allProducts.length > 0 && (
            <Box
              id="new"
              sx={{ scrollMarginTop: { xs: "130px", md: "150px" } }}
            >
              <ProductStrip
                title="✨ New Arrivals"
                products={allProducts.slice(-6)}
                viewAllLink="/shop"
              />
            </Box>
          )}

          {/* <PromoBanner /> */}

          {allProducts.length > 0 && (
            <Box
              id="all"
              sx={{ scrollMarginTop: { xs: "130px", md: "150px" } }}
            >
              <ProductStrip
                title="🛍️ All Products"
                products={allProducts}
                viewAllLink="/shop"
              />
            </Box>
          )}

          {laddus.length > 0 && (
            <Box
              id="laddu"
              sx={{ scrollMarginTop: { xs: "130px", md: "150px" } }}
            >
              <ProductStrip
                title="🍯 Our Delicious Laddus"
                products={laddus}
                viewAllLink="/shop?category=laddu"
              />
            </Box>
          )}

          {pickles.length > 0 && (
            <Box
              id="pickle"
              sx={{ scrollMarginTop: { xs: "130px", md: "150px" } }}
            >
              <ProductStrip
                title="🌶️ Tangy Homemade Pickles"
                products={pickles}
                viewAllLink="/shop?category=pickle"
              />
            </Box>
          )}

          {allProducts.length > 0 && (
            <Box
              id="gifts"
              sx={{ scrollMarginTop: { xs: "130px", md: "150px" } }}
            >
              <ProductStrip
                title="🎁 Gift Boxes"
                products={allProducts.slice(0, 4)}
                viewAllLink="/shop"
              />
            </Box>
          )}
        </>
      )}

      <TrustBadges />
    </Box>
  );
}
