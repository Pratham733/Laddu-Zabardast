import type { AppUser } from '../models/user';

export interface LoginResponse {
  user?: AppUser;
  message?: string;
}

export interface SignupResponse {
  user?: AppUser;
  message?: string;
}
