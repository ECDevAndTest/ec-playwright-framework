export interface StoreRegion {
  id: string;
  name: string;
  currency_code: string;
}

export interface StoreRegionListResponse {
  regions: StoreRegion[];
  count: number;
  limit: number;
  offset: number;
}

export interface StoreRegionResponse {
  region: StoreRegion;
}
