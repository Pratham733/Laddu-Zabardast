import type { Product } from '../models/product';

export interface ProductsResponse {
  products: Product[];
}

export interface SingleProductResponse {
  product: Product;
}

export interface UploadImageResponse {
  url: string;
}
