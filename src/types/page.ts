// src/types/page.ts

export interface PageParams {
  [key: string]: string;
}

export interface PageProps<T extends PageParams = PageParams> {
  params: Promise<T>;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export interface ProductPageParams extends PageParams {
  productId: string;
}
