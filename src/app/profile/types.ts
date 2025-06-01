// src/app/profile/types.ts
import { type FC } from 'react';
import type { AppUser } from '@/types/product';

export interface AddressManagerProps {
  user: AppUser;
  token: string | null;
  setUser: (u: AppUser) => void;
}

export interface PasswordManagerProps {
  token: string | null;
}

export interface PasswordStrength {
  length: boolean;
  number: boolean;
  special: boolean;
  uppercase: boolean;
  lowercase: boolean;
}

export interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
