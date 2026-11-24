import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { pendingGoogleSignIn } from "@/routes/google-auth";

export function NativeGoogleReturn() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    function handleReturn({ url }: { url: string }) {
      if (!active) return;
      try {
        const link = new URL(url);
        if (link.protocol !== "ladduzabardast:" || link.hostname !== "oauth" || link.pathname !== "/google") return;
        const pending = pendingGoogleSignIn();
        if (!pending || pending.state !== link.searchParams.get("state")) return;
        navigate("/google-sign-in#" + link.searchParams.toString(), { replace: true });
      } catch {
        // Ignore malformed deep links.
      }
    }
    const listener = App.addListener("appUrlOpen", handleReturn);
    void App.getLaunchUrl().then(launch => { if (launch) handleReturn(launch); }).catch(() => {});
    return () => {
      active = false;
      void listener.then(handle => handle.remove()).catch(() => {});
    };
  }, [navigate]);
  return null;
}
