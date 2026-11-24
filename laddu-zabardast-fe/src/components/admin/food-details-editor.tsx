import { useState } from "react";
import { FOOD_DETAIL_FIELDS, SWEETENERS, type FoodDetails, type Sweetener, type VariantFoodDetails } from "@/models/product";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  hasVariants: boolean;
  shared: FoodDetails;
  variants: VariantFoodDetails;
  onChange: (shared: FoodDetails, variants: VariantFoodDetails) => void;
}

const choices: Sweetener[] = ["jaggery", "sugarfree", "honey"];

export function FoodDetailsEditor({ hasVariants, shared, variants, onChange }: Props) {
  const [activeChoice, setActiveChoice] = useState<Sweetener | "shared">("shared");
  const choice = hasVariants ? activeChoice : "shared";
  const values = choice === "shared" ? shared : variants[choice] ?? {};

  return (
    <fieldset className="space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-semibold">Food details</legend>
      {hasVariants && <div>
        <Label htmlFor="food-details-scope">Edit details for</Label>
        <select id="food-details-scope" value={choice} onChange={event => setActiveChoice(event.target.value as typeof choice)}
          className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="shared">Shared details</option>
          {choices.map(option => <option value={option} key={option}>{SWEETENERS[option]}</option>)}
        </select>
        <p className="mt-2 text-xs text-muted-foreground">{choice === "shared"
          ? "Only enter information that applies to every option. Set differences under the individual option."
          : "Leave a field blank to use the shared value."}</p>
      </div>}
      {FOOD_DETAIL_FIELDS.map(({ key, label, max }) => (
        <div key={key}>
          <Label htmlFor={`food-detail-${key}`}>{label}</Label>
          <Textarea id={`food-detail-${key}`} value={values[key] ?? ""} maxLength={max} rows={2}
            className="mt-1 min-h-14" placeholder={choice !== "shared" ? shared[key] : undefined}
            onChange={event => {
              const next = { ...values, [key]: event.target.value };
              if (choice === "shared") onChange(next, variants);
              else onChange(shared, { ...variants, [choice]: next });
            }} />
        </div>
      ))}
    </fieldset>
  );
}
