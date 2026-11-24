export const SWEETENERS = { jaggery: "Jaggery", sugarfree: "Sugar-free", honey: "Honey" } as const;
export type Sweetener = keyof typeof SWEETENERS;
export type SweetenerPrices = Partial<Record<Sweetener, number>>;
export interface FoodDetails {
  ingredients?: string;
  allergens?: string;
  shelfLife?: string;
  storage?: string;
}
export type VariantFoodDetails = Partial<Record<Sweetener, FoodDetails>>;

export const FOOD_DETAIL_FIELDS = [
  { key: "ingredients", label: "Ingredients", max: 1000 },
  { key: "allergens", label: "Allergen information", max: 500 },
  { key: "shelfLife", label: "Shelf life", max: 120 },
  { key: "storage", label: "Storage instructions", max: 500 },
] as const;

export interface Product {
  bestSeller?: boolean;
  newArrival?: boolean;
  sweetenerPrices?: SweetenerPrices;
  foodDetails?: FoodDetails;
  variantDetails?: VariantFoodDetails;
  id?: string;
  key?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: 'laddu' | 'pickle' | 'gift';
  aiHint?: string;
  weight?: string;
  available?: boolean;  
}
