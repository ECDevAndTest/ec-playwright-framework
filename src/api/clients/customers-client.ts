import type { APIRequestContext, APIResponse } from '@playwright/test';
import type {
  CreateCustomerRequest,
  StoreCustomerResponse,
} from '../types/customers-types';

export interface CustomerResult {
  response: APIResponse;
  body: StoreCustomerResponse;
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
    const response = await this.request.post('/store/customers', {
      headers: {
        'x-publishable-api-key': this.publishableApiKey,
        authorization: `Bearer ${registrationToken}`,
      },
      data: customer,
    });

    const body = (await response.json()) as StoreCustomerResponse;

    return { response, body };
  }
}
