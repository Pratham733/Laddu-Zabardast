import type { LadduBox } from './box';
import type { Product } from './product';

export interface CartItem extends Product {
  id: string; // force id to be required
  quantity: number;
  box?: LadduBox;
}
