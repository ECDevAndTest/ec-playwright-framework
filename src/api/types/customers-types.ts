export interface StoreCustomer {
  id: string;
  email: string;
}

export interface StoreCustomerResponse {
  customer: StoreCustomer;
}

export interface CreateCustomerRequest {
  email: string;
}
