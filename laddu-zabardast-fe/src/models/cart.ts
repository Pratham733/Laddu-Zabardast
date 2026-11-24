import type { LadduBox } from './box';
import type { Product, Sweetener } from './product';

export interface CartItem extends Product {
  id: string; // force id to be required
  productId?: string;
  sweetener?: Sweetener;
  sweetenerUnavailable?: boolean;
  quantity: number;
  box?: LadduBox;
}
