import { apiClient } from './apiClient';
import type { BannerItem, CreateBannerPayload, UpdateBannerPayload } from '@/models/banner';

export async function getBanners(): Promise<BannerItem[]> {
  return apiClient<BannerItem[]>('/banner');
}

export async function getAllBannersAdmin(): Promise<BannerItem[]> {
  return apiClient<BannerItem[]>('/admin/banners');
}

export async function createBanner(payload: CreateBannerPayload): Promise<BannerItem> {
  return apiClient<BannerItem>('/admin/banner/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBanner(id: string, payload: UpdateBannerPayload): Promise<{ message: string; id: string }> {
  return apiClient<{ message: string; id: string }>(`/admin/banner/edit/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteBanner(id: string): Promise<{ message: string; id: string }> {
  return apiClient<{ message: string; id: string }>(`/admin/banner/delete/${id}`, {
    method: 'DELETE',
  });
}
