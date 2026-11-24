import { Capacitor, registerPlugin } from "@capacitor/core";

interface NativeSessionPlugin {
  getToken(options: { server: string }): Promise<{ token?: string }>;
  setToken(options: { server: string; token: string }): Promise<void>;
  clearToken(options: { server: string }): Promise<void>;
}

const NativeSession = registerPlugin<NativeSessionPlugin>("NativeSession");
const server = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8080").replace(/\/$/, "");

export async function getNativeToken(): Promise<string | undefined> {
  if (!Capacitor.isNativePlatform()) return undefined;
  return (await NativeSession.getToken({ server })).token;
}

export async function saveNativeToken(token?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!token) throw new Error("The server did not return a session token.");
  await NativeSession.setToken({ server, token });
}

export async function clearNativeToken(): Promise<void> {
  if (Capacitor.isNativePlatform()) await NativeSession.clearToken({ server });
}
