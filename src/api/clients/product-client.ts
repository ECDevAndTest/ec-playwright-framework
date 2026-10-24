import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { StoreProductListResponse } from '../types/product-types';

export interface ProductListResult {
  response: APIResponse;
  body: StoreProductListResponse;
}

export class ProductClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly publishableApiKey: string,
  ) {}

  async findByHandle(handle: string): Promise<ProductListResult> {
    const response = await this.request.get('/store/products', {
      headers: {
        'x-publishable-api-key': this.publishableApiKey,
      },
      params: {
        handle,
        fields: 'id,title,handle,*variants',
      },
    });

    const body = (await response.json()) as StoreProductListResponse;

    return { response, body };
  }
}
