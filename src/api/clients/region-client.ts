import type { APIRequestContext, APIResponse } from '@playwright/test';
import type {
  StoreRegionListResponse,
  StoreRegionResponse,
} from '../types/region-types';

export interface RegionResult<T> {
  response: APIResponse;
  body: T;
}

export class RegionClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly publishableApiKey: string,
  ) {}

  async list(): Promise<RegionResult<StoreRegionListResponse>> {
    return this.get('/store/regions');
  }

  async retrieve(id: string): Promise<RegionResult<StoreRegionResponse>> {
    return this.get(`/store/regions/${id}`);
  }

  private async get<T>(path: string): Promise<RegionResult<T>> {
    const response = await this.request.get(path, {
      headers: {
        'x-publishable-api-key': this.publishableApiKey,
      },
    });
    const body = (await response.json()) as T;

    return { response, body };
  }
}
