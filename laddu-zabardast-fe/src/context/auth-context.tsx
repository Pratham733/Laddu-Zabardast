import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { NativeConnectionError } from "@/routes/apiClient";
import { Button } from "@/components/ui/button-new";
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
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialised, setIsInitialised] = useState(false);

  const isUserAdmin = () => user?.role === "admin";

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
    window.location.href = "/login";
  };

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      setLoading(true);
      try {
        const data = await getUser();
        if (data && data.user) {
          const u = data.user;
          if (!u.userId) {
            throw new Error("Invalid session user: userId is required");
          }
          setUser({
            ...u,
            source: "db",
            userId: u.userId,
            id: u.userId,
            firstName: u.firstName ?? "",
            lastName: u.lastName ?? "",
            isAdmin: u.role === "admin",
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        if (error instanceof NativeConnectionError) setConnectionError(true);
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

  if (connectionError) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Cannot reach the store</h1>
        <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }

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
