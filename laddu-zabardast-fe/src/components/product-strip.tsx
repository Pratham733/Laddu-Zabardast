import type { Product } from "@/types";
import { ProductCard } from "@/components/product-card";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Button,
  IconButton,
} from "@mui/material";

interface ProductStripProps {
  id?: string;
  title: string;
  products: Product[];
  viewAllLink?: string;
  bgColor?: string;
}

export function ProductStrip({
  id,
  title,
  products,
  viewAllLink = "/shop",
  bgColor,
}: ProductStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, products]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (products.length === 0) return null;

  return (
    <Box
      component="section"
      id={id}
      sx={{
        py: { xs: 2, md: 3 },
        bgcolor: bgColor || "transparent",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <Paper
          component={motion.div}
          elevation={0}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          sx={{
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              px: { xs: 2, md: 3 },
              py: 2,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              component={motion.h2}
              variant="h6"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.1rem", md: "1.35rem" },
                color: "text.primary",
              }}
            >
              {title}
            </Typography>

            <Button
              component={Link}
              to={viewAllLink}
              variant="contained"
              color="primary"
              endIcon={<ArrowRight size={16} />}
              sx={{
                borderRadius: 9999,
                textTransform: "none",
                fontWeight: 600,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 0.5, sm: 0.75 },
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(234, 102, 17, 0.25)",
                },
              }}
            >
              View All
            </Button>
          </Stack>

          {/* Scrollable Product Row Container */}
          <Box
            sx={{
              position: "relative",
              "&:hover .scroll-nav-btn": { opacity: 1 },
            }}
          >
            {/* Left arrow */}
            {canScrollLeft && (
              <IconButton
                className="scroll-nav-btn"
                onClick={() => scroll("left")}
                aria-label="scroll left"
                sx={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  bgcolor: "background.paper",
                  boxShadow: 3,
                  opacity: { xs: 1, md: 0 },
                  transition: "opacity 0.2s ease, transform 0.15s ease",
                  border: 1,
                  borderColor: "divider",
                  "&:hover": {
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) scale(1.1)",
                  },
                }}
              >
                <ChevronLeft size={20} />
              </IconButton>
            )}

            {/* Product scroll area */}
            <Box
              ref={scrollRef}
              sx={{
                display: "flex",
                gap: { xs: 2, md: 2.5 },
                overflowX: "auto",
                p: { xs: 2, md: 3 },
                scrollBehavior: "smooth",
                scrollSnapType: "x mandatory",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
                msOverflowStyle: "none",
              }}
            >
              {products.map((product, index) => (
                <Box
                  key={product.id || product.key || `${id}-${index}`}
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  sx={{
                    flexShrink: 0,
                    width: { xs: 220, sm: 240, md: 260 },
                    scrollSnapAlign: "start",
                  }}
                >
                  <ProductCard product={product} />
                </Box>
              ))}
            </Box>

            {/* Right arrow */}
            {canScrollRight && (
              <IconButton
                className="scroll-nav-btn"
                onClick={() => scroll("right")}
                aria-label="scroll right"
                sx={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  bgcolor: "background.paper",
                  boxShadow: 3,
                  opacity: { xs: 1, md: 0 },
                  transition: "opacity 0.2s ease, transform 0.15s ease",
                  border: 1,
                  borderColor: "divider",
                  "&:hover": {
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) scale(1.1)",
                  },
                }}
              >
                <ChevronRight size={20} />
              </IconButton>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
