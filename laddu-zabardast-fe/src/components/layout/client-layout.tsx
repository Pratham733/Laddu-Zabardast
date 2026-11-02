"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { ThemeProvider } from '@/context/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from './navbar';
import { BackgroundLaddu } from '@/components/animations/BackgroundLaddu';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { THEMES } from '@/utils/constants';

interface ClientLayoutProps {
  children: React.ReactNode;
}

function MuiThemeAppWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const muiTheme = useMemo(() => {
    const isDark = mounted && resolvedTheme === 'dark';
    return createTheme({
      palette: {
        mode: isDark ? THEMES.DARK : THEMES.LIGHT,
        primary: {
          main: isDark ? 'rgb(249, 115, 22)' : 'rgb(234, 102, 17)', // Saffron orange - hex #f97316 vs #ea580c / #e07a1b
          contrastText: '#ffffff',
        },
        background: {
          default: isDark ? '#09090b' : '#fafaf9',
          paper: isDark ? '#18181b' : '#ffffff',
        },
        text: {
          primary: isDark ? '#fafafa' : '#1c1917',
          secondary: isDark ? '#a1a1aa' : '#78716c',
        },
      },
      typography: {
        fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              padding: '6px 16px',
              fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            contained: {
              backgroundColor: isDark ? 'rgb(249, 115, 22)' : 'rgb(234, 102, 17)',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: isDark ? 'rgb(234, 88, 12)' : 'rgb(194, 65, 12)',
              },
            },
            outlined: {
              borderColor: isDark ? 'rgba(249, 115, 22, 0.4)' : 'rgba(234, 102, 17, 0.4)',
              color: isDark ? 'rgb(249, 115, 22)' : 'rgb(234, 102, 17)',
              borderWidth: '1.5px',
              '&:hover': {
                borderWidth: '1.5px',
                borderColor: isDark ? 'rgb(249, 115, 22)' : 'rgb(234, 102, 17)',
                backgroundColor: isDark ? 'rgba(249, 115, 22, 0.08)' : 'rgba(234, 102, 17, 0.08)',
              },
            },
            text: {
              color: isDark ? 'rgb(249, 115, 22)' : 'rgb(234, 102, 17)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(249, 115, 22, 0.08)' : 'rgba(234, 102, 17, 0.08)',
              },
            },
          },
        },
      },
    });
  }, [resolvedTheme, mounted]);

  return <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MuiThemeAppWrapper>
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
      </MuiThemeAppWrapper>
    </ThemeProvider>
  );
}