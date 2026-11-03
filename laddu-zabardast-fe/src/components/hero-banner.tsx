import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,
  Skeleton,
} from "@mui/material";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getBanners } from "@/routes/banner";
import type { BannerItem } from "@/models/banner";

export function HeroCarousel() {
  const [banners, setBanners] = React.useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true }),
  );

  React.useEffect(() => {
    let isMounted = true;
    async function loadBanners() {
      try {
        setIsLoading(true);
        const data = await getBanners();
        if (isMounted) {
          setBanners(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load banners from backend:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <Box
        component="section"
        sx={{ width: "100%", py: { xs: 1.5, md: 2 }, overflow: "hidden" }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  flexShrink: 0,
                  width: { xs: "85%", sm: "48%", lg: "32.5%" },
                }}
              >
                <Skeleton
                  variant="rounded"
                  animation="wave"
                  sx={{
                    width: "100%",
                    aspectRatio: "16/7",
                    borderRadius: 2,
                    bgcolor: "action.hover",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Container>
      </Box>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <Box
      component="section"
      sx={{ width: "100%", py: { xs: 1.5, md: 2 }, overflow: "hidden" }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <Carousel
          plugins={[plugin.current]}
          className="w-full relative"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            loop: true,
            align: "start",
            slidesToScroll: 1,
          }}
        >
          <CarouselContent className="-ml-3">
            {banners.map((item, index) => (
              <CarouselItem
                key={item.id}
                className="pl-3 basis-[85%] sm:basis-[48%] lg:basis-[33.333%]"
              >
                <Link
                  to={item.buttonLink || "/shop"}
                  style={{ textDecoration: "none" }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 2.5,
                      border: 1,
                      borderColor: "divider",
                      aspectRatio: "16/7",
                      cursor: "pointer",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        "& .banner-bg-img": {
                          transform: "scale(1.05)",
                        },
                      },
                    }}
                  >
                    {/* Background image */}
                    <Box
                      component="img"
                      className="banner-bg-img"
                      src={item.imageURL}
                      alt={item.name}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        if (
                          item.altURL &&
                          e.currentTarget.src !== item.altURL
                        ) {
                          e.currentTarget.src = item.altURL;
                        }
                      }}
                      sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.5s ease",
                      }}
                      loading={index === 0 ? "eager" : "lazy"}
                    />

                    {/* Gradient overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)",
                      }}
                    />

                    {/* Text content pinned to bottom */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: { xs: 1.5, sm: 2, md: 2.5 },
                        zIndex: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          color: "common.white",
                          fontWeight: 700,
                          fontSize: {
                            xs: "0.95rem",
                            sm: "1.05rem",
                            md: "1.2rem",
                          },
                          lineHeight: 1.25,
                          mb: 0.25,
                          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.name}
                      </Typography>

                      {item.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255,255,255,0.85)",
                            fontSize: { xs: "0.75rem", sm: "0.825rem" },
                            lineHeight: 1.3,
                            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.description}
                        </Typography>
                      )}

                      {item.buttonText && (
                        <Chip
                          label={item.buttonText}
                          size="small"
                          sx={{
                            mt: 1,
                            bgcolor: "primary.main",
                            color: "common.white",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 22,
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                            "&:hover": {
                              bgcolor: "primary.dark",
                            },
                          }}
                        />
                      )}
                    </Box>
                  </Paper>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation arrows */}
          <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 bg-card/90 shadow-md border-border hover:bg-card" />
          <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 bg-card/90 shadow-md border-border hover:bg-card" />
        </Carousel>
      </Container>
    </Box>
  );
}
