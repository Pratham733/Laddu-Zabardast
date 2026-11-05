import { apiClient } from "@/routes/apiClient";
import type { Address } from "@/models";

export const getProfile = async (): Promise<any> => {
  return apiClient("/profile", { method: "GET" });
};

export const getUser = async (): Promise<any> => {
  return apiClient("/user", { method: "GET" });
};

export const getAddresses = async (token?: string): Promise<{ addresses: Address[] }> => {
  return apiClient("/address", { method: "GET" });
};
