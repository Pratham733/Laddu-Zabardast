import type { LadduBox } from '../models/box';
import type { CartItem } from '../models/cart';

export interface CartResponse {
  items: (CartItem & { productId?: string })[];
}

export type CartLineInput = { quantity: number } & (
  | { productId: string; box?: never }
  | { box: LadduBox; productId?: never }
);

export function cartLineInput(item: CartItem): CartLineInput {
  return item.box
    ? { box: item.box, quantity: item.quantity }
    : { productId: item.id, quantity: item.quantity };
}
