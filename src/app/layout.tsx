import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from '@/context/cart-context';
import { ThemeProvider } from '@/context/theme-provider';
import { WishlistProvider } from '@/context/wishlist-context';
import { AuthProvider } from '@/context/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { BackgroundLaddu } from '@/components/animations/BackgroundLaddu';
import { useAuth } from '@/context/auth-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// export const metadata: Metadata = {
//   title: 'LADDU ZABARDAST', // Updated website name
//   description: 'Authentic Indian Sweets & Pickles',
// };

// Page transition variants - Smoother, less dramatic movement
const pageVariants = {
  initial: { opacity: 0, x: -5 }, // Start slightly to the left, less offset
  in: { opacity: 1, x: 0 },      // Fade in to center
  out: { opacity: 0, x: 5 },      // Fade out slightly to the right
};

const pageTransition = {
  type: "tween", // Use tween for smoother page fades
  ease: "anticipate", // Provides a slight anticipation before moving
  duration: 0.4, // Adjust duration as needed
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname(); // Get current path for AnimatePresence key
  const { user } = useAuth(); // <-- Add this line to get user from context

  return (
    // Removed whitespace inside the html tag
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Move meta tags to head if needed, or manage via Next.js head component */}
        <title>LADDU ZABARDAST</title>
        <meta name="description" content="Authentic Indian Sweets & Pickles" />
        {/* Global styles for background laddu opacity */}
        <style>{`
          /* Default (Light Mode) Opacity for Background Laddus */
          [data-ai-hint*="laddu"] {
            /* Increased opacity for better visibility */
            opacity: 0.8 !important; /* Adjust as needed (e.g., 0.7, 0.8) */
          }

          /* Dark Mode Opacity for Background Laddus */
          .dark [data-ai-hint*="laddu"] {
             /* Increased opacity for better visibility */
            opacity: 0.55 !important; /* Adjust as needed (e.g., 0.5, 0.6) */
          }
        `}</style>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen relative`}> {/* Added relative positioning */}
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange // Important for framer-motion page transitions
        >
           <AuthProvider> {/* Wrap with AuthProvider */}
              <WishlistProvider>
                  <CartProvider> {/* Wrap content with CartProvider */}
                      <BackgroundLaddu /> {/* Render the background laddus here, behind everything else */}
                      <div className="relative z-10 flex flex-col min-h-screen"> {/* Container to keep content above background */}
                          <Navbar />
                          {/* Use AnimatePresence for page transitions */}
                          <AnimatePresence mode="wait"> {/* wait ensures exit animation completes before enter */}
                              <motion.main
                                  key={pathname} // Unique key based on route
                                  className="flex-grow" // Main content area grows
                                  initial="initial"
                                  animate="in"
                                  exit="out"
                                  variants={pageVariants}
                                  transition={pageTransition}
                              >
                                  {children}
                              </motion.main>
                          </AnimatePresence>
                          <Footer />
                      </div>
                      <Toaster /> {/* Add Toaster here */}
                  </CartProvider>
              </WishlistProvider>
           </AuthProvider> {/* Close AuthProvider */}
        </ThemeProvider>
      </body>
    </html>
  );
}
