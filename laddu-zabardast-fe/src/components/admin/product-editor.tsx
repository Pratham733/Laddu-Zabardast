import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { Loader2, ImagePlus } from "lucide-react";
import { FoodDetailsEditor } from "./food-details-editor";
import { SWEETENERS, type FoodDetails, type Product, type SweetenerPrices, type VariantFoodDetails } from "@/models/product";
import { uploadProductImage } from "@/routes/products";
import { Button } from "@/components/ui/button-new";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { errorMessage } from "@/lib/store-display";

interface Props { product: Product | null; onClose: () => void; onSave: (value: Omit<Product, "id">) => Promise<void> }
const imageExtensions = /\.(jpe?g|png|webp)$/i;
const maxImageSize = 10 * 1024 * 1024;
export const adminSelect = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
export const adminAction = "h-11 rounded-lg bg-orange-700 text-white shadow-none hover:bg-orange-800";

export function ProductEditor({ product, onClose, onSave }: Props) {
  const [values, setValues] = useState({ name: product?.name || "", price: String(product?.price ?? ""), category: product?.category || "laddu", description: product?.description || "", weight: product?.weight || "", imageUrl: product?.imageUrl || "", available: product?.available !== false, bestSeller: !!product?.bestSeller, newArrival: !!product?.newArrival });
  const [variantPrices, setVariantPrices] = useState({
    sugarfree: String(product?.sweetenerPrices?.sugarfree ?? ""),
    honey: String(product?.sweetenerPrices?.honey ?? ""),
  });
  const [food, setFood] = useState<{ shared: FoodDetails; variants: VariantFoodDetails }>({
    shared: product?.foodDetails ?? {}, variants: product?.variantDetails ?? {},
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const uploaded = useRef<{ file: File; url: string }>();
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const change = (key: keyof typeof values, value: string | boolean) => setValues(current => ({ ...current, [key]: value }));

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (!imageExtensions.test(picked.name)) {
      setImageError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (picked.size === 0 || picked.size > maxImageSize) {
      setImageError(picked.size === 0 ? "This image is empty. Choose another photo." : "Choose an image up to 10 MB.");
      return;
    }
    setImageError("");
    setFile(picked);
  }

  function clearImage() {
    setFile(undefined);
    setImageError("");
    uploaded.current = undefined;
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const price = Number(values.price);
    if (!values.name.trim() || !Number.isFinite(price) || price <= 0) { setError("Enter a product name and a price greater than zero."); return; }
    if (!file && !values.imageUrl.trim()) { setError("Add an image URL or choose an image file."); return; }
    const sweetenerPrices: SweetenerPrices = {};
    if (values.category === "laddu") {
      for (const option of ["sugarfree", "honey"] as const) {
        if (!variantPrices[option]) continue;
        const optionPrice = Number(variantPrices[option]);
        if (!Number.isFinite(optionPrice) || optionPrice < 0.01) {
          setError(`Enter a positive price for ${SWEETENERS[option]}.`);
          return;
        }
        sweetenerPrices[option] = optionPrice;
      }
    }
    setSaving(true);
    try {
      let imageUrl = values.imageUrl.trim();
      if (file) {
        if (uploaded.current?.file !== file) {
          setUploading(true);
          try {
            uploaded.current = { file, url: (await uploadProductImage(file)).imageUrl };
          } finally {
            setUploading(false);
          }
        }
        imageUrl = uploaded.current.url;
      }
      await onSave({ ...values, name: values.name.trim(), description: values.description.trim(), weight: values.weight.trim(), imageUrl, price, sweetenerPrices, foodDetails: food.shared, variantDetails: values.category === "laddu" ? food.variants : {} });
      onClose();
    } catch (reason) { setError(errorMessage(reason, "Could not save this product. Please try again.")); }
    finally { setSaving(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl">
      <DialogHeader><DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle><DialogDescription>Set the details customers see in your store.</DialogDescription></DialogHeader>
      <form onSubmit={submit} aria-busy={saving}>
        <fieldset disabled={saving} className="space-y-4">
          <div><Label htmlFor="product-name">Product name</Label><Input id="product-name" className="mt-1 h-11" value={values.name} onChange={e => change("name", e.target.value)} required maxLength={150} placeholder="e.g. Besan Laddu" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="product-price">{values.category === "laddu" ? "Jaggery price (₹)" : "Price (₹)"}</Label><Input id="product-price" className="mt-1 h-11" type="number" min="0.01" step="0.01" value={values.price} onChange={e => change("price", e.target.value)} required /></div>
            <div><Label htmlFor="product-category">Category</Label><select id="product-category" className={`mt-1 ${adminSelect}`} value={values.category} onChange={e => change("category", e.target.value)}><option value="laddu">Laddus</option><option value="pickle">Pickles</option><option value="gift">Gift boxes</option></select></div>
          </div>
          {values.category === "laddu" && <fieldset className="rounded-lg border p-3">
            <legend className="px-1 text-sm font-semibold">Additional sweeteners</legend>
            <p className="mb-3 text-xs text-muted-foreground">Jaggery is the default. Enter a price to offer an option, or leave it blank to hide it.</p>
            <div className="grid grid-cols-2 gap-3">
              {(["sugarfree", "honey"] as const).map(option => <div key={option}>
                <Label htmlFor={`price-${option}`}>{SWEETENERS[option]} price (₹)</Label>
                <Input id={`price-${option}`} type="number" min="0.01" step="0.01" className="mt-1 h-11"
                  value={variantPrices[option]} onChange={event => setVariantPrices(current => ({ ...current, [option]: event.target.value }))} />
              </div>)}
            </div>
          </fieldset>}
          <fieldset className="rounded-lg border px-3 pb-2">
            <legend className="px-1 text-sm font-semibold">Home collections</legend>
            <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-orange-700" checked={values.bestSeller} onChange={event => change("bestSeller", event.target.checked)} />Best Sellers</label>
            <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-orange-700" checked={values.newArrival} onChange={event => change("newArrival", event.target.checked)} />New Arrivals</label>
          </fieldset>
          <div><Label htmlFor="product-weight">Pack size / weight (optional)</Label><Input id="product-weight" className="mt-1 h-11" value={values.weight} onChange={e => change("weight", e.target.value)} placeholder="e.g. 250 g" /></div>
          <div><Label htmlFor="product-description">Description</Label><Textarea id="product-description" className="mt-1 min-h-24" value={values.description} onChange={e => change("description", e.target.value)} required /></div>
          <FoodDetailsEditor hasVariants={values.category === "laddu"} shared={food.shared} variants={food.variants}
            onChange={(shared, variants) => setFood({ shared, variants })} />
          <div className="space-y-3 rounded-xl border p-4">
            <h3 className="text-sm font-semibold">Product image</h3>
            {(file ? preview : values.imageUrl) && <Image src={file ? preview : values.imageUrl} alt="Product image preview" width={96} height={96} className="h-24 w-24 rounded-xl border object-cover" />}
            <input ref={fileInput} id="product-image-file" type="file" hidden
              accept="image/jpeg,image/png,image/webp" onChange={chooseImage} />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="h-11 rounded-xl shadow-none" onClick={() => fileInput.current?.click()}>
                <ImagePlus aria-hidden="true" />{file ? "Choose another photo" : "Choose from device"}
              </Button>
              {file && <Button type="button" variant="ghost" className="h-11 rounded-xl" onClick={clearImage}>Remove selection</Button>}
            </div>
            <p className="break-all text-xs text-muted-foreground">{file ? file.name : "JPG, PNG or WebP, up to 10 MB."}</p>
            {imageError && <p role="alert" className="text-sm text-destructive">{imageError}</p>}
            {!file && <div>
              <Label htmlFor="product-image-url">Or enter an image URL</Label>
              <Input id="product-image-url" className="mt-1 h-11" value={values.imageUrl} onChange={e => change("imageUrl", e.target.value)} placeholder="https://… or /images/…" />
            </div>}
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={values.available} onChange={e => change("available", e.target.checked)} className="h-4 w-4 accent-orange-700" />Available for customers to order</label>
          {error && <p role="alert" className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" className="h-11" onClick={onClose}>Cancel</Button><Button type="submit" className={adminAction}>{saving && <Loader2 className="animate-spin" />}{uploading ? "Uploading photo…" : saving ? "Saving…" : product ? "Save product" : "Add product"}</Button></div>
        </fieldset>
      </form>
    </DialogContent>
  </Dialog>;
}
