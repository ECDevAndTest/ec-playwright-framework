import type { APIRequestContext, APIResponse } from '@playwright/test';
import type {
  CreateCustomerRequest,
  StoreCustomerResponse,
  UpdateCustomerRequest,
} from '../types/customers-types';

export interface CustomerResult<T = StoreCustomerResponse> {
  response: APIResponse;
  body: T;
}

export class CustomerClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly publishableApiKey: string,
  ) {}

  async create(
    registrationToken: string,
    customer: CreateCustomerRequest,
  ): Promise<CustomerResult> {
    return this.send('post', '/store/customers', {
      token: registrationToken,
      data: customer,
    });
  }

  async getMe(): Promise<CustomerResult<unknown>> {
    return this.send('get', '/store/customers/me');
  }

  async updateMe(
    token: string,
    customer: UpdateCustomerRequest,
  ): Promise<CustomerResult<unknown>> {
    return this.send('post', '/store/customers/me', {
      token,
      data: customer,
    });
  }

  async listAddresses(token: string): Promise<CustomerResult<unknown>> {
    return this.send('get', '/store/customers/me/addresses', { token });
  }

  private async send<T>(
    method: 'get' | 'post',
    path: string,
    options: { token?: string; data?: unknown } = {},
  ): Promise<CustomerResult<T>> {
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
