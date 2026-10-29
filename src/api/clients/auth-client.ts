import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { AuthTokenResponse } from '../types/auth-types';

export interface AuthTokenResult {
  response: APIResponse;
  body: AuthTokenResponse;
}

export class AuthClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly publishableApiKey: string,
  ) {}

  async registerCustomer(email: string, password: string): Promise<AuthTokenResult> {
    const response = await this.request.post('/auth/customer/emailpass/register', {
      headers: {
        'x-publishable-api-key': this.publishableApiKey,
      },
      data: {
        email,
        password,
      },
    });

    const body = (await response.json()) as AuthTokenResponse;

    return { response, body };
  }
}
