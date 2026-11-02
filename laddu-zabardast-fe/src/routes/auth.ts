import { apiClient } from './apiClient';
import type { LoginResponse, SignupResponse } from '@/packets';

export async function login(data: any, signal?: AbortSignal): Promise<LoginResponse> {
  return apiClient('/login', {
    method: 'POST',
    body: JSON.stringify(data),
    signal,
  });
}

export async function signup(data: any): Promise<SignupResponse> {
  return apiClient('/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<any> {
  return apiClient('/logout', { method: 'POST' });
}

export async function getProfile(): Promise<any> {
  return apiClient('/profile', {
    method: 'GET',
  });
}

export async function getUser(): Promise<any> {
  return apiClient('/user', {
    method: 'GET',
  });
}

export async function updateProfile(data: any): Promise<any> {
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
