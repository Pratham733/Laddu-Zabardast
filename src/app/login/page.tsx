// /src/app/login/page.tsx
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Separator } from '@/components/ui/separator';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Impressive Lamp SVG component
const ImpressiveLamp = () => (
  <div className="flex flex-col items-center mb-4 relative select-none">
    {/* Ambient Glow Background */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-yellow-100/30 rounded-full blur-3xl animate-pulse" />
    
    <svg 
      width="120" 
      height="160" 
      viewBox="0 0 120 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="animate-float"
    >
      {/* Decorative Top Arc */}
      <path d="M40,10 Q60,0 80,10" stroke="#444" strokeWidth="3" fill="none" />
      
      {/* Main Power Cable */}
      <path d="M60,0 V30" stroke="#666" strokeWidth="4" />
      
      {/* Lamp Head */}
      <g transform="rotate(-15 60 50)">
        {/* Outer Shade */}
        <ellipse cx="60" cy="50" rx="30" ry="15" fill="url(#lampGradient)" />
        {/* Inner Shade */}
        <ellipse cx="60" cy="48" rx="25" ry="12" fill="#2a2a2a" />
      </g>

      {/* Glowing Bulb */}
      <circle cx="60" cy="60" r="8" fill="url(#bulbGradient)" className="animate-glow">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Light Beam */}
      <g className="light-beam">
        <path
          d="M30,65 L90,65 L100,150 L20,150"
          fill="url(#beamGradient)"
          opacity="0.4"
          className="animate-pulse"
        />
        {/* Secondary Light Beams */}
        <path d="M45,65 L75,65 L80,150 L40,150" fill="url(#beamGradient)" opacity="0.3" />
        <path d="M55,65 L65,65 L67,150 L53,150" fill="url(#beamGradient)" opacity="0.2" />
      </g>

      {/* Decorative Elements */}
      <circle cx="60" cy="40" r="2" fill="gold" className="animate-ping" />
      <path d="M45,45 Q60,40 75,45" stroke="#888" strokeWidth="1" fill="none" />

      {/* Gradients */}
      <defs>
        <radialGradient id="lampGradient" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="#333" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>
        
        <radialGradient id="bulbGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="50%" stopColor="#ffe766" />
          <stop offset="100%" stopColor="#ffcd00" />
        </radialGradient>

        <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 247, 214, 0.6)" />
          <stop offset="100%" stopColor="rgba(255, 247, 214, 0)" />
        </linearGradient>
      </defs>
    </svg>

    {/* Additional Light Rays */}
    <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[2px] h-[80px] bg-gradient-to-b from-yellow-200/50 to-transparent transform -rotate-15" />
    <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[2px] h-[80px] bg-gradient-to-b from-yellow-200/50 to-transparent transform rotate-15" />
  </div>
);

// Add these styles to your globals.css
const globalStyles = `
@keyframes float {
  0%, 100% { transform: translateY(-10px); }
  50% { transform: translateY(0); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(255, 231, 102, 0.8)); }
  50% { filter: drop-shadow(0 0 12px rgba(255, 231, 102, 0.9)); }
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

.light-beam {
  filter: blur(4px);
}
`;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);  const [lampOn, setLampOn] = useState(true);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSuccessRedirect = () => {
    const redirectUrl = searchParams?.get('redirect') || '/';
    router.push(redirectUrl);
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    let responseText = '';    try {
      const retryLogin = async (retries = 2) => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
              signal: AbortSignal.timeout(15000), // Reduced timeout to 15 seconds
            });
            
            if (response.status === 503) {
              console.log(`[Login] Attempt ${i + 1} failed, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
              continue;
            }
            return response;
          } catch (err) {
            if (i === retries - 1) throw err;
            console.log(`[Login] Attempt ${i + 1} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
        throw new Error('All retry attempts failed');
      };
      
      const response = await retryLogin();

      responseText = await response.text();

      if (!response.ok) {
        let errorMsg = "Invalid email or password.";
        try {
          const result = JSON.parse(responseText);
          errorMsg = result.error || errorMsg;
        } catch {
          if (responseText.toLowerCase().includes('<!doctype html')) {
            errorMsg = "Server error. Please try again later.";
          } else {
            errorMsg = `Server returned: ${responseText.substring(0, 100)}...`;
          }
        }

        toast({
          title: "Login Failed",
          description: errorMsg,
          variant: "destructive",
        });

      } else {
        try {
          const result = JSON.parse(responseText);
          toast({ title: "Login Successful", description: "Welcome back!" });

          if (result.token) {
            setToken(result.token);
            handleSuccessRedirect();
          } else {
            toast({
              title: "Login Error",
              description: "Login succeeded but no token received.",
              variant: "destructive",
            });
          }

        } catch {
          toast({
            title: "Login Error",
            description: "Login succeeded but response was unreadable.",
            variant: "destructive",
          });
          handleSuccessRedirect();
        }
      }    } catch (error: any) {      // Handle specific error types
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        toast({
          title: "Login Failed",
          description: "Server is taking too long to respond. Please try again in a few moments.",
          variant: "destructive",
        });
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        toast({
          title: "Login Failed",
          description: "Unable to connect to the server. Please check your internet connection.",
          variant: "destructive",
        });
      } else if (error.message === 'All retry attempts failed') {
        toast({
          title: "Login Failed",
          description: "Server is currently experiencing high load. Please try again in a few moments.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "An unexpected error occurred. Our team has been notified.",
          variant: "destructive",
        });
      }
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-20 flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md shadow-lg relative overflow-visible">
        {/* Impressive Lamp */}
        <div className="absolute left-1/2 -top-32 transform -translate-x-1/2 z-20">
          <ImpressiveLamp />
        </div>
        <div className="relative z-10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <LogIn className="h-6 w-6" /> Login
            </CardTitle>
            <CardDescription>Access your Laddu Zabardast account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><Mail className="h-4 w-4" /> Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><Lock className="h-4 w-4" /> Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Your password"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <InteractiveHoverButton type="submit" className="w-full h-8 px-3 py-1 rounded-full text-sm font-semibold flex flex-row items-center justify-center gap-2" disabled={isLoading}>
                  <span className="flex items-center">
                    {isLoading ? <Loader2 className="mr-2 h-3 w-3 align-middle" /> : <LogIn className="mr-2 h-3 w-3 align-middle" />}
                    <span className="align-middle">{isLoading ? 'Logging In...' : 'Login'}</span>
                  </span>
                </InteractiveHoverButton>
              </form>
            </Form>

            <Separator />
            <div className="text-center text-sm flex items-center justify-center gap-1 flex-wrap mt-2">
              Don't have an account?
              <Link href="/signup">
                <Button className="h-7 px-3 py-1 rounded-full text-sm font-medium align-middle ml-1">
                  <LogIn className="mr-2 h-4 w-4" />Sign Up
                </Button>
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
