import type { APIRequestContext, APIResponse } from '@playwright/test';
import type {
  OrderTransferToken,
  RequestOrderTransfer,
  StoreOrderListResponse,
  StoreOrderResponse,
} from '../types/order-types';

export interface OrderResult<T = StoreOrderResponse> {
  response: APIResponse;
  body: T;
}

export class OrderClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly publishableApiKey: string,
  ) {}

  list(customerToken: string): Promise<OrderResult<StoreOrderListResponse>> {
    return this.send('get', '/store/orders', { token: customerToken });
  }

  get(orderId: string, customerToken?: string): Promise<OrderResult> {
    return this.send('get', `/store/orders/${orderId}`, { token: customerToken });
  }

  requestTransfer(
    orderId: string,
    customerToken: string,
    transfer: RequestOrderTransfer = {},
  ): Promise<OrderResult> {
    return this.send('post', `/store/orders/${orderId}/transfer/request`, {
      token: customerToken,
      data: transfer,
    });
  }

  acceptTransfer(orderId: string, transfer: OrderTransferToken): Promise<OrderResult> {
    return this.send('post', `/store/orders/${orderId}/transfer/accept`, {
      data: transfer,
    });
  }

  declineTransfer(orderId: string, transfer: OrderTransferToken): Promise<OrderResult> {
    return this.send('post', `/store/orders/${orderId}/transfer/decline`, {
      data: transfer,
    });
  }

  cancelTransfer(orderId: string, customerToken: string): Promise<OrderResult> {
    return this.send('post', `/store/orders/${orderId}/transfer/cancel`, {
      token: customerToken,
    });
  }

  private async send<T>(
    method: 'get' | 'post',
    path: string,
    options: { token?: string; data?: unknown } = {},
  ): Promise<OrderResult<T>> {
    const headers: Record<string, string> = {
      'x-publishable-api-key': this.publishableApiKey,
    };

    if (options.token) {
      headers.authorization = `Bearer ${options.token}`;
    }

    const response = await this.request[method](path, {
      headers,
      data: options.data,
    });
    const body = (await response.json()) as T;

    return { response, body };
  }
}
