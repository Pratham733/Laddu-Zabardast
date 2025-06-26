"use client";

import React from 'react';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { ThemeProvider } from '@/context/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from './navbar';
import { BackgroundLaddu } from '@/components/animations/BackgroundLaddu';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="relative min-h-screen flex flex-col">
              <BackgroundLaddu />
              <Navbar />
              <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
                {children}
              </main>
              <footer className="mt-auto py-4 text-center text-sm text-muted-foreground relative z-10">
                © {new Date().getFullYear()} Laddu Zabardast. All rights reserved.
              </footer>
            </div>
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}