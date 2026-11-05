import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import type { AppUser } from "@/models";
import { logout as apiLogout } from "@/routes/auth";
import { getUser } from "@/queries";

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  setToken: (token: string | null) => void;
  setUser: (user: AppUser | null) => void;
  loading: boolean;
  isInitialised: boolean;
  logout: () => void;
  isUserAdmin: () => boolean;
}

const adminEmail = "spratham388@gmail.com"; 

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setToken: () => {},
  setUser: () => {},
  loading: true,
  isInitialised: false,
  logout: () => {},
  isUserAdmin: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialised, setIsInitialised] = useState(false);

  const isUserAdmin = (): boolean => {
    const isAdminCheck = user?.email === adminEmail;
    console.log(
      `[AuthContext] isUserAdmin check: user.email ("${user?.email}") === adminEmail ("${adminEmail}") => ${isAdminCheck}`,
    );
    return isAdminCheck;
  };

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error("[AuthContext] Backend logout failed:", e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
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
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
