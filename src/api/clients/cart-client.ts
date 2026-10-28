import type { APIRequestContext, APIResponse } from '@playwright/test';
import type {
  AddCartLineItemRequest,
  StoreCartResponse,
  UpdateCartLineItemRequest,
} from '../types/cart-types';

export interface CartResult {
  response: APIResponse;
  body: StoreCartResponse;
}

export class CartClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly publishableApiKey: string,
  ) {}

  async create(): Promise<CartResult> {
    const response = await this.request.post('/store/carts', {
      headers: {
        'x-publishable-api-key': this.publishableApiKey,
      },
    });

    const body = (await response.json()) as StoreCartResponse;

    return { response, body };
  }

  async addItem(
    cartId: string,
    variantId: string,
    quantity = 1,
  ): Promise<CartResult> {
    const data: AddCartLineItemRequest = {
      variant_id: variantId,
      quantity,
    };

    const response = await this.request.post(
      `/store/carts/${cartId}/line-items`,
      {
        headers: {
          'x-publishable-api-key': this.publishableApiKey,
        },
        data,
      },
    );

    const body = (await response.json()) as StoreCartResponse;

    return { response, body };
  }

  async updateItem(
    cartId: string,
    lineItemId: string,
    quantity: number,
  ): Promise<CartResult> {
    const data: UpdateCartLineItemRequest = { quantity };

    const response = await this.request.post(
      `/store/carts/${cartId}/line-items/${lineItemId}`,
      {
        headers: {
          'x-publishable-api-key': this.publishableApiKey,
        },
        data,
      },
    );

    const body = (await response.json()) as StoreCartResponse;

    return { response, body };
  }

  async complete(cartId: string): Promise<CartResult> {
    const response = await this.request.post(`/store/carts/${cartId}/complete`, {
      headers: {
        'x-publishable-api-key': this.publishableApiKey,
      },
    });

    const body = (await response.json()) as StoreCartResponse;

    return { response, body };
  }

  async get(cartId: string): Promise<CartResult> {
    const response = await this.request.get(`/store/carts/${cartId}`, {
      headers: {
        'x-publishable-api-key': this.publishableApiKey,
      },
    });

    const body = (await response.json()) as StoreCartResponse;

    return { response, body };
  }
}