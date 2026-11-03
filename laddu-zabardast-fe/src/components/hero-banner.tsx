"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { getBanners } from "@/routes/banner";
import type { BannerItem } from "@/models/banner";

// Animation variants for the text content
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      delay: 0.2,
    },
  },
};

export function HeroCarousel() {
  const [banners, setBanners] = React.useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
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
      <section className="w-full py-6 md:py-10 overflow-hidden">
        <div className="p-1">
          <Card className="overflow-hidden border-none shadow-none rounded-none">
            <CardContent className="relative flex aspect-[2/1] items-center justify-center p-0 bg-muted/30 animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-6 md:py-10 overflow-hidden">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {banners.map((item, index) => (
            <CarouselItem key={item.id}>
              <div className="p-1">
                <Card className="overflow-hidden border-none shadow-none rounded-none">
                  <CardContent className="relative flex aspect-[2/1] items-center justify-center p-0">
                    {/* Background Image with subtle parallax */}
                    <motion.div
                      className="absolute inset-0 z-0"
                      initial={{ scale: 1.1, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <img
                        src={item.imageURL}
                        alt={item.name}
                        onError={(e) => {
                          if (item.altURL && e.currentTarget.src !== item.altURL) {
                            e.currentTarget.src = item.altURL;
                          }
                        }}
                        className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-30"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </motion.div>
                    {/* Animated Content Wrapper */}
                    <motion.div
                      className="container px-4 md:px-6 text-center relative z-10 text-foreground p-8 rounded-lg bg-background/80 dark:bg-background/70 max-w-3xl mx-auto"
                      variants={contentVariants}
                      initial="hidden"
                      animate="show"
                      key={item.id}
                    >
                      <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 text-gradient drop-shadow-sm">
                        {item.name}
                      </h1>
                      {item.description && (
                        <p className="text-md md:text-lg mb-6 max-w-xl mx-auto drop-shadow-sm">
                          {item.description}
                        </p>
                      )}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link to={item.buttonLink || "/shop"}>
                          <InteractiveHoverButton className="bg-orange-600 text-white shadow-md px-8 py-3 text-lg font-semibold rounded-full hover:opacity-90 transition-opacity">
                            {item.buttonText || "Shop Now"}
                          </InteractiveHoverButton>
                        </Link>
                      </motion.div>
                    </motion.div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex" />
        </motion.div>
      </Carousel>
    </section>
  );
}
