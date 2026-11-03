import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cookie,
  Droplets,
  ShoppingBag,
  Sparkles,
  Star,
  Gift,
} from "lucide-react";
import {
  Box,
  Container,
  Stack,
  Typography,
  ButtonBase,
  Avatar,
} from "@mui/material";

interface CategoryItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const categories: CategoryItem[] = [
  { label: "All Products", icon: <ShoppingBag size={22} />, href: "#all" },
  { label: "Laddus", icon: <Cookie size={22} />, href: "#laddu" },
  { label: "Pickles", icon: <Droplets size={22} />, href: "#pickle" },
  { label: "Best Sellers", icon: <Star size={22} />, href: "#bestsellers" },
  { label: "New Arrivals", icon: <Sparkles size={22} />, href: "#new" },
  { label: "Gift Boxes", icon: <Gift size={22} />, href: "#gifts" },
];

export function CategoryStrip() {
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Optional scroll spy: update active category indicator as user scrolls
  useEffect(() => {
    const handleScrollSpy = () => {
      const nav = document.querySelector("header");
      const navHeight = nav ? nav.offsetHeight : 64;
      const strip = document.getElementById("category-strip-container");
      const stripHeight = strip ? strip.offsetHeight : 66;
      const offset = navHeight + stripHeight + 80;

      for (let i = categories.length - 1; i >= 0; i--) {
        const cat = categories[i];
        if (cat.href.startsWith("#")) {
          const el = document.getElementById(cat.href.substring(1));
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= offset && rect.bottom > offset - 100) {
              setActiveCategory(cat.href);
              break;
            }
          }
        }
      }
    };

    window.addEventListener("scroll", handleScrollSpy, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollSpy);
  }, []);

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    href: string,
  ) => {
    setActiveCategory(href);

    // Center the clicked button horizontally in the category strip
    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    if (href.startsWith("#")) {
      const targetId = href.substring(1);
      const el = document.getElementById(targetId);
      if (el) {
        // Measure sticky headers (Navbar + CategoryStrip)
        const nav = document.querySelector("header");
        const navHeight = nav ? nav.offsetHeight : 64;
        const strip = document.getElementById("category-strip-container");
        const stripHeight = strip ? strip.offsetHeight : 66;
        const stickyHeaderHeight = navHeight + stripHeight;

        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const elementHeight = rect.height;
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - stickyHeaderHeight;

        let targetScrollY: number;
        if (elementHeight < availableHeight) {
          // Centrally place the section in the visible viewport
          const centerOffset = (availableHeight - elementHeight) / 2;
          targetScrollY = elementTop - stickyHeaderHeight - centerOffset;
        } else {
          // If taller than visible viewport, place near top with comfortable padding below fixed bar
          targetScrollY = elementTop - stickyHeaderHeight - 20;
        }

        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <Box
      id="category-strip-container"
      component="section"
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        position: "sticky",
        top: 64,
        zIndex: 30,
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            py: 1.5,
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
          }}
        >
          {categories.map((cat, i) => {
            const isActive = activeCategory === cat.href;
            return (
              <Box
                component={motion.div}
                key={cat.label}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                sx={{ flexShrink: 0 }}
              >
                <ButtonBase
                  onClick={(e) => handleClick(e, cat.href)}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.75,
                    minWidth: 84,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    color: isActive ? "primary.main" : "text.secondary",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      color: "primary.main",
                      bgcolor: "action.hover",
                      "& .MuiAvatar-root": {
                        bgcolor: "primary.main",
                        color: "common.white",
                        transform: "scale(1.08)",
                      },
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: isActive ? "primary.main" : "action.selected",
                      color: isActive ? "common.white" : "primary.main",
                      boxShadow: isActive
                        ? "0 4px 12px rgba(234, 102, 17, 0.35)"
                        : "none",
                      transform: isActive ? "scale(1.08)" : "scale(1)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {cat.icon}
                  </Avatar>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isActive ? 700 : 600,
                      whiteSpace: "nowrap",
                      fontSize: "0.75rem",
                      color: isActive ? "primary.main" : "inherit",
                    }}
                  >
                    {cat.label}
                  </Typography>
                </ButtonBase>
              </Box>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}
