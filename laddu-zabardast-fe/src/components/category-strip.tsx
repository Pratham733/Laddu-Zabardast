import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { HOME_SHORTCUTS, useStorefront, type ShortcutId } from "@/context/storefront-context";
import { motion } from "framer-motion";
import {
  Cookie,
  Droplets,
  ShoppingBag,
  Sparkles,
  Star,
  Gift,
  PackagePlus,
} from "lucide-react";
import {
  Box,
  Container,
  Stack,
  Typography,
  ButtonBase,
  Avatar,
} from "@mui/material";

const icons = { bestsellers: Star, new: Sparkles, all: ShoppingBag, laddu: Cookie, pickle: Droplets, gifts: Gift, "custom-box": PackagePlus };
export function CategoryStrip({ sectionIds }: { sectionIds: ShortcutId[] }) {
  const { hiddenShortcuts } = useStorefront();
  const categories = useMemo(() => HOME_SHORTCUTS.filter(cat => !hiddenShortcuts.includes(cat.id)).map(cat => ({
    ...cat, Icon: icons[cat.id], href: sectionIds.includes(cat.id) ? `#${cat.id}` : cat.href,
  })), [hiddenShortcuts, sectionIds]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const isClickScrollingRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScrollSpy = () => {
      if (isClickScrollingRef.current) return;

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
    return () => {
      window.removeEventListener("scroll", handleScrollSpy);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [categories]);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    setActiveCategory(href);
    isClickScrollingRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 1000);

    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    if (href.startsWith("#")) {
      const targetId = href.substring(1);
      const el = document.getElementById(targetId);
      if (el) {
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

  if (!categories.length) return null;
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
        borderRadius: 2,
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            py: { xs: 0.75, sm: 1.5 },
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
                  component={Link}
                  href={cat.href}
                  onClick={cat.href.startsWith("#") ? (e) => handleClick(e, cat.href) : undefined}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: { xs: 0.5, sm: 0.75 },
                    minWidth: { xs: 68, sm: 84 },
                    px: { xs: 1, sm: 1.5 },
                    py: { xs: 0.75, sm: 1 },
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
                      width: { xs: 36, sm: 44 },
                      height: { xs: 36, sm: 44 },
                      bgcolor: isActive ? "primary.main" : "action.selected",
                      color: isActive ? "common.white" : "primary.main",
                      boxShadow: isActive
                        ? "0 4px 12px rgba(234, 102, 17, 0.35)"
                        : "none",
                      transform: isActive ? "scale(1.08)" : "scale(1)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <cat.Icon size={22} />
                  </Avatar>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isActive ? 700 : 600,
                      whiteSpace: "nowrap",
                      fontSize: { xs: "0.6875rem", sm: "0.75rem" },
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
