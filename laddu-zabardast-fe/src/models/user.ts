export type Address = {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
};

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
