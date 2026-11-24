import type { Sweetener } from "../models/product";
import type { LadduBox } from '../models/box';
import type { CartItem } from '../models/cart';

export interface CartResponse {
  items: CartItem[];
}

export type CartLineInput = { quantity: number } & (
  | { productId: string; sweetener?: Sweetener; box?: never }
  | { box: LadduBox; productId?: never; sweetener?: never }
);

export function cartLineInput(item: CartItem): CartLineInput {
  return item.box
    ? { box: item.box, quantity: item.quantity }
    : { productId: item.productId ?? item.id, quantity: item.quantity, sweetener: item.sweetener };
}
