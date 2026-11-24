import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Package, Plus, Search, X } from "lucide-react";
import Image from "next/image";
import { Container } from "@/components/ui/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button-new";
import { useCart } from "@/hooks";
import { LADDU_BOX_SIZES, type LadduBoxSize, type Product } from "@/models";
import { getProducts } from "@/routes/products";

type AvailableLaddu = Product & { id: string };

function searchTerms(text: string): string[] {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

export default function BuildABoxPage() {
  const navigate = useNavigate();
  const { addBox, isInitialised } = useCart();
  const [size, setSize] = useState<LadduBoxSize>();
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [laddus, setLaddus] = useState<AvailableLaddu[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;
    getProducts("laddu")
      .then(({ products }) => {
        if (!active) return;
        setLaddus(products.filter((p): p is AvailableLaddu =>
          Boolean(p.id) && p.category === "laddu" && p.available !== false && p.price > 0
        ));
      })
      .catch(() => { if (active) setCatalogError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const query = searchTerms(search);
  const matchingLaddus = laddus.filter((laddu) => {
    const keywords = searchTerms([laddu.name, laddu.description, laddu.key, "laddu laddoo"].join(" ")).join(" ");
    return query.every((term) => keywords.includes(term));
  });
  const count = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  const total = laddus.reduce((sum, laddu) =>
    sum + Math.round(laddu.price * 100) * (quantities[laddu.id] ?? 0), 0
  ) / 100;

  const changeQuantity = (productId: string, change: number) => {
    if (!size) return;
    setSaveError("");
    setQuantities((current) => {
      const total = Object.values(current).reduce((sum, quantity) => sum + quantity, 0);
      const next = (current[productId] ?? 0) + change;
      if (next < 0 || total + change > size) return current;
      return { ...current, [productId]: next };
    });
  };

  const addToCart = async () => {
    if (!size || count !== size || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await addBox({
        size,
        items: laddus.filter((laddu) => quantities[laddu.id] > 0)
          .map((laddu) => ({ productId: laddu.id, quantity: quantities[laddu.id] })),
      });
      navigate("/cart");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not add the box.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="max-w-3xl px-4 py-5 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Build your laddu box</h1>
      <fieldset className="mt-6" disabled={saving}>
        <legend className="mb-3 text-base font-semibold">Choose a box size</legend>
        <div className="grid grid-cols-2 gap-3">
          {LADDU_BOX_SIZES.map((capacity) => (
            <label key={capacity} className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border bg-card p-3 text-sm has-[:checked]:border-primary sm:gap-3 sm:p-4 sm:text-base">
              <input
                type="radio"
                name="box-size"
                className="accent-primary"
                checked={capacity === size}
                onChange={() => {
                  setSize(capacity);
                  setQuantities({});
                  setSaveError("");
                }}
              />
              <Package aria-hidden="true" className="hidden h-5 w-5 shrink-0 text-primary min-[360px]:block" />
              <span>Box of {capacity}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {size && (
        <section aria-labelledby="choose-laddus" className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
            <h2 id="choose-laddus" className="text-xl font-semibold">Choose your laddus</h2>
            <p aria-live="polite" className="text-sm font-medium tabular-nums">{count} of {size} selected</p>
          </div>
          {loading && <p role="status" className="py-4">Loading laddus…</p>}
          {catalogError && <p role="alert" className="py-4 text-destructive">Could not load laddus. Refresh to try again.</p>}
          {!loading && !catalogError && laddus.length === 0 && <p className="py-4">No laddus are available right now.</p>}
          {!loading && laddus.length > 0 && (
            <div className="relative my-3">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search laddus"
                placeholder="Search laddus"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear laddu search"
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch("")}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {laddus.length > 0 && matchingLaddus.length === 0 && (
            <p role="status" className="py-4 text-muted-foreground">No available laddus match your search.</p>
          )}
          <ul className="divide-y">
            {matchingLaddus.map((laddu) => (
              <li key={laddu.id} className="flex items-center gap-2 py-3 sm:gap-4">
                {laddu.imageUrl && (
                  <Image src={laddu.imageUrl} alt="" width={52} height={52} className="h-12 w-12 shrink-0 rounded-md object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium">{laddu.name}</p>
                  <p className="text-sm text-muted-foreground">₹{laddu.price.toFixed(2)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11" aria-label={`Remove one ${laddu.name}`}
                    disabled={saving || !quantities[laddu.id]} onClick={() => changeQuantity(laddu.id, -1)}>
                    <Minus aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <span className="min-w-5 text-center tabular-nums">{quantities[laddu.id] ?? 0}</span>
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11" aria-label={`Add one ${laddu.name}`}
                    disabled={saving || count >= size} onClick={() => changeQuantity(laddu.id, 1)}>
                    <Plus aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="font-semibold tabular-nums">Box total ₹{total.toFixed(2)}</p>
            <Button type="button" disabled={!isInitialised || saving || count !== size} onClick={addToCart}>
              {saving ? "Adding box…" : "Add box to cart"}
            </Button>
          </div>
          {saveError && <p role="alert" className="mt-3 text-sm text-destructive">{saveError}</p>}
        </section>
      )}
    </Container>
  );
}
