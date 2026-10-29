import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { StoreCartResponse } from '../types/cart-types';

export interface PromotionResult {
  response: APIResponse;
  body: StoreCartResponse;
}

export class PromotionClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly publishableApiKey: string,
  ) {}

  add(cartId: string, promoCodes: string[]): Promise<PromotionResult> {
    return this.send('post', cartId, promoCodes);
  }

  remove(cartId: string, promoCodes: string[]): Promise<PromotionResult> {
    return this.send('delete', cartId, promoCodes);
  }

  private async send(
    method: 'post' | 'delete',
    cartId: string,
    promoCodes: string[],
  ): Promise<PromotionResult> {
    const response = await this.request[method](`/store/carts/${cartId}/promotions`, {
      headers: {
        'x-publishable-api-key': this.publishableApiKey,
      },
      data: {
        promo_codes: promoCodes,
      },
    });
    const body = (await response.json()) as StoreCartResponse;

    return { response, body };
  }
}
