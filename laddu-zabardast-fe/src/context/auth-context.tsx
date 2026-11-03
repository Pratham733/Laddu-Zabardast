//src/context/auth-context.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import type { AppUser } from "@/models"; // Import AppUser type from models
import { logout as apiLogout } from "@/routes";
import { getUser } from "@/queries";

interface AuthContextType {
  // Ensure this interface is aligned with AppUser type, including isAdmin
  user: AppUser | null; // Represents the currently logged-in user
  token: string | null; // Stores the JWT (legacy compatibility, unused)
  setToken: (token: string | null) => void; // Function to update the token
  setUser: (user: AppUser | null) => void;
  loading: boolean; // Indicates if the initial auth state check is complete
  isInitialised: boolean; // Indicates if the initial auth state check is complete (added)
  logout: () => void; // Function to handle logout
  isUserAdmin: () => boolean; // Function to check if user is admin
}

const adminEmail = "spratham388@gmail.com"; // IMPORTANT: Replace with YOUR actual admin email address

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setToken: () => {},
  setUser: () => {},
  loading: true, // Start as true until check is complete
  isInitialised: false,
  logout: () => {},
  isUserAdmin: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start loading
  const [isInitialised, setIsInitialised] = useState(false); // Added isInitialised state

  const isUserAdmin = (): boolean => {
    const isAdminCheck = user?.email === adminEmail;
    // Log the check for debugging
    console.log(
      `[AuthContext] isUserAdmin check: user.email ("${user?.email}") === adminEmail ("${adminEmail}") => ${isAdminCheck}`,
    );
    return isAdminCheck;
  };

  // Function to update token state (compatibility only)
  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
  };

  // Logout function
  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error("[AuthContext] Backend logout failed:", e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken"); // Clean up legacy token if any
    console.log("[AuthContext] User logged out via logout function.");
    window.location.href = "/login";
  };

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      setLoading(true);
      try {
        console.log("[AuthContext] Checking cookie session via /user...");
        const data = await getUser();
        if (data && data.user) {
          const u = data.user;
          if (!u.userId) {
            throw new Error("Invalid session user: userId is required");
          }
          setUser({
            source: "db",
            ...u,
            userId: u.userId,
            id: u.userId,
            firstName: u.firstName ?? "",
            lastName: u.lastName ?? "",
            isAdmin: Boolean(u.isAdmin || u.email === adminEmail),
          });
          console.log("[AuthContext] Session recovered:", data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log(
          "[AuthContext] Session check finished (no user logged in or error):",
          error,
        );
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitialised(true);
      }
    };

    initAuth();
  }, []); // Run once on mount

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      user,
      token,
      setToken,
      setUser,
      loading,
      isInitialised,
      logout,
      isUserAdmin,
    }),
    [user, token, loading, isInitialised],
  );

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
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
