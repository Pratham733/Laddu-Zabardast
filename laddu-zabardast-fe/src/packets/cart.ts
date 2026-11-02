import type { CartItem } from '../models/cart';

export interface CartResponse {
  items: CartItem[];
}
