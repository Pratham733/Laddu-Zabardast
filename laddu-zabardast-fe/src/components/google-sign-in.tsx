import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { googleStatus, startGoogleSignIn } from "@/routes/google-auth";
import { errorMessage } from "@/lib/store-display";

export function GoogleSignIn({ from, returnTo, connected = false, disabled = false }: {
  from: "login" | "signup" | "profile";
  returnTo: string;
  connected?: boolean;
  disabled?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState("");
  const { state } = useLocation();
  const [error, setError] = useState(() =>
    from !== "profile" && typeof state?.googleSignInError === "string" ? state.googleSignInError : ""
  );
  useEffect(() => {
    let active = true;
    googleStatus().then(result => { if (active) setEnabled(result.enabled); }).catch(() => {});
    return () => { active = false; };
  }, []);

  if (!enabled && !error) return null;
  if (connected) return <p className="text-sm font-medium text-foreground">Google is connected to your account.</p>;

  async function openGoogle() {
    setOpening(true);
    setError("");
    setMessage("");
    try {
      await startGoogleSignIn(from, returnTo);
      if (Capacitor.isNativePlatform()) {
        setMessage("Finish signing in in the Google window.");
        setOpening(false);
      }
    } catch (reason) {
      setError(errorMessage(reason, "Could not open Google sign-in. Please try again."));
      setOpening(false);
    }
  }

  return <div className="space-y-2">
    {enabled && <button type="button" disabled={opening || disabled} onClick={openGoogle}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-white px-3 text-sm font-medium text-[#1f1f1f] hover:bg-[#f2f2f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
      <img src="/images/google-signin.png" alt="" width={18} height={18} className="shrink-0" />
      {opening ? "Opening Google…" : from === "profile" ? "Connect Google" : from === "signup" ? "Sign up with Google" : "Sign in with Google"}
    </button>}
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
