import { Capacitor } from "@capacitor/core";
import { clearNativeToken, getNativeToken, saveNativeToken } from "@/mobile/session";
import { apiClient } from './apiClient';
import type { AppUser } from '@/models';
import type { LoginResponse, SignupResponse } from '@/packets/auth';

export async function login(data: any, signal?: AbortSignal): Promise<LoginResponse> {
  const result = await apiClient<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(data),
    signal,
  });
  await saveNativeToken(result.token);
  return result;
}

export async function signup(data: any): Promise<SignupResponse> {
  const result = await apiClient<SignupResponse>('/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await saveNativeToken(result.token);
  return result;
}

export async function logout(): Promise<any> {
  try {
    return await apiClient('/logout', { method: 'POST' });
  } finally {
    await clearNativeToken();
  }
}

export async function getProfile(): Promise<{ user: AppUser }> {
  return apiClient('/profile', {
    method: 'GET',
  });
}

export async function getUser(): Promise<{ user: AppUser }> {
  if (Capacitor.isNativePlatform() && !(await getNativeToken())) {
    throw new Error("Sign in to continue.");
  }
  return apiClient('/user', {
    method: 'GET',
  });
}

export async function updateProfile(data: Partial<Pick<AppUser, "firstName" | "lastName"> & { phone: string }>): Promise<{ user: AppUser; message: string }> {
  return apiClient('/update-profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: any): Promise<any> {
  return apiClient('/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function requestPasswordReset(email: string) {
  return apiClient<{ message: string }>("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string) {
  return apiClient<{ message: string }>("/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
