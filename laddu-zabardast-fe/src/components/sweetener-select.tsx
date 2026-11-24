import type { Product, Sweetener } from "@/models/product";
import { sweetenerLabel, sweetenerOptions } from "@/lib/sweeteners";
import { formatMoney } from "@/lib/store-display";

interface Props {
  product: Product;
  value?: Sweetener;
  unavailable?: boolean;
  disabled?: boolean;
  onChange: (value: Sweetener) => void;
}

export function SweetenerSelect({ product, value = "jaggery", unavailable, disabled, onChange }: Props) {
  const options = sweetenerOptions(product);
  if (!options.length && !unavailable) return null;
  return <label className="block min-w-0 max-w-xs text-sm font-medium">
    <span>Sweetener</span>
    <select aria-label={`Sweetener for ${product.name}`} value={value} disabled={disabled}
      className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onChange={event => onChange(event.target.value as Sweetener)}>
      {unavailable && <option value={value} disabled>{sweetenerLabel(value) ?? "Selected option"} (unavailable)</option>}
      {options.map(option => <option key={option.value} value={option.value}>
        {option.label} · {formatMoney(option.price)} each
      </option>)}
    </select>
  </label>;
}
