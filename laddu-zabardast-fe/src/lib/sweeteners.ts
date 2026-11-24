import type { CartItem } from "@/models/cart";
import { SWEETENERS, type Product, type Sweetener } from "@/models/product";

export function sweetenerOptions(product: Product) {
  if (product.category !== "laddu") return [];
  return (Object.keys(SWEETENERS) as Sweetener[]).flatMap(value => {
    const price = product.sweetenerPrices?.[value] ?? (value === "jaggery" ? product.price : undefined);
    return price === undefined ? [] : [{ value, label: SWEETENERS[value], price }];
  });
}

export function priceProductLine(product: Product & { id: string; productId?: string }, quantity: number, choice: Sweetener = "jaggery"): CartItem {
  const options = sweetenerOptions(product);
  const option = options.find(entry => entry.value === choice) ?? options[0];
  const productId = product.productId ?? product.id;
  return {
    ...product,
    id: option && option.value !== "jaggery" ? `${productId}:${option.value}` : productId,
    productId,
    quantity,
    price: option?.price ?? product.price,
    sweetener: option?.value,
    sweetenerPrices: option ? Object.fromEntries(options.map(({ value, price }) => [value, price])) : undefined,
    sweetenerUnavailable: false,
  };
}

export const sweetenerLabel = (value?: Sweetener) => value ? SWEETENERS[value] : undefined;
