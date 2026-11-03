import type { AppUser } from '../models/user';

export interface LoginResponse {
  user?: AppUser;
  token?: string;
  message?: string;
}

export interface SignupResponse {
  user?: AppUser;
  token?: string;
  message?: string;
}
