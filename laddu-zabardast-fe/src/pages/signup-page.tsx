//src/app/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Container, Column, Row, Box } from "@/components/ui/layout";;
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth, toast } from "@/hooks";
import { UserPlus, Mail, Lock, LoaderCircle, Eye, EyeOff } from "lucide-react";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { signup } from "@/routes";
import { getUser } from "@/queries";
import { Button } from "@mui/material"; // Import Button
import { MailOpen } from "lucide-react"; // Import MailOpen icon

const signupSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const ImpressiveLamp = () => (
  <Column className="items-center mb-4 relative select-none">
    {/* Ambient Glow Background */}
    <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-yellow-100/30 rounded-full blur-3xl animate-pulse" />

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
      <circle
        cx="60"
        cy="60"
        r="8"
        fill="url(#bulbGradient)"
        className="animate-glow"
      >
        <animate
          attributeName="opacity"
          values="0.8;1;0.8"
          dur="2s"
          repeatCount="indefinite"
        />
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
        <path
          d="M45,65 L75,65 L80,150 L40,150"
          fill="url(#beamGradient)"
          opacity="0.3"
        />
        <path
          d="M55,65 L65,65 L67,150 L53,150"
          fill="url(#beamGradient)"
          opacity="0.2"
        />
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
    <Box className="absolute -left-2 top-1/2 w-[2px] h-[80px] bg-gradient-to-b from-yellow-200/50 to-transparent transform -rotate-15"></Box>
    <Box className="absolute -right-2 top-1/2 w-[2px] h-[80px] bg-gradient-to-b from-yellow-200/50 to-transparent transform rotate-15"></Box>
    <Box className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[2px] h-[80px] bg-gradient-to-b from-yellow-200/50 to-transparent transform rotate-15"></Box>
  </Column>
);

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, setToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  // Handle Email/Password Signup via API route
  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const result = await signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

      let userDetails = result.user;
      if (!userDetails) {
        try {
          const meResult = await getUser();
          if (meResult && meResult.user) {
            userDetails = meResult.user;
          }
        } catch (meError) {
          console.error("Failed to fetch user details after signup:", meError);
        }
      }

      if (userDetails) {
        setUser({
          ...userDetails,
          source: "db",
          userId: userDetails.userId || (userDetails as any).id || "",
          id: userDetails.userId || (userDetails as any).id || "",
          firstName: userDetails.firstName ?? data.firstName,
          lastName: userDetails.lastName ?? data.lastName,
          email: userDetails.email ?? data.email,
          phone: userDetails.phone ?? null,
          photoURL: userDetails.photoURL ?? null,
          role: userDetails.role ?? null,
          isAdmin: Boolean(userDetails.isAdmin || data.email === "spratham388@gmail.com"),
          picture: userDetails.picture ?? null,
          addresses: userDetails.addresses ?? [],
        });
      }

      if (result && result.token) {
        setToken(result.token);
      }

      toast({
        title: "Welcome to Laddu Zabardast!",
        description: "Your account has been created successfully.",
      });

      // Always go directly to the home page upon signup
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Something went wrong during signup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Container className="px-4 py-12 md:px-6 md:py-20 flex justify-center items-center min-h-[70vh]">
      {" "}
      <Card className="w-full max-w-md shadow-lg relative overflow-visible">
        {" "}
        {/* Impressive Lamp */}
        <Box className="absolute left-1/2 -top-32 transform -translate-x-1/2 z-20">
          <ImpressiveLamp />
        </Box>
        <Box className="relative z-10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gradient flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6 inline-block" /> Sign Up
            </CardTitle>
            <CardDescription>
              Create your Laddu Zabardast account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <UserPlus className="h-4 w-4" />
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your first name"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <UserPlus className="h-4 w-4" />
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your last name"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
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
                      <FormLabel className="flex items-center gap-1">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <Box className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Choose a password (min 6 chars)"
                            {...field}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </Box>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <InteractiveHoverButton
                  type="submit"
                  className="w-full h-8 px-3 py-1 rounded-full text-sm font-semibold flex flex-row items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <span className="flex items-center">
                    {isLoading ? (
                      <LoaderCircle className="mr-2 h-3 w-3 align-middle" />
                    ) : (
                      <UserPlus className="mr-2 h-3 w-3 align-middle" />
                    )}
                    <span className="align-middle">
                      {isLoading ? "Signing Up..." : "Sign Up"}
                    </span>
                  </span>
                </InteractiveHoverButton>
              </form>
            </Form>

            {/* Separator */}
            <Box className="relative my-4"></Box>
          </CardContent>
          {/* <Separator /> */}

          <CardFooter className="text-center text-sm flex items-center justify-center gap-1 flex-wrap mt-2">
            <p className="text-muted-foreground flex items-center justify-center gap-1 flex-wrap">
              Already have an account?
              <Link
                href={`/login${searchParams?.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`}
              >
                <Button className="h-7 px-3 py-1 rounded-full text-sm font-medium align-middle ml-1">
                  <MailOpen className="mr-2 h-4 w-4" />
                  Login with Email
                </Button>
              </Link>
            </p>
          </CardFooter>
        </Box>
      </Card>
    </Container>
  );
}
