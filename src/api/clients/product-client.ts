import type { APIRequestContext, APIResponse } from '@playwright/test';
import type {
  ProductQuery,
  StoreProductListResponse,
  StoreProductResponse,
} from '../types/product-types';

export interface ProductResult<T = StoreProductListResponse> {
  response: APIResponse;
  body: T;
}

export type ProductListResult = ProductResult<StoreProductListResponse>;

export class ProductClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly publishableApiKey: string,
  ) {}

  list(query: ProductQuery = {}): Promise<ProductListResult> {
    return this.get('/store/products', query);
  }

  retrieve(id: string, query: ProductQuery = {}): Promise<ProductResult<StoreProductResponse>> {
    return this.get(`/store/products/${id}`, query);
  }

  findByHandle(handle: string): Promise<ProductListResult> {
    return this.list({
      handle,
      fields: 'id,title,handle,*variants',
    });
  }

  private async get<T>(path: string, query: ProductQuery = {}): Promise<ProductResult<T>> {
    const params: Record<string, string> = {};

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = String(value);
      }
    }

    const response = await this.request.get(path, {
      headers: {
        'x-publishable-api-key': this.publishableApiKey,
      },
      params,
    });
    const body = (await response.json()) as T;

    return { response, body };
  }
}
