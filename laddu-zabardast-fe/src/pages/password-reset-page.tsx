import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button-new";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, resetPassword } from "@/routes/auth";
import { errorMessage } from "@/lib/store-display";

export default function PasswordResetPage({ reset = false }: { reset?: boolean }) {
  const { hash, pathname, search } = useLocation();
  const [token] = useState(() => reset ? hash.slice(1) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (reset && hash) {
      window.history.replaceState(window.history.state, "", pathname + search);
    }
  }, [reset, hash, pathname, search]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (reset && password !== data.get("confirmPassword")) {
      setError("The passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const result = reset
        ? await resetPassword(token, password)
        : await requestPasswordReset(String(data.get("email") ?? ""));
      setMessage(result.message);
    } catch (reason) {
      setError(errorMessage(reason, "Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  const missingToken = reset && !token;
  return (
    <section className="mx-auto mt-8 max-w-sm space-y-4 rounded-xl border bg-card p-6 sm:mt-16">
      <h1 className="text-xl font-semibold">{reset ? "Reset password" : "Forgot password"}</h1>
      {message ? <p role="status" className="text-sm">{message}</p> : missingToken ? (
        <p role="alert" className="text-sm text-destructive">This reset link is invalid or expired. Request a new link.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {reset ? (
            <>
              <label className="block space-y-1 text-sm font-medium">
                New password
                <Input type="password" name="password" autoComplete="new-password" minLength={6} maxLength={72} required disabled={busy} />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                Confirm new password
                <Input type="password" name="confirmPassword" autoComplete="new-password" minLength={6} maxLength={72} required disabled={busy} />
              </label>
            </>
          ) : (
            <label className="block space-y-1 text-sm font-medium">
              Account email
              <Input type="email" name="email" autoComplete="email" maxLength={254} required disabled={busy} />
            </label>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full rounded-full" disabled={busy}>
            {reset ? (busy ? "Saving…" : "Save new password") : (busy ? "Requesting…" : "Send reset link")}
          </Button>
        </form>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link to="/login" className="text-primary hover:underline">Back to login</Link>
        {reset && !message && (
          <Link to="/forgot-password" className="text-primary hover:underline">Request a new link</Link>
        )}
      </div>
    </section>
  );
}
