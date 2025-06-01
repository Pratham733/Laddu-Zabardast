//src/types/product.ts
export interface Product {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: 'laddu' | 'pickle';
  aiHint?: string;
  available?: boolean;  // Added available field
}

// ✅ Define reusable Address type
export type Address = {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
};

// ✅ Extend AppUser with addresses
export type AppUser = {
  source: 'jwt' | 'db';
  userId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  photoURL: string | null;
  role: string | null;
  isAdmin: boolean;
  picture: string | null;
  addresses: Address[];
  createdAt?: string;
};
