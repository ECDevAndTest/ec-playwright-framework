export interface StoreOrder {
  id: string;
  status: string;
  email: string;
}

export interface StoreOrderResponse {
  order: StoreOrder;
}

export interface StoreOrderListResponse {
  orders: StoreOrder[];
}

export interface RequestOrderTransfer {
  description?: string;
}

export interface OrderTransferToken {
  token: string;
}
