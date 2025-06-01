//src/app/signup/page.tsx
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Mail, Lock, Loader2, Chrome } from 'lucide-react'; // Using Chrome for Google
import { useAuth } from '@/context/auth-context';
import { Separator } from '@/components/ui/separator'; // Import Separator
import { signIn } from "next-auth/react";
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { Button } from '@/components/ui/button'; // Import Button
import { MailOpen } from 'lucide-react'; // Import MailOpen icon

const signupSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

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
    <div className="absolute -left-2 top-1/2 w-[2px] h-[80px] bg-gradient-to-b from-yellow-200/50 to-transparent transform -rotate-15"></div>
    <div className="absolute -right-2 top-1/2 w-[2px] h-[80px] bg-gradient-to-b from-yellow-200/50 to-transparent transform rotate-15"></div>
    <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[2px] h-[80px] bg-gradient-to-b from-yellow-200/50 to-transparent transform rotate-15"></div>
  </div>
);

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuth(); // Use setToken from context
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // State for Google Sign-Up

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  // Redirect after successful signup/login
  const handleSuccessRedirect = () => {
    const redirectUrl = searchParams?.get('redirect') || '/'; // Default to home if no redirect specified
    router.push(redirectUrl);
  };

  // Handle Email/Password Signup via API route
  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    let responseText = ''; // To store raw response text
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password }), // Send only necessary data
      });

       // Store raw response text regardless of status
       responseText = await response.text();

       // Check if the response is ok (status code 2xx)
       if (!response.ok) {
         let errorMsg = `Signup failed. Server returned status ${response.status}.`;
         try {
           // Try to parse the text as JSON
           const result = JSON.parse(responseText);
           errorMsg = result.error || errorMsg;
         } catch (parseError: any) {
           // If parsing fails, the response was likely not JSON (e.g., HTML error page)
           console.error("Signup API Error - Non-JSON response:", responseText);
            if (responseText.toLowerCase().includes('<!doctype html')) {
                 errorMsg = "Signup failed due to a server error. Please try again later.";
            } else {
                 errorMsg = `Signup failed. Server returned: ${responseText.substring(0, 100)}... Check server logs.`; // Show partial response
            }
         }
         toast({
           title: "Signup Failed",
           description: errorMsg,
           variant: "destructive",
         });
      } else {
         // Response is OK (status 201 Created typically)
         try {
            const result = JSON.parse(responseText); // Parse the stored text
            toast({
             title: "Signup Successful",
             description: "Your account has been created. Please log in.", // Prompt user to log in
            });
             // Redirect to login page after successful signup, preserving original redirect target
             const loginUrl = new URL('/login', window.location.origin);
              if (searchParams?.get('redirect')) {
                  loginUrl.searchParams.set('redirect', searchParams.get('redirect')!);
              }
              router.push(loginUrl.toString());
             // No automatic login here - user must login separately
         } catch (jsonError) {
             console.error("Failed to parse successful signup response as JSON:", responseText);
             toast({
                 title: "Signup Partially Successful?",
                 description: "Account likely created, but an issue occurred processing the success response. Please try logging in.",
                 variant: "destructive" // Use destructive to indicate an issue
             });
              router.push('/login'); // Redirect to login anyway
         }
      }
    } catch (error: any) {
      // Catch network errors or other exceptions during fetch
      console.error("Signup network/fetch error:", error);
      toast({
        title: "Signup Failed",
        description: "A network error occurred during signup. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-Up/Sign-In
  const handleGoogleSignUp = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/" }) // or your desired redirect URL
      .catch((error) => {
        console.error("Google Sign-In error:", error);
        toast({ title: "Google Sign-In Failed", description: "Unable to sign in with Google.", variant: "destructive" });
      })
      .finally(() => {
        setIsGoogleLoading(false);
      });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-20 flex justify-center items-center min-h-[70vh]">      <Card className="w-full max-w-md shadow-lg relative overflow-visible">        {/* Impressive Lamp */}
        <div className="absolute left-1/2 -top-32 transform -translate-x-1/2 z-20">
          <ImpressiveLamp />
        </div>
        <div className="relative z-10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gradient flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6 inline-block" /> Sign Up
            </CardTitle>
            <CardDescription>Create your Laddu Zabardast account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><UserPlus className="h-4 w-4"/>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your first name" {...field} disabled={isLoading || isGoogleLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><UserPlus className="h-4 w-4"/>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your last name" {...field} disabled={isLoading || isGoogleLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><Mail className="h-4 w-4"/>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} disabled={isLoading || isGoogleLoading}/>
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
                      <FormLabel className="flex items-center gap-1"><Lock className="h-4 w-4"/>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" placeholder="Choose a password (min 6 chars)" {...field} disabled={isLoading || isGoogleLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             <InteractiveHoverButton type="submit" className="w-full h-8 px-3 py-1 rounded-full text-sm font-semibold flex flex-row items-center justify-center gap-2" disabled={isLoading || isGoogleLoading}>
                <span className="flex items-center">
                  {isLoading ? <Loader2 className="mr-2 h-3 w-3 align-middle" /> : <UserPlus className="mr-2 h-3 w-3 align-middle" />}
                  <span className="align-middle">{isLoading ? 'Signing Up...' : 'Sign Up'}</span>
                </span>
              </InteractiveHoverButton>
              </form>
            </Form>

            {/* Separator */}
             <div className="relative my-4">
                  
                </div>
                  
              
        </CardContent>
        {/* <Separator /> */}

          <CardFooter className="text-center text-sm flex items-center justify-center gap-1 flex-wrap mt-2">
            <p className="text-muted-foreground flex items-center justify-center gap-1 flex-wrap">
              Already have an account?
              <Link href={`/login${searchParams?.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`}>
                <Button className="h-7 px-3 py-1 rounded-full text-sm font-medium align-middle ml-1">
                  <MailOpen className="mr-2 h-4 w-4" />Login with Email
                </Button>
              </Link>
            </p>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
