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

export interface UpdateCustomerRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
}
