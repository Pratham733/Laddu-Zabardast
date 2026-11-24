import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button-new";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/store-feedback";
import { HOME_SHORTCUTS, useStorefront, type ShortcutId } from "@/context/storefront-context";
import { toast } from "@/hooks";
import { errorMessage } from "@/lib/store-display";
import { adminAction } from "./product-editor";

function VisibilityForm({ initial }: { initial: ShortcutId[] }) {
  const [hidden, setHidden] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { saveShortcuts } = useStorefront();
  const dirty = hidden.length !== initial.length || hidden.some(id => !initial.includes(id));

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveShortcuts(hidden);
      toast({ title: "Storefront visibility saved" });
    } catch (reason) {
      setError(errorMessage(reason, "Could not save visibility. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={save} className="max-w-xl rounded-xl border bg-card p-4 sm:p-6">
    <h2 className="text-lg font-semibold">Home shortcuts</h2>
    <p className="mt-1 text-sm text-muted-foreground">Choose which shortcuts and matching sections appear on the storefront.</p>
    <fieldset disabled={saving} className="mt-4 divide-y">
      {HOME_SHORTCUTS.map(({ id, label }) => <div key={id} className="flex min-h-12 items-center justify-between gap-3">
        <Label htmlFor={`shortcut-${id}`}>{label}</Label>
        <Switch id={`shortcut-${id}`} checked={!hidden.includes(id)} onCheckedChange={visible => {
          setHidden(current => visible ? current.filter(key => key !== id) : [...current, id]);
        }} />
      </div>)}
    </fieldset>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    <Button type="submit" className={`mt-4 ${adminAction}`} disabled={!dirty || saving}>{saving ? "Saving…" : "Save visibility"}</Button>
  </form>;
}

export function StorefrontPanel() {
  const { hiddenShortcuts, status, reload } = useStorefront();
  if (status === "loading") return <LoadingState label="Loading storefront settings…" />;
  if (status === "error") return <ErrorState message="Storefront settings could not be loaded." onRetry={reload} />;
  return <VisibilityForm initial={hiddenShortcuts} />;
}
