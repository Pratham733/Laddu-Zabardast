import { useState, type FormEvent } from "react";
import type { BannerItem, CreateBannerPayload } from "@/models/banner";
import { Button } from "@/components/ui/button-new";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { adminAction } from "./product-editor";
import { errorMessage } from "@/lib/store-display";

export function BannerEditor({ banner, nextOrder, onClose, onSave }: { banner: BannerItem | null; nextOrder: number; onClose: () => void; onSave: (value: CreateBannerPayload) => Promise<void> }) {
  const [values, setValues] = useState({ name: banner?.name || "", key: banner?.key || "sweets", description: banner?.description || "", imageURL: banner?.imageURL || "", altURL: banner?.altURL || "", buttonLink: banner?.buttonLink || "/shop", buttonText: banner?.buttonText || "Shop now", order: banner?.order ?? nextOrder, isActive: banner?.isActive !== false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (key: keyof typeof values, value: string | number | boolean) => setValues(current => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();setError("");
    if (!values.name.trim() || !values.imageURL.trim()) { setError("Enter a banner name and image URL."); return; }
    if (!values.buttonLink.startsWith("/") || values.buttonLink.startsWith("//") || values.buttonLink.includes("\\")) { setError("Use a store page for the button link, such as /shop or /build-a-box."); return; }
    setSaving(true);
    try { await onSave({ ...values, name: values.name.trim(), imageURL: values.imageURL.trim() }); onClose(); }
    catch (reason) { setError(errorMessage(reason, "Could not save this banner.")); }
    finally { setSaving(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl">
      <DialogHeader><DialogTitle>{banner ? "Edit banner" : "Add banner"}</DialogTitle><DialogDescription>Control a slide in the home-page carousel.</DialogDescription></DialogHeader>
      <form onSubmit={submit} aria-busy={saving}><fieldset disabled={saving} className="space-y-4">
        <div><Label htmlFor="banner-name">Banner name</Label><Input id="banner-name" className="mt-1 h-11" value={values.name} onChange={e => change("name", e.target.value)} required /></div>
        <div><Label htmlFor="banner-description">Description</Label><Textarea id="banner-description" className="mt-1" value={values.description} onChange={e => change("description", e.target.value)} /></div>
        <div><Label htmlFor="banner-image">Image URL</Label><Input id="banner-image" className="mt-1 h-11" value={values.imageURL} onChange={e => change("imageURL", e.target.value)} required /></div>
        <div><Label htmlFor="banner-fallback">Fallback image URL (optional)</Label><Input id="banner-fallback" className="mt-1 h-11" value={values.altURL} onChange={e => change("altURL", e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="banner-button">Button text</Label><Input id="banner-button" className="mt-1 h-11" value={values.buttonText} onChange={e => change("buttonText", e.target.value)} /></div><div><Label htmlFor="banner-link">Store page</Label><Input id="banner-link" className="mt-1 h-11" value={values.buttonLink} onChange={e => change("buttonLink", e.target.value)} required /></div></div>
        <div className="grid grid-cols-2 gap-4"><div><Label htmlFor="banner-key">Group</Label><Input id="banner-key" className="mt-1 h-11" value={values.key} onChange={e => change("key", e.target.value)} /></div><div><Label htmlFor="banner-order">Slide order</Label><Input id="banner-order" type="number" className="mt-1 h-11" min="1" step="1" value={values.order} onChange={e => change("order", Number(e.target.value))} required /></div></div>
        <label className="flex min-h-11 items-center gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-orange-700" checked={values.isActive} onChange={e => change("isActive", e.target.checked)} />Show this banner in the store</label>
        {error && <p role="alert" className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" className="h-11" onClick={onClose}>Cancel</Button><Button type="submit" className={adminAction}>{saving && <Loader2 className="animate-spin" />}{saving ? "Saving…" : banner ? "Save banner" : "Add banner"}</Button></div>
      </fieldset></form>
    </DialogContent>
  </Dialog>;
}
