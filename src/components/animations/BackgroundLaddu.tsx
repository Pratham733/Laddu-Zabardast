//src/components/animations/BackgroundLaddu.tsx
"use client";

import Image from 'next/image';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils'; // Import cn utility

// --- Laddu Configuration ---
interface LadduConfig {
    id: number;
    imageUrl: string; // Use specific image URL
    initialX: string;
    initialY: string;
    size: number;
    xRange: [string, string, string]; // For useTransform [start, mid, end]
    yRange: [string, string];       // For useTransform [start, end]
    rotateRange: [number, number];    // For useTransform [start, end]
    scaleRange: [number, number, number]; // For useTransform [start, mid, end]
    aiHint: string; // Keep AI hint relevant
}

const secondImageUrl = '/images/bg.png'; // Use a specific image URL for the laddu

const ladduConfigs: LadduConfig[] = [
    {
        id: 1, imageUrl: secondImageUrl, initialX: '10vw', initialY: '15vh', size: 120,
        xRange: ['-5vw', '15vw', '-5vw'], yRange: ['5vh', '85vh'], rotateRange: [0, 180],
        scaleRange: [0.8, 1.1, 0.8], aiHint: 'besan laddu indian sweet'
    },
    {
        id: 2, imageUrl: secondImageUrl, initialX: '80vw', initialY: '25vh', size: 90,
        xRange: ['5vw', '-10vw', '5vw'], yRange: ['10vh', '75vh'], rotateRange: [-45, 225],
        scaleRange: [1.0, 0.7, 1.0], aiHint: 'besan laddu indian sweet'
    },
    {
        id: 3, imageUrl: secondImageUrl, initialX: '40vw', initialY: '5vh', size: 150,
        xRange: ['-15vw', '5vw', '-15vw'], yRange: ['0vh', '90vh'], rotateRange: [30, -150],
        scaleRange: [0.9, 1.2, 0.9], aiHint: 'laddu indian sweet illustration'
    },
     {
        id: 4, imageUrl: secondImageUrl, initialX: '70vw', initialY: '70vh', size: 110,
        xRange: ['10vw', '-5vw', '10vw'], yRange: ['60vh', '10vh'], rotateRange: [90, -90],
        scaleRange: [0.7, 1.0, 0.7], aiHint: 'laddu indian sweet illustration'
    },
    // Added more laddus for density
     {
        id: 5, imageUrl: secondImageUrl, initialX: '25vw', initialY: '80vh', size: 80,
        xRange: ['-8vw', '12vw', '-8vw'], yRange: ['70vh', '5vh'], rotateRange: [-90, 90],
        scaleRange: [0.8, 1.0, 0.8], aiHint: 'besan laddu indian sweet'
    },
    {
        id: 6, imageUrl: secondImageUrl, initialX: '90vw', initialY: '5vh', size: 100,
        xRange: ['-5vw', '8vw', '-5vw'], yRange: ['0vh', '60vh'], rotateRange: [10, -170],
        scaleRange: [0.9, 1.1, 0.9], aiHint: 'laddu indian sweet illustration'
    },
];

// --- Aura Light Configuration ---
interface AuraConfig {
    id: number;
    initialX: string;
    initialY: string;
    size: number; // Diameter of the aura
    color: string; // Base color (e.g., 'hsl(var(--primary))') - Increased opacity
    xRange: [string, string]; // Movement range [start, end]
    yRange: [string, string]; // Movement range [start, end]
    animationDuration: number;
    delay: number;
    blur: number; // Added explicit blur control
}

const auraConfigs: AuraConfig[] = [
    {
        id: 101, initialX: '20vw', initialY: '30vh', size: 350, // Increased size
        color: 'hsl(var(--primary) / 0.4)', // Increased opacity
        xRange: ['-10vw', '10vw'], yRange: ['-5vh', '5vh'],
        animationDuration: 7, delay: 0, blur: 40 // Slightly reduced duration, adjusted blur
    },
    {
        id: 102, initialX: '75vw', initialY: '60vh', size: 300, // Increased size
        color: 'hsl(var(--accent) / 0.3)', // Increased opacity
        xRange: ['5vw', '-15vw'], yRange: ['10vh', '-10vh'],
        animationDuration: 9, delay: 0.8, blur: 50 // Adjusted duration and blur
    },
    {
        id: 103, initialX: '50vw', initialY: '10vh', size: 450, // Increased size
        color: 'hsl(300 80% 60% / 0.25)', // Increased opacity
        xRange: ['-5vw', '5vw'], yRange: ['-10vh', '10vh'],
        animationDuration: 10, delay: 1.5, blur: 60 // Adjusted duration and blur
    },
    {
        id: 104, initialX: '15vw', initialY: '80vh', size: 250, // Increased size
        color: 'hsl(0 0% 100% / 0.2)', // Increased opacity
        xRange: ['10vw', '-5vw'], yRange: ['5vh', '-15vh'],
        animationDuration: 8, delay: 0.3, blur: 30 // Adjusted duration and blur
    },
    // Added more auras
    {
        id: 105, initialX: '85vw', initialY: '15vh', size: 300,
        color: 'hsl(var(--primary) / 0.35)',
        xRange: ['-8vw', '12vw'], yRange: ['-8vh', '8vh'],
        animationDuration: 9, delay: 0.5, blur: 45
    },
    {
        id: 106, initialX: '30vw', initialY: '75vh', size: 280,
        color: 'hsl(var(--accent) / 0.28)',
        xRange: ['12vw', '-8vw'], yRange: ['-12vh', '12vh'],
        animationDuration: 11, delay: 1.2, blur: 55
    },
];


// --- Animated Laddu Component ---
interface AnimatedLadduProps {
    config: LadduConfig;
    scrollYProgress: MotionValue<number>;
}

function AnimatedLaddu({ config, scrollYProgress }: AnimatedLadduProps) {
    const y = useTransform(scrollYProgress, [0, 1], config.yRange);
    const x = useTransform(scrollYProgress, [0, 0.5, 1], config.xRange);
    const rotate = useTransform(scrollYProgress, [0, 1], config.rotateRange);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], config.scaleRange);

    // Use 'object-cover' for consistent image handling since it's a square image now
    const objectFitClass = 'object-cover';

    return (
        <motion.div
            // Adjusted z-index to be above lines and auras but below content
            className="fixed top-0 left-0 -z-10 pointer-events-none"
            style={{
                y, x, rotate, scale,
                translateX: config.initialX,
                translateY: config.initialY,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'spring', stiffness: 50, damping: 20, delay: config.id * 0.1 }}
        >
            <Image
                src={config.imageUrl}
                alt={`Animated background laddu ${config.id}`}
                width={config.size}
                height={config.size}
                className={cn(
                   'rounded-full', // Keep it circular
                   objectFitClass,
                   // Opacity controlled globally via layout.tsx
                )}
                data-ai-hint={config.aiHint}
                unoptimized // Essential for external URLs not in next.config.js images domains
            />
        </motion.div>
    );
}

// --- Animated Aura Light Component ---
interface AuraLightProps {
    config: AuraConfig;
    scrollYProgress: MotionValue<number>;
}

function AuraLight({ config, scrollYProgress }: AuraLightProps) {
    // Subtle movement based on scroll
    const y = useTransform(scrollYProgress, [0, 1], config.yRange);
    const x = useTransform(scrollYProgress, [0, 1], config.xRange);

    return (
        <motion.div
            // Adjusted z-index to be above lines but below laddus
            className="fixed top-0 left-0 -z-20 pointer-events-none rounded-full"
            style={{
                width: config.size,
                height: config.size,
                translateX: config.initialX,
                translateY: config.initialY,
                // Apply scroll-based movement
                x,
                y,
                // Create the glowing effect
                backgroundImage: `radial-gradient(circle, ${config.color} 0%, transparent 65%)`, // Adjusted gradient stop for sharper edge
                filter: `blur(${config.blur}px)`, // Use configured blur
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: [0, 0.9, 0.7, 0], // More visible pulsing opacity
                scale: [0.8, 1.1, 1, 0.8], // Pulsing scale
            }}
            transition={{
                duration: config.animationDuration,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
                delay: config.delay,
            }}
        />
    );
}

// --- Main Background Component ---
export function BackgroundLaddu() {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        // Optional: Target specific element
    });

    return (
        <div ref={targetRef} className="absolute inset-0 w-full h-full overflow-hidden -z-50"> {/* Ensure it's behind content, potentially increase negative z-index */}

             {/* Subtle Background Gradient Layer */}
             <div className="absolute inset-0 -z-40 bg-gradient-to-br from-background via-secondary/20 to-background dark:via-secondary/10" />


            {/* Render Aura Lights */}
            {auraConfigs.map((config) => (
                <AuraLight key={config.id} config={config} scrollYProgress={scrollYProgress} />
            ))}
            {/* Render Laddus */}
            {ladduConfigs.map((config) => (
                <AnimatedLaddu key={config.id} config={config} scrollYProgress={scrollYProgress} />
            ))}
        </div>
    );
}
