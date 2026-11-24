import { Capacitor, registerPlugin } from "@capacitor/core";
import type { LoginResponse } from "@/packets/auth";
import { saveNativeToken } from "@/mobile/session";
import { safeReturnTo } from "@/lib/navigation";
import { apiClient } from "./apiClient";

interface ExternalSignInPlugin {
  prepare(): Promise<{ verifier: string; challenge: string }>;
  supportsAutomaticReturn(): Promise<{ supported: boolean }>;
  open(options: { url: string; automaticReturn: boolean }): Promise<void>;
}

const ExternalSignIn = registerPlugin<ExternalSignInPlugin>("ExternalSignIn");
const storageKey = "lz.google.pending";
const maxAge = 10 * 60 * 1000;

type OriginPage = "login" | "signup" | "profile";
interface PendingSignIn {
  state: string;
  verifier: string;
  returnTo: string;
  from: OriginPage;
  startedAt: number;
}

const storage = () => Capacitor.isNativePlatform() ? localStorage : sessionStorage;
const base64url = (value: Uint8Array) => btoa(String.fromCharCode(...value))
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function pendingGoogleSignIn(): PendingSignIn | null {
  try {
    const pending: PendingSignIn | null = JSON.parse(storage().getItem(storageKey) || "null");
    if (pending && typeof pending.startedAt === "number" && Date.now() - pending.startedAt <= maxAge) return pending;
    storage().removeItem(storageKey);
  } catch {
    // Private browser settings may disable storage.
  }
  return null;
}

export function clearPendingGoogleSignIn() {
  storage().removeItem(storageKey);
}

export const googleStatus = () => apiClient<{ enabled: boolean }>("/auth/google/status");

async function prepareGoogleSignIn() {
  if (Capacitor.getPlatform() === "ios") return ExternalSignIn.prepare();
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(hash)) };
}

export async function startGoogleSignIn(from: OriginPage, returnTo: string) {
  const platform = Capacitor.getPlatform();
  const { verifier, challenge } = await prepareGoogleSignIn();
  const automaticReturn = platform === "ios" || (platform === "android" &&
    (await ExternalSignIn.supportsAutomaticReturn()).supported);
  const { state, url } = await apiClient<{ state: string; url: string }>("/auth/google/start", {
    method: "POST",
    body: JSON.stringify({ challenge, platform, automaticReturn, link: from === "profile" }),
  });
  const pending: PendingSignIn = { state, verifier, returnTo: safeReturnTo(returnTo), from, startedAt: Date.now() };
  storage().setItem(storageKey, JSON.stringify(pending));
  if (Capacitor.isNativePlatform()) {
    try {
      await ExternalSignIn.open({ url, automaticReturn });
    } catch (error) {
      clearPendingGoogleSignIn();
      throw error;
    }
  } else {
    window.location.assign(url);
  }
}

export async function completeGoogleSignIn(code: string, pending: PendingSignIn) {
  const response = await apiClient<LoginResponse>("/auth/google/complete", {
    method: "POST",
    body: JSON.stringify({ state: pending.state, code, verifier: pending.verifier }),
  });
  if (!response.user?.userId) throw new Error("Google sign-in did not return a store account.");
  await saveNativeToken(response.token);
  return { ...response.user, id: response.user.userId, source: "db" as const };
}
