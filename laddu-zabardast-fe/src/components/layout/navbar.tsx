//src/components/layout/navbar.tsx

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Package,
  Store,
  User,
  Menu,
  LogOut,
  Home as HomeIcon,
  History,
  Search,
  LogIn,
  UserPlus,
  ShieldCheck,
  Heart,
  X,
  Sparkles,
} from "lucide-react";
import { Button, Box, Typography, CircularProgress } from "@mui/material";
import { Input } from "@/components/ui/input";
import { useCart, useAuth, toast } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { searchProducts } from "@/queries";
import type { Product } from "@/types";
import { cn } from "@/lib/utils"; // Import cn utility
import { CoolMode } from "@/components/animations/CoolMode";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Meteors } from "@/components/magicui/meteors";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { AuroraText } from "../magicui/aurora-text";

const POPULAR_SEARCHES = [
  "Motichoor Laddu",
  "Besan Laddu",
  "Mango Pickle",
  "Gongura Pickle",
  "Festive Gift Box",
];

const QUICK_CATEGORIES = [
  { label: "Laddus", href: "/shop?category=laddu" },
  { label: "Pickles", href: "/shop?category=pickle" },
  { label: "Best Sellers", href: "/#bestsellers" },
  { label: "Gift Boxes", href: "/#gifts" },
];

// Animation for hover/tap on interactive elements
const interactiveVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } }, // Faster transition on hover
  tap: { scale: 0.95 },
};

export function Navbar() {
  const { cart } = useCart();
  const { user, token, setToken, logout, isUserAdmin } = useAuth(); // Use auth context with logout
  const router = useRouter(); // Initialize router
  const pathname = usePathname(); // Get current pathname
  const [itemCount, setItemCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { resolvedTheme } = useTheme();
  const isDark = isClient && resolvedTheme === "dark";
  const searchBorderColor = isDark ? "#000000" : "#ffffff";

  // Handle outside click to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client
  }, []);

  useEffect(() => {
    if (isClient) {
      setItemCount(cart.reduce((count, item) => count + item.quantity, 0));
    }
  }, [cart, isClient]);

  // Use the logout function from AuthContext and redirect to /login
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout error:", e);
    }
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push("/login");
  };

  // Function to handle search submission (navigating to search page)
  const handleSearchSubmit = (query: string) => {
    console.log("Submitting search for:", query);
    setIsPopoverOpen(false); // Close popover on submit
    setSearchQuery(""); // Clear input after submit
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  // Handle input change and fetch suggestions from backend
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    // Clear previous debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (query.trim().length > 0) {
      setIsSearching(true);
      // Debounce the API call by 250ms
      searchDebounceRef.current = setTimeout(async () => {
        try {
          const data = await searchProducts(query.trim());
          const results = data.products || [];
          setSuggestions(results);
          setIsPopoverOpen(true);
        } catch {
          setSuggestions([]);
          setIsPopoverOpen(true);
        } finally {
          setIsSearching(false);
        }
      }, 250);
    } else {
      setSuggestions([]);
      setIsSearching(false);
      setIsPopoverOpen(true);
    }
  };

  // Handle clicking a suggestion
  const handleSuggestionClick = (productName: string) => {
    setSearchQuery(productName); // Fill input with suggestion
    setIsPopoverOpen(false);
    setSuggestions([]);
    handleSearchSubmit(productName); // Submit search immediately on click
  };

  // Handle input focus
  const handleFocus = () => {
    setIsPopoverOpen(true);
  };

  // Clear timeouts on unmount & add Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsPopoverOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsPopoverOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Function to handle navigation to protected routes
  const handleProtectedRoute = (path: string) => {
    // Check authentication status using the token from context
    if (!token) {
      // Check token instead of user object
      toast({
        title: "Login Required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
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
        className="sticky top-0 z-50 w-full border-b bg-orange-600 text-primary-foreground"
      >
        <div className="container flex h-16 items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-4">
              <motion.div
                variants={interactiveVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  href={
                    Boolean(
                      user && pathname !== "/login" && pathname !== "/signup",
                    )
                      ? "/"
                      : "/login"
                  }
                  className="flex items-center gap-2 flex-shrink-0 mr-4"
                >
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Image
                      src="/images/logo.png"
                      alt="Laddu Zabardast Logo"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <AuroraText className="text-2xl sm:text-3xl font-semibold px-2 py-1 leading-tight text-white/90">
                    LADDU ZABARDAST
                  </AuroraText>
                  <span className="text-lg font-semibold tracking-tight text-white sm:hidden">
                    LZ
                  </span>
                </Link>
              </motion.div>

              {Boolean(
                user && pathname !== "/login" && pathname !== "/signup",
              ) && (
                <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                  <motion.div
                    variants={interactiveVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
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
                  <motion.div
                    variants={interactiveVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
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
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Boolean(
              user && pathname !== "/login" && pathname !== "/signup",
            ) && (
              <>
                <Box
                  component={motion.div}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  ref={searchContainerRef}
                  sx={{
                    display: { xs: "none", sm: "block" },
                    width: { sm: 320, md: 420, lg: 500, xl: 580 },
                    overflow: "visible",
                    position: "relative",
                    zIndex: 50,
                  }}
                >
                  <Box
                    component="form"
                    onSubmit={(e: React.FormEvent) => {
                      e.preventDefault();
                      handleSearchSubmit(searchQuery);
                    }}
                    sx={{
                      position: "relative",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#ea580c",
                      border: `2px solid ${searchBorderColor}`,
                      borderRadius: isPopoverOpen ? "22px 22px 0 0" : "9999px",
                      borderBottomColor: isPopoverOpen
                        ? "transparent"
                        : searchBorderColor,
                      boxShadow: isPopoverOpen
                        ? "0 4px 12px rgba(0, 0, 0, 0.15)"
                        : "0 2px 8px rgba(0, 0, 0, 0.15)",
                      transition:
                        "border-radius 0.15s ease, border-color 0.15s ease",
                      height: 44,
                      px: "14px",
                    }}
                  >
                    <Box
                      component="button"
                      type="submit"
                      aria-label="Search"
                      sx={{
                        p: "4px",
                        ml: "-4px",
                        mr: "8px",
                        color: "rgba(255,255,255,0.8)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: "none",
                        border: "none",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          color: "#fff",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                      }}
                    >
                      <Search size={16} color="white" />
                    </Box>

                    <Box
                      component="input"
                      ref={searchInputRef}
                      type="text"
                      name="search"
                      placeholder="Search products, laddus, pickles..."
                      value={searchQuery}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      autoComplete="off"
                      sx={{
                        flex: 1,
                        backgroundColor: "transparent",
                        color: "#fff",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        outline: "none",
                        border: "none",
                        height: "100%",
                        minWidth: 0,
                        "&::placeholder": {
                          color: "rgba(255,255,255,0.75)",
                        },
                      }}
                    />

                    {searchQuery && (
                      <Box
                        component="button"
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSuggestions([]);
                          searchInputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                        sx={{
                          p: "4px",
                          borderRadius: "50%",
                          color: "rgba(255,255,255,0.7)",
                          cursor: "pointer",
                          flexShrink: 0,
                          background: "none",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            color: "#fff",
                            backgroundColor: "rgba(255,255,255,0.15)",
                          },
                        }}
                      >
                        <X size={16} />
                      </Box>
                    )}
                  </Box>

                  {/* Dropdown for options connected with curve directly from the search bar */}
                  {isPopoverOpen && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "#ea580c",
                        borderLeft: `2px solid ${searchBorderColor}`,
                        borderRight: `2px solid ${searchBorderColor}`,
                        borderBottom: `2px solid ${searchBorderColor}`,
                        borderTop: `1px solid ${isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)"}`,
                        borderRadius: "0 0 22px 22px",
                        boxShadow: "0 20px 35px -5px rgba(0,0,0,0.35)",
                        overflow: "hidden",
                        zIndex: 60,
                      }}
                    >
                      {/* Loading state */}
                      {isSearching ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            py: 2.5,
                          }}
                        >
                          <CircularProgress size={18} sx={{ color: "white" }} />
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              color: "#fff",
                            }}
                          >
                            Searching delicacies...
                          </Typography>
                        </Box>
                      ) : searchQuery.trim().length > 0 ? (
                        /* Matched suggestions */
                        suggestions.length > 0 ? (
                          <Box
                            sx={{
                              maxHeight: 288,
                              overflowY: "auto",
                              py: 0.5,
                              "&::-webkit-scrollbar": { display: "none" },
                            }}
                          >
                            {suggestions.map((product) => (
                              <Box
                                component="button"
                                key={product.id || product.key || product.id}
                                type="button"
                                onClick={() =>
                                  handleSuggestionClick(product.name)
                                }
                                onMouseDown={(e: React.MouseEvent) =>
                                  e.preventDefault()
                                }
                                sx={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 1.5,
                                  px: 2,
                                  py: 1.25,
                                  fontSize: "0.875rem",
                                  textAlign: "left",
                                  color: "#fff",
                                  cursor: "pointer",
                                  background: "none",
                                  border: "none",
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.15)",
                                  transition: "background 0.15s ease",
                                  "&:last-of-type": { borderBottom: "none" },
                                  "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.15)",
                                  },
                                  "&:active": {
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  <Search
                                    size={14}
                                    style={{
                                      color: "rgba(255,255,255,0.75)",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      fontWeight: 500,
                                      color: "#fff",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    {product.name}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    flexShrink: 0,
                                  }}
                                >
                                  {product.price && (
                                    <Typography
                                      sx={{
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        color: "rgba(255,255,255,0.9)",
                                      }}
                                    >
                                      ₹{product.price}
                                    </Typography>
                                  )}
                                  {product.category && (
                                    <Box
                                      component="span"
                                      sx={{
                                        fontSize: "0.6875rem",
                                        fontWeight: 600,
                                        px: 1,
                                        py: 0.25,
                                        borderRadius: "9999px",
                                        backgroundColor:
                                          "rgba(255,255,255,0.2)",
                                        color: "#fff",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {product.category}
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            ))}
                            <Box
                              sx={{
                                p: 1,
                                borderTop: "1px solid rgba(255,255,255,0.15)",
                                backgroundColor: "rgba(0,0,0,0.1)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                px: 2,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.75rem",
                                  color: "rgba(255,255,255,0.8)",
                                }}
                              >
                                Press Enter to view all results
                              </Typography>
                              <Box
                                component="button"
                                type="button"
                                onClick={() => handleSearchSubmit(searchQuery)}
                                sx={{
                                  color: "#fff",
                                  textDecoration: "underline",
                                  fontSize: "0.75rem",
                                  fontWeight: 500,
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  "&:hover": {
                                    color: "rgba(255,255,255,0.9)",
                                  },
                                }}
                              >
                                View all &rarr;
                              </Box>
                            </Box>
                          </Box>
                        ) : (
                          /* No products found */
                          <Box sx={{ py: 2, px: 2, textAlign: "center" }}>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                color: "rgba(255,255,255,0.9)",
                                fontWeight: 500,
                              }}
                            >
                              No products found for &ldquo;{searchQuery}&rdquo;
                            </Typography>
                            <Box
                              component="button"
                              type="button"
                              onClick={() => handleSearchSubmit(searchQuery)}
                              sx={{
                                mt: 1,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: "9999px",
                                backgroundColor: "rgba(255,255,255,0.2)",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                transition: "background 0.15s ease",
                                "&:hover": {
                                  backgroundColor: "rgba(255,255,255,0.3)",
                                },
                              }}
                            >
                              Search for &ldquo;{searchQuery}&rdquo; anyway
                              &rarr;
                            </Box>
                          </Box>
                        )
                      ) : (
                        /* Empty query -> directly render options */
                        <Box sx={{ py: 1.25, px: 1.5 }}>
                          <Box
                            sx={{
                              px: 1,
                              py: 0.5,
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: "rgba(255,255,255,0.7)",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                            }}
                          >
                            <Sparkles size={12} /> Popular Searches
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.75,
                              py: 0.75,
                              px: 1,
                            }}
                          >
                            {POPULAR_SEARCHES.map((term) => (
                              <Box
                                component="button"
                                key={term}
                                type="button"
                                onClick={() => handleSuggestionClick(term)}
                                onMouseDown={(e: React.MouseEvent) =>
                                  e.preventDefault()
                                }
                                sx={{
                                  px: 1.25,
                                  py: 0.5,
                                  fontSize: "0.75rem",
                                  borderRadius: "9999px",
                                  backgroundColor: "rgba(255,255,255,0.15)",
                                  color: "#fff",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  border: "none",
                                  transition: "background 0.15s ease",
                                  "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.25)",
                                  },
                                  "&:active": {
                                    backgroundColor: "rgba(255,255,255,0.3)",
                                  },
                                }}
                              >
                                <Search
                                  size={10}
                                  style={{ color: "rgba(255,255,255,0.7)" }}
                                />
                                {term}
                              </Box>
                            ))}
                          </Box>

                          <Box
                            sx={{
                              my: 0.75,
                              borderTop: "1px solid rgba(255,255,255,0.15)",
                            }}
                          />

                          <Box
                            sx={{
                              px: 1,
                              py: 0.5,
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: "rgba(255,255,255,0.7)",
                            }}
                          >
                            Quick Categories
                          </Box>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 0.5,
                              px: 0.5,
                              pt: 0.5,
                              pb: 0.5,
                            }}
                          >
                            {QUICK_CATEGORIES.map((cat) => (
                              <Box
                                component="button"
                                key={cat.label}
                                type="button"
                                onClick={() => {
                                  setIsPopoverOpen(false);
                                  router.push(cat.href);
                                }}
                                onMouseDown={(e: React.MouseEvent) =>
                                  e.preventDefault()
                                }
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  px: 1.25,
                                  py: 0.75,
                                  borderRadius: "8px",
                                  fontSize: "0.75rem",
                                  fontWeight: 500,
                                  color: "#fff",
                                  textAlign: "left",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  transition: "background 0.15s ease",
                                  "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.15)",
                                  },
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(255,255,255,0.7)",
                                    flexShrink: 0,
                                  }}
                                />
                                <span>{cat.label}</span>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </>
            )}

            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.3 },
                },
              }}
              className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
            >
              <motion.div
                variants={interactiveVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <ThemeToggle />
              </motion.div>

              {Boolean(
                !user || pathname === "/login" || pathname === "/signup",
              ) && (
                <motion.div
                  variants={interactiveVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    href={pathname === "/signup" ? "/login" : "/signup"}
                    className="px-4 py-1.5 rounded-full border border-white/60 text-white hover:bg-white hover:text-orange-600 font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm"
                  >
                    {pathname === "/signup" ? "Log In" : "Sign Up"}
                  </Link>
                </motion.div>
              )}

              {Boolean(
                user && pathname !== "/login" && pathname !== "/signup",
              ) && (
                <motion.div
                  variants={interactiveVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    variant="text"
                    size="small"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === "dark"
                          ? "black !important"
                          : "white !important",
                    }}
                    className="relative group text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                    onClick={() => router.push("/cart")}
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
                          bounce: 0.5,
                        }}
                      >
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 min-w-[1.25rem] 
                                            justify-center rounded-full p-1 text-xs font-bold
                                            animate-pulse shadow-lg shadow-red-500/20
                                            border border-white/20"
                        >
                          {itemCount > 99 ? "99+" : itemCount}
                        </Badge>
                      </motion.div>
                    )}

                    <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:animate-ping" />
                    <span className="sr-only">View Cart</span>
                  </Button>
                </motion.div>
              )}

              {Boolean(
                user && pathname !== "/login" && pathname !== "/signup",
              ) && (
                <motion.div
                  variants={interactiveVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="text"
                        size="small"
                        sx={{
                          color: (theme) =>
                            theme.palette.mode === "dark"
                              ? "black !important"
                              : "white !important",
                        }}
                        className="relative group hover:bg-white/10 hover:text-primary-foreground overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                        <Menu className="h-5 w-5 transform group-hover:rotate-180 transition-transform duration-500" />
                        <div className="absolute inset-0 rounded-full border border-white/20 scale-0 group-hover:scale-100 transition-transform duration-200" />
                        <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:animate-ping" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-full sm:w-[300px] bg-background text-foreground"
                    >
                      <SheetHeader className="mb-4">
                        <SheetTitle className="text-lg font-semibold text-primary">
                          {user ? "My Account" : "Menu"}
                        </SheetTitle>
                      </SheetHeader>

                      <div className="px-2 pb-6 sm:hidden">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const mobileQuery = formData.get(
                              "mobile-search",
                            ) as string;
                            const sheetCloseButton = (e.target as HTMLElement)
                              .closest('div[role="dialog"]')
                              ?.querySelector('button[aria-label="Close"]');
                            if (sheetCloseButton instanceof HTMLElement) {
                              sheetCloseButton.click();
                            }
                            handleSearchSubmit(mobileQuery);
                          }}
                          className="flex items-center gap-2"
                        >
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              type="search"
                              name="mobile-search"
                              placeholder="Search products..."
                              className="pl-9 pr-3 w-full h-11 text-sm rounded-full bg-background"
                            />
                          </div>
                          <Button
                            type="submit"
                            variant="contained"
                            sx={{
                              backgroundColor: "#ea580c !important",
                              color: "#ffffff !important",
                              borderColor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "#000000 !important"
                                  : "#ffffff !important",
                              border: "1.5px solid !important",
                              borderRadius: "9999px !important",
                              minWidth: 44,
                              height: 44,
                              p: 0,
                              "&:hover": {
                                backgroundColor: "#c2410c !important",
                              },
                            }}
                          >
                            <Search className="h-5 w-5" />
                          </Button>
                        </form>
                      </div>

                      <nav className="flex flex-col gap-1">
                        {" "}
                        {user ? (
                          <>
                            <SheetClose asChild>
                              <Link
                                href="/profile"
                                className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base"
                              >
                                <User className="mr-3 h-5 w-5" />
                                Profile
                              </Link>
                            </SheetClose>

                            <SheetClose asChild>
                              <Link
                                href="/orders"
                                className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base"
                              >
                                <History className="mr-3 h-5 w-5" />
                                Orders
                              </Link>
                            </SheetClose>

                            <SheetClose asChild>
                              <Link
                                href="/wishlist"
                                className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base"
                              >
                                <Heart className="mr-3 h-5 w-5" />
                                Wishlist
                              </Link>
                            </SheetClose>
                          </>
                        ) : (
                          <>
                            <SheetClose asChild>
                              <Link
                                href={`/login?redirect=${encodeURIComponent(pathname ?? "/")}`}
                                className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base"
                              >
                                <LogIn className="mr-3 h-5 w-5" />
                                Login
                              </Link>
                            </SheetClose>

                            <SheetClose asChild>
                              <Link
                                href={`/signup?redirect=${encodeURIComponent(pathname ?? "/")}`}
                                className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base"
                              >
                                <UserPlus className="mr-3 h-5 w-5" />
                                Sign Up
                              </Link>
                            </SheetClose>
                          </>
                        )}
                        {user && isUserAdmin() && (
                          <>
                            <Separator className="my-3" />
                            <SheetClose asChild>
                              <Link
                                href="/admin"
                                className="flex items-center px-4 py-3 rounded-md hover:bg-accent text-base"
                              >
                                <ShieldCheck className="mr-3 h-5 w-5" />
                                Admin Dashboard
                              </Link>
                            </SheetClose>
                          </>
                        )}
                        {user && (
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
              )}
            </motion.div>
          </div>
        </div>
      </motion.header>
      <ScrollProgress className="top-16 h-1" />
    </>
  );
}
