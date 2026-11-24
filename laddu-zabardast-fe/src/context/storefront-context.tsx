import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "@/routes/apiClient";

export const HOME_SHORTCUTS = [
  { id: "bestsellers", label: "Best Sellers", href: "/shop?collection=bestsellers" },
  { id: "new", label: "New Arrivals", href: "/shop?collection=new" },
  { id: "all", label: "All Products", href: "/shop" },
  { id: "laddu", label: "Laddus", href: "/shop?category=laddu" },
  { id: "pickle", label: "Pickles", href: "/shop?category=pickle" },
  { id: "gifts", label: "Gift Boxes", href: "/shop?category=gift" },
  { id: "custom-box", label: "Create Your Box", href: "/build-a-box" },
] as const;

export type ShortcutId = typeof HOME_SHORTCUTS[number]["id"];
type Settings = { hiddenShortcuts: ShortcutId[] };
type SupportContact = { email: string; phones: string[] };
const path = "/storefront/settings";

const StorefrontContext = createContext<{
  hiddenShortcuts: ShortcutId[];
  contact?: SupportContact;
  status: "loading" | "ready" | "error";
  reload: () => void;
  saveShortcuts: (hidden: ShortcutId[]) => Promise<void>;
}>({
  hiddenShortcuts: [],
  status: "loading",
  reload: () => {},
  saveShortcuts: async () => {},
});

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [hiddenShortcuts, setHidden] = useState<ShortcutId[]>([]);
  const [contact, setContact] = useState<SupportContact>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus("loading");
    apiClient<SupportContact>("/storefront/contact").then(info => {
      if (active) setContact(info);
    }).catch(() => {});
    apiClient<Settings>(path).then(settings => {
      if (!active) return;
      setHidden(settings.hiddenShortcuts ?? []);
      setStatus("ready");
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [attempt]);

  async function saveShortcuts(hidden: ShortcutId[]) {
    const saved = await apiClient<Settings>(path, {
      method: "PUT",
      body: JSON.stringify({ hiddenShortcuts: hidden }),
    });
    setHidden(saved.hiddenShortcuts);
  }

  return <StorefrontContext.Provider value={{
    hiddenShortcuts, contact, status, reload: () => setAttempt(value => value + 1), saveShortcuts,
  }}>{children}</StorefrontContext.Provider>;
}

export const useStorefront = () => useContext(StorefrontContext);
