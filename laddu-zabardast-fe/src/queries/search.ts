import { apiClient } from "@/routes/apiClient";
import type { ProductsResponse } from "@/packets";

export async function searchProducts(query: string): Promise<ProductsResponse> {
  return apiClient("/products/search", { method: "GET", params: { q: query } });
}
