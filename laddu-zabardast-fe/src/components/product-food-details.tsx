import { FOOD_DETAIL_FIELDS, type Product, type Sweetener } from "@/models/product";

export function ProductFoodDetails({ product, sweetener }: { product: Product; sweetener?: Sweetener }) {
  const selected = sweetener ? product.variantDetails?.[sweetener] : undefined;
  const fields = FOOD_DETAIL_FIELDS.flatMap(({ key, label }) => {
    const value = selected?.[key]?.trim() || product.foodDetails?.[key]?.trim();
    return value ? [{ key, label, value }] : [];
  });
  if (!fields.length) return null;
  return (
    <section aria-label="Food details" className="mb-4 rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-semibold">Food details</h2>
      <dl className="space-y-2 text-sm">{fields.map(({ key, label, value }) => (
        <div key={key}>
          <dt className="font-medium">{label}</dt>
          <dd className="whitespace-pre-wrap break-words text-muted-foreground">{value}</dd>
        </div>
      ))}</dl>
    </section>
  );
}
