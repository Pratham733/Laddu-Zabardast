export function safeReturnTo(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  try {
    const parsed = new URL(value, "https://store.local");
    if (["/login", "/signup", "/google-sign-in"].includes(parsed.pathname.replace(/\/+$/, ""))) return "/";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch { return "/"; }
}
