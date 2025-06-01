//src/components/layout/navbar.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Package, Store, User, Menu, LogOut, Home as HomeIcon, History, Search, LogIn, UserPlus, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover"; // Import Popover components
import { sampleProducts } from '@/data/products'; // Import sample products for suggestions
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils'; // Import cn utility
import { CoolMode } from "@/components/animations/CoolMode";
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Meteors } from "@/components/magicui/meteors";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { AuroraText } from '../magicui/aurora-text';
// Animation for hover/tap on interactive elements
const interactiveVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } }, // Faster transition on hover
  tap: { scale: 0.95 },
};

export function Navbar() {
  const { cart } = useCart();
  const { user, token, setToken, isUserAdmin } = useAuth(); // Use auth context, include isUserAdmin
  const router = useRouter(); // Initialize router
  const pathname = usePathname(); // Get current pathname
  const [itemCount, setItemCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const popoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client
  }, []);

  useEffect(() => {
    if (isClient) {
      setItemCount(cart.reduce((count, item) => count + item.quantity, 0));
    }
  }, [cart, isClient]);

  // Use the logout function from AuthContext
  const handleLogout = async () => {
      setToken(null); // Clear JWT token and user state
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/'); // Redirect to home after logout
      console.log("User logged out.");
   };

   // Function to handle search submission (navigating to search page)
   const handleSearchSubmit = (query: string) => {
        console.log("Submitting search for:", query);
        setIsPopoverOpen(false); // Close popover on submit
        setSearchQuery(''); // Clear input after submit
        if (query.trim()) {
           router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
   }

   // Handle input change and update suggestions
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value;
        setSearchQuery(query);

        if (query.trim().length > 1) { // Start suggesting after 1 character
            const lowerCaseQuery = query.toLowerCase();
            const filteredSuggestions = sampleProducts.filter(
                product => product.name.toLowerCase().includes(lowerCaseQuery)
            ).slice(0, 5); // Limit to 5 suggestions
            setSuggestions(filteredSuggestions);
            setIsPopoverOpen(filteredSuggestions.length > 0);
        } else {
            setSuggestions([]);
            setIsPopoverOpen(false);
        }
    };

     // Handle clicking a suggestion
     const handleSuggestionClick = (productName: string) => {
        setSearchQuery(productName); // Fill input with suggestion
        setIsPopoverOpen(false);
        setSuggestions([]);
        // Optionally, navigate directly or just fill the input
        handleSearchSubmit(productName); // Submit search immediately on click
    };

     // Handle input focus
    const handleFocus = () => {
        if (popoverTimeoutRef.current) {
            clearTimeout(popoverTimeoutRef.current); // Clear timeout if re-focusing quickly
        }
        if (searchQuery.trim().length > 1 && suggestions.length > 0) {
            setIsPopoverOpen(true);
        }
    };

    // Handle input blur with a delay to allow clicking on suggestions
    const handleBlur = () => {
        // Use a timeout to delay closing the popover
        popoverTimeoutRef.current = setTimeout(() => {
             setIsPopoverOpen(false);
        }, 150); // Adjust delay as needed (e.g., 100-200ms)
    };

     // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (popoverTimeoutRef.current) {
                clearTimeout(popoverTimeoutRef.current);
            }
        };
    }, []);


    // Function to handle navigation to protected routes
    const handleProtectedRoute = (path: string) => {
        // Check authentication status using the token from context
        if (!token) { // Check token instead of user object
            toast({ title: "Login Required", description: "Please log in to access this page.", variant: "destructive" });
            router.push(`/login?redirect=${encodeURIComponent(path)}`); // Redirect to login, passing current path
        } else {
            router.push(path);
        }
    };


    return (
      <>
        <motion.header // Animate the header itself slightly on load
            initial={{ y: -30, opacity: 0 }} // Start slightly higher
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }} // Slightly faster
            // Apply gradient background from footer
            className="sticky top-0 z-50 w-full border-b bg-orange-600 text-primary-foreground" // Changed background, added text-primary-foreground
        >
            <div className="container flex h-16 items-center px-4 md:px-6 justify-between"> 
               
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-4">
                      <motion.div variants={interactiveVariants} whileHover="hover" whileTap="tap">
                        <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-4">
                          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
                            <Image
                              src="/images/logo.png"
                              alt="Laddu Zabardast Logo"
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          </div>
                          <AuroraText className="text-2xl sm:text-3xl font-semibold px-2 py-1 leading-tight text-white/90">LADDU ZABARDAST</AuroraText>
                          <span className="text-lg font-semibold tracking-tight text-white sm:hidden">LZ</span>
                        </Link>
                      </motion.div>

                      {/* Navigation Links */}
                      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                        <motion.div variants={interactiveVariants} whileHover="hover" whileTap="tap">
                          <Link
                            href="/"
                            className="group relative px-2 py-1 transition-all duration-300 text-primary-foreground/90 hover:text-primary-foreground flex items-center gap-2"
                          >
                            <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full"></span>
                            <HomeIcon className="h-4 w-4 group-hover:rotate-12 transition-transform" /> 
                            <span className="relative">
                              Home
                              <span className="absolute -inset-x-2 -inset-y-1 scale-75 bg-white/10 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 rounded-lg -z-10"></span>
                            </span>
                          </Link>
                        </motion.div>
                        <motion.div variants={interactiveVariants} whileHover="hover" whileTap="tap">
                          <Link
                            href="/shop"
                            className="group relative px-2 py-1 transition-all duration-300 text-primary-foreground/90 hover:text-primary-foreground flex items-center gap-2"
                          >
                            <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full"></span>
                            <Store className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                            <span className="relative">
                              Shop
                              <span className="absolute -inset-x-2 -inset-y-1 scale-75 bg-white/10 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 rounded-lg -z-10"></span>
                            </span>
                          </Link>
                        </motion.div>
                      </nav>
                    </div>
                </div>

                {/* Right Side: Search + Icons */}
                <div className="flex items-center gap-2">
                    {/* Laddu Button moved here */}
                    <div className="relative z-[9999]">
                      <CoolMode options={{ particle: 'circle', particleCount: 32, size: 32 }}>
                      <ShimmerButton
  className="group relative px-4 py-2 text-sm font-black rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all duration-300 hover:scale-105 border border-black bg-orange-600 hover:bg-orange-500 shadow-lg"
  shimmerColor="rgba(255,255,255,0.6)"
  shimmerDuration="2.5s"
  shimmerSize="0.08em"
>      <div className="relative">
        <span className="block leading-tight text-center font-extrabold text-white drop-shadow-sm transform group-hover:scale-105 transition-all duration-300 ease-out">
          ✨ Free Laddus ✨
        </span>
    <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping delay-300"></div>
  </div>
  <Meteors number={5} className="opacity-30" />
</ShimmerButton>


                      </CoolMode>
                    </div>
                     {/* Search Bar with Autocomplete Popover */}
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="max-w-xs md:max-w-sm lg:max-w-md hidden sm:block overflow-visible" // Use overflow-visible for Popover
                    >
                       <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                         <PopoverAnchor asChild>
                           <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSearchSubmit(searchQuery);
                              }}
                              className="relative"
                            >
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <PopoverTrigger asChild>
                                  <Input
                                    type="search"
                                    name="search"
                                    placeholder="Search products..."
                                    className="pl-8 w-full h-9 bg-white/10 dark:bg-black/10 
                                    backdrop-blur-sm placeholder:text-primary-foreground/70 
                                    text-primary-foreground border-white/30 hover:border-white/50 
                                    focus:border-white focus-visible:ring-white/50 
                                    transition-all duration-300 rounded-full
                                    shadow-[0_0_10px_-3px_rgba(255,255,255,0.1)]
                                    hover:shadow-[0_0_15px_-3px_rgba(255,255,255,0.2)]
                                    focus:shadow-[0_0_20px_-3px_rgba(255,255,255,0.3)]"
                                    value={searchQuery}
                                    onChange={handleInputChange}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    aria-autocomplete="list"
                                    aria-controls="search-suggestions"
                                  />
                                </PopoverTrigger>
                           </form>
                          </PopoverAnchor>
                          {/* Keep popover content standard colors */}
                          <PopoverContent
                                id="search-suggestions"
                                className="w-[--radix-popover-trigger-width] p-0 mt-1 bg-popover text-popover-foreground"
                                // Prevent focus loss from input when clicking suggestion
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                             {suggestions.length > 0 && (
                                <div className="flex flex-col max-h-60 overflow-y-auto">
                                    {suggestions.map((product) => (
                                    <Button
                                        key={product.id}
                                        variant="ghost" // Use standard ghost variant for popover
                                        className="justify-start px-3 py-2 h-auto text-sm rounded-none border-b last:border-b-0 text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => handleSuggestionClick(product.name)}
                                        // Prevent blur when clicking suggestion
                                        onMouseDown={(e) => e.preventDefault()}
                                    >
                                        {product.name}
                                    </Button>
                                    ))}
                                </div>
                                )}
                         </PopoverContent>
                       </Popover>
                    </motion.div>


                    {/* Icons Group */}
                    <motion.div // Stagger icon appearance
                         initial="hidden"
                         animate="show"
                         variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
                         }}
                        className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
                    >
                     <motion.div variants={interactiveVariants} whileHover="hover" whileTap="tap">
                         {/* Update ThemeToggle button style */}
                        <ThemeToggle />
                      </motion.div>
                      {/* Cart Button with enhanced effects */}
                      <motion.div variants={interactiveVariants} whileHover="hover" whileTap="tap">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="relative group text-primary-foreground hover:bg-white/10 hover:text-primary-foreground" 
                            onClick={() => router.push('/cart')}
                          >
                                <div className="absolute inset-0 rounded-full bg-white/5 scale-0 group-hover:scale-100 transition-transform duration-200" />
                                <ShoppingCart className="h-5 w-5 transform group-hover:scale-110 transition-transform duration-200" />
                                
                                {isClient && itemCount > 0 && (
                                    <motion.div
                                        initial={{ scale: 0, y: 10 }}
                                        animate={{ scale: 1, y: 0 }}
                                        exit={{ scale: 0, y: 10 }}
                                        transition={{ 
                                          type: "spring", 
                                          stiffness: 500, 
                                          damping: 30,
                                          bounce: 0.5 
                                        }}
                                    >
                                        <Badge 
                                          variant="destructive" 
                                          className="absolute -top-2 -right-2 h-5 min-w-[1.25rem] 
                                          justify-center rounded-full p-1 text-xs font-bold
                                          animate-pulse shadow-lg shadow-red-500/20
                                          border border-white/20"
                                        >
                                          {itemCount > 99 ? '99+' : itemCount}
                                        </Badge>
                                    </motion.div>
                                )}
                                
                                {/* Ripple effect on hover */}
                                <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:animate-ping" />
                                <span className="sr-only">View Cart</span>
                          </Button>
                      </motion.div>
                      {/* Sidebar Sheet */}
                        <motion.div variants={interactiveVariants} whileHover="hover" whileTap="tap">
                          <Sheet>
                            <SheetTrigger asChild>
                               {/* Menu Button - Use ghost variant and white text */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="relative group text-primary-foreground hover:bg-white/10 hover:text-primary-foreground overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                                <Menu className="h-5 w-5 transform group-hover:rotate-180 transition-transform duration-500" />
                                <div className="absolute inset-0 rounded-full border border-white/20 scale-0 group-hover:scale-100 transition-transform duration-200" />
                                <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:animate-ping" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </SheetTrigger>
                            {/* Keep SheetContent standard colors */}
                            <SheetContent side="right" className="w-full sm:w-[300px] bg-background text-foreground">
                              <SheetHeader className="mb-4">
                                <SheetTitle className="text-lg font-semibold text-primary">
                                   {token ? 'My Account' : 'Menu'}
                                </SheetTitle>
                              </SheetHeader>

                              {/* Mobile Search */}
                              <div className="px-2 pb-6 sm:hidden">
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                  const mobileQuery = formData.get('mobile-search') as string;
                                  // Find the SheetClose button and click it
                                  const sheetCloseButton = (e.target as HTMLElement)
                                    .closest('div[role="dialog"]')
                                    ?.querySelector('button[aria-label="Close"]');
                                  if (sheetCloseButton instanceof HTMLElement) {
                                    sheetCloseButton.click();
                                  }
                                  handleSearchSubmit(mobileQuery);
                                }}
                                className="relative"
                                >
                                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    type="search"
                                    name="mobile-search"
                                    placeholder="Search..."
                                    className="pl-10 w-full h-12 text-base" // Increased height and font size for touch
                                  />
                                </form>
                              </div>

                              <nav className="flex flex-col gap-1">
                                {/* Auth-dependent navigation with larger touch targets */}
                                {token ? (
                                  <>
                                    <SheetClose asChild>
                                      <Link href="/profile" className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base">
                                        <User className="mr-3 h-5 w-5" />
                                        Profile
                                      </Link>
                                    </SheetClose>
                                    
                                    <SheetClose asChild>
                                      <Link href="/orders" className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base">
                                        <History className="mr-3 h-5 w-5" />
                                        Orders
                                      </Link>
                                    </SheetClose>

                                    <SheetClose asChild>
                                      <Link href="/wishlist" className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base">
                                        <Heart className="mr-3 h-5 w-5" />
                                        Wishlist
                                      </Link>
                                    </SheetClose>
                                  </>
                                ) : (
                                  <>
                                    <SheetClose asChild>
                                      <Link 
                                        href={`/login?redirect=${encodeURIComponent(pathname ?? '/')}`} 
                                        className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base"
                                      >
                                        <LogIn className="mr-3 h-5 w-5" />
                                        Login
                                      </Link>
                                    </SheetClose>

                                    <SheetClose asChild>
                                      <Link 
                                        href={`/signup?redirect=${encodeURIComponent(pathname ?? '/')}`}
                                        className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base"
                                      >
                                        <UserPlus className="mr-3 h-5 w-5" />
                                        Sign Up
                                      </Link>
                                    </SheetClose>
                                  </>
                                )}

                                {/* Admin link with larger touch target */}
                                {token && isUserAdmin() && (
                                  <>
                                      <Separator className="my-3" />
                                        <SheetClose asChild>
  <Link href="/admin" className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base">
    <ShieldCheck className="mr-3 h-5 w-5" />
    Admin Dashboard
  </Link>
</SheetClose>
                                  </>
                                )}

                                {/* Logout with larger touch target */}
                                {token && (
                                  <>
                                      <Separator className="my-3" />                                     
                                        <SheetClose asChild>
  <button
    type="button"
    onClick={handleLogout}
    className="flex items-center px-4 py-3 rounded-md w-full text-left text-base text-destructive hover:bg-destructive/10"
  >
    <LogOut className="mr-3 h-5 w-5" />
    Logout
  </button>
</SheetClose>
                                        
                                    </>
                                )}
                              </nav>
                            </SheetContent>
                          </Sheet>
                         </motion.div>
                    </motion.div>
                </div>
            </div>
        </motion.header>
        <ScrollProgress className="top-16 h-1" />
      </>
    );
}

/* Add this to your global CSS if not present already: */
/*
@keyframes meteor {
  0% { opacity: 0; transform: translateY(0) scaleX(1); }
  10% { opacity: 1; }
  100% { opacity: 0; transform: translateY(600px) scaleX(0.7); }
}
.animate-meteor {
  animation: meteor linear forwards;
}
*/
