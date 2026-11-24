import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button-new";
import { clearPendingGoogleSignIn, completeGoogleSignIn, pendingGoogleSignIn } from "@/routes/google-auth";
import { errorMessage } from "@/lib/store-display";

export default function GoogleReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const started = useRef(false);
  const [flow] = useState(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const pending = pendingGoogleSignIn();
    return { params, pending: pending?.state === params.get("state") ? pending : null };
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    window.history.replaceState(window.history.state, "", location.pathname);
    const { params, pending } = flow;
    if (!pending) {
      setError("This Google sign-in expired or was opened in a different app or tab. Start again from Laddu Zabardast.");
      return;
    }
    clearPendingGoogleSignIn();
    const code = params.get("code");
    if (!code) {
      setError(params.get("error") === "cancelled"
        ? "Google sign-in was cancelled. You can try again."
        : "Google sign-in could not be completed. Please try again.");
      return;
    }
    void completeGoogleSignIn(code, pending).then(user => {
      setUser(user);
      navigate(pending.returnTo, { replace: true });
    }).catch(reason => {
      const message = errorMessage(reason, "Google sign-in could not be completed. Please try again.");
      if (pending.from === "login" || pending.from === "signup") {
        const redirect = encodeURIComponent(pending.returnTo);
        navigate(`/${pending.from}?redirect=${redirect}`, {
          replace: true,
          state: { googleSignInError: message },
        });
        return;
      }
      setError(message);
    });
  }, [flow, location.pathname, navigate, setUser]);

  const back = flow.pending?.from === "profile" ? "/profile?tab=security" :
    `/${flow.pending?.from || "login"}?redirect=${encodeURIComponent(flow.pending?.returnTo || "/")}`;
  return <section className="mx-auto max-w-sm rounded-xl border bg-card p-6 text-center">
    <h1 className="text-xl font-semibold">Google sign-in</h1>
    <p role={error ? "alert" : "status"} className="mt-2 text-sm text-muted-foreground">{error || "Finishing sign-in…"}</p>
    {error && <Button asChild className="mt-4"><Link to={back} replace>Back to Laddu Zabardast</Link></Button>}
  </section>;
}
