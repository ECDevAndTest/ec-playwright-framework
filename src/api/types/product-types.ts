export interface StoreProductVariant {
  id: string;
  title: string;
  sku?: string | null;
}

export interface StoreProduct {
  id: string;
  title: string;
  handle: string;
  variants?: StoreProductVariant[];
}

export interface StoreProductListResponse {
  products: StoreProduct[];
  count: number;
  limit: number;
  offset: number;
}

export interface StoreProductResponse {
  product: StoreProduct;
}

export interface ProductQuery {
  limit?: number | string;
  offset?: number | string;
  q?: string;
  order?: string;
  handle?: string;
  fields?: string;
}
