"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion'; // Import motion

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";

const carouselItems = [
  {
    id: 1,
    title: "Authentic Indian Sweets",
    description: "Experience the taste of tradition with our handcrafted laddus, made with love and the finest ingredients.",
    imageUrl: "/images/ban1.jpg",
    imageAlt: "Colorful assortment of Indian sweets",
    aiHint: "indian sweets festival",
    buttonText: "Shop Laddus",
    buttonLink: "/shop",
  },
  {
    id: 2,
    title: "Tangy Homemade Pickles",
    description: "Spice up your meals with our traditional homemade pickles, bursting with authentic flavors.",
    imageUrl: "/images/ban2.jpg",
    imageAlt: "Jars of various Indian pickles",
    aiHint: "indian pickles jars",
    buttonText: "Explore Pickles",
    buttonLink: "/shop",
  },
   {
    id: 3,
    title: "LADDU ZABARDAST Delights",
    description: "Freshly made daily, bringing the authentic taste of India right to your doorstep.",
    imageUrl: "/images/ban3.jpg",
    imageAlt: "Indian sweet shop display",
    aiHint: "indian sweet shop",
    buttonText: "View Our Shop",
    buttonLink: "/shop",
  },
];

// Animation variants for the text content
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      delay: 0.2, // Add a small delay
    },
  },
};

export function HeroCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <section className="w-full py-6 md:py-10 overflow-hidden"> {/* Added overflow-hidden */}
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
          {carouselItems.map((item) => (
            <CarouselItem key={item.id}>
              <div className="p-1">
                <Card className="overflow-hidden border-none shadow-none rounded-none">
                  <CardContent className="relative flex aspect-[2/1] items-center justify-center p-0">
                     {/* Background Image with subtle parallax possibility (optional, requires more complex setup) */}
                     <motion.div
                       className="absolute inset-0 z-0"
                       initial={{ scale: 1.1, opacity: 0.8 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} // Smoother easing
                      >
                        <Image
                            src={item.imageUrl}
                            alt={item.imageAlt}
                            fill={true}
                            style={{objectFit: 'cover'}}
                            quality={85}
                            className="opacity-70 dark:opacity-30" // Increased light mode opacity
                            data-ai-hint={item.aiHint}
                            priority={item.id === 1} // Prioritize loading the first image
                        />
                     </motion.div>
                      {/* Animated Content Wrapper */}
                      <motion.div
                          className="container px-4 md:px-6 text-center relative z-10 text-foreground p-8 rounded-lg bg-background/80 dark:bg-background/70 max-w-3xl mx-auto" // Increased light mode opacity from /60 to /80
                          variants={contentVariants}
                          initial="hidden"
                          animate="show" // Trigger animation on load/mount
                          key={item.id} // Re-trigger animation on slide change
                      >
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 text-gradient drop-shadow-sm"> {/* Applied text-gradient */}
                          {item.title}
                        </h1>
                        <p className="text-md md:text-lg mb-6 max-w-xl mx-auto drop-shadow-sm">
                          {item.description}
                        </p>
                        {/* Add subtle hover effect to button */}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link href={item.buttonLink}>
                            <InteractiveHoverButton className="bg-orange-600 text-white shadow-md px-8 py-3 text-lg font-semibold rounded-full hover:opacity-90 transition-opacity">
                              {item.buttonText}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex" />
        </motion.div>
      </Carousel>
    </section>
  );
}
