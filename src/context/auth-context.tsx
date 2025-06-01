//src/context/auth-context.tsx

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import type { AppUser } from "@/types/product"; // Import AppUser type from types/product.ts

interface AuthContextType {
  // Ensure this interface is aligned with AppUser type, including isAdmin
  user: AppUser | null; // Represents the currently logged-in user from JWT
  token: string | null; // Stores the JWT
  setToken: (token: string | null) => void; // Function to update the token
  setUser: (user: AppUser) => void; // ✅ ADD THIS
  loading: boolean; // Indicates if the initial auth state check is complete
  isInitialised: boolean; // Indicates if the initial auth state check is complete (added)
  logout: () => void; // Function to handle logout
  isUserAdmin: () => boolean; // Function to check if user is admin
}

const adminEmail = "spratham388@gmail.com"; // IMPORTANT: Replace with YOUR actual admin email address

const AuthContext = createContext<AuthContextType>({
  // Add isAdmin to initial context value
  user: null,
  token: null,
  setToken: () => { },
  setUser: () => {}, // ✅ Add this line
  loading: true, // Start as true until check is complete
  isInitialised: false,
  logout: () => { },
  isUserAdmin: () => false,
});

// Basic JWT decoding (replace with a robust library like jwt-decode in production)
// This needs to match the actual payload structure of YOUR JWTs
function decodeJwtPayload(
  token: string
): Omit<Extract<AppUser, object>, "source"> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    console.log("[AuthContext] Decoded JWT payload:", payload); // Log entire payload

    // Map JWT payload to AppUser fields
    return {
      userId: payload.userId,
      email: payload.email,
      firstName: payload.firstName ?? '',
      lastName: payload.lastName ?? '',
      phone: payload.phone || null,
      photoURL: payload.photoURL || null,
      role: payload.role || null,
      isAdmin: payload.isAdmin || false,
      picture: payload.picture || null,
      addresses: payload.addresses || [],
    };
  } catch (e) {
    console.error("[AuthContext] Failed to decode JWT:", e);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start loading
  const [isInitialised, setIsInitialised] = useState(false); // Added isInitialised state


  const isUserAdmin = (): boolean => {
     const isAdminCheck = user?.email === adminEmail;
     // Log the check for debugging
     console.log(`[AuthContext] isUserAdmin check: user.email ("${user?.email}") === adminEmail ("${adminEmail}") => ${isAdminCheck}`);
     return isAdminCheck;
  };

  // Function to update token state and localStorage
  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("authToken", newToken);
      // Decode JWT to set user info
      const decodedPayload = decodeJwtPayload(newToken);
      if (decodedPayload) {
          setUser({
            source: "jwt", // Explicitly set source
            ...decodedPayload, // Spread the decoded payload
            firstName: decodedPayload.firstName ?? '',
            lastName: decodedPayload.lastName ?? '',
          });
          console.log("[AuthContext] User state set from new token:", { source: "jwt", ...decodedPayload });
      } else {
        // Handle invalid token case
        setUser(null); // Clear user if token is invalid
        localStorage.removeItem("authToken"); // Also clear from storage
        console.warn("[AuthContext] Invalid token detected on setToken, user cleared.");
      }
    } else {
      localStorage.removeItem("authToken");
      setUser(null); // Clear user state on logout
      console.log("[AuthContext] Token cleared, user set to null.");
    }
  };

  // Logout function
  const logout = async () => {
    setToken(null); // Clear JWT token and user state
    console.log("[AuthContext] User logged out via logout function.");
  };

  useEffect(() => {
    setLoading(true); // Start loading check
    try {
      // Check localStorage for existing JWT token on mount (client-side)
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        console.log("[AuthContext] Found token in localStorage on mount.");
        setTokenState(storedToken); // Set token state
        // Decode JWT to set initial user info
        const decodedPayload = decodeJwtPayload(storedToken);
        if (decodedPayload) {
          setUser({
            source: "jwt", // Explicitly set source
            ...decodedPayload, // Spread the decoded payload
            firstName: decodedPayload.firstName ?? '',
            lastName: decodedPayload.lastName ?? '',
          });
          console.log("[AuthContext] User state set from stored token:", { source: "jwt", ...decodedPayload });
        } else {
          console.warn("[AuthContext] Invalid token found in storage on mount, removing.");
          localStorage.removeItem("authToken"); // Remove invalid token
          setUser(null);
        }
      } else {
        console.log("[AuthContext] No token found in localStorage on mount.");
        setUser(null); // No token found
      }
    } catch (error) {
      console.error("[AuthContext] Error accessing localStorage or decoding token on mount:", error);
      setUser(null); // Ensure user is null on error
    } finally {
      setLoading(false); // Finish loading check
      setIsInitialised(true); // Set isInitialised to true when initial check is complete
      console.log("[AuthContext] Initial auth check complete. Loading:", false);
    }

    // Cleanup function
    return () => { };
  }, []); // Run once on mount

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    token,
    setToken,
    setUser,
    loading,
    isInitialised,
    logout,
    isUserAdmin,
  }), [user, token, loading, isInitialised]);

  // Display loading indicator while checking auth state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    // Ensure the AuthContext.Provider is passing the correct values
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
