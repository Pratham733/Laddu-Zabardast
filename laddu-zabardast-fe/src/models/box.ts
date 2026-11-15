export const LADDU_BOX_SIZES = [9, 16] as const;

export type LadduBoxSize = (typeof LADDU_BOX_SIZES)[number];

export interface LadduBox {
  size: LadduBoxSize;
  items: {
    productId: string;
    quantity: number;
    name?: string;
  }[];
}
