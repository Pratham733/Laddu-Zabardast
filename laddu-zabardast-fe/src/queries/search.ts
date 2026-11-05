import { ProductsResponse } from "@/packets/product";
import { apiClient } from "@/routes/apiClient";

export async function searchProducts(query: string): Promise<ProductsResponse> {
  return apiClient("/products/search", { method: "GET", params: { q: query } });
}
