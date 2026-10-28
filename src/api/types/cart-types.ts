export interface StoreCartResponse {
  cart: StoreCart;
}

export interface AddCartLineItemRequest {
  variant_id: string;
  quantity: number;
}

export interface UpdateCartLineItemRequest {
  quantity: number;
}

export interface StoreCartLineItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  cart_id: string;
  requires_shipping: boolean;
  is_discountable: boolean;
  is_tax_inclusive: boolean;

  subtitle?: string | null;
  thumbnail?: string | null;
  product_id?: string | null;
  product_title?: string | null;
  product_description?: string | null;
  product_subtitle?: string | null;
  product_type?: string | null;
  product_collection?: string | null;
  product_handle?: string | null;
  variant_id?: string | null;
  variant_sku?: string | null;
  variant_barcode?: string | null;
  variant_title?: string | null;
  variant_option_values?: Record<string, string> | null;
  compare_at_unit_price?: number | null;
  is_giftcard?: boolean;
  is_custom_price?: boolean;

  product?: unknown;
  variant?: unknown;
  cart?: unknown;
  tax_lines?: unknown[];
  adjustments?: unknown[];
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  original_total?: number;
  original_subtotal?: number;
  original_tax_total?: number;
  item_total?: number;
  item_subtotal?: number;
  item_tax_total?: number;
  total?: number;
  subtotal?: number;
  tax_total?: number;
  discount_total?: number;
  discount_tax_total?: number;
}

export interface StoreCart {
  id: string;
  currency_code: string;
  promotions: unknown[];

  original_item_total: number;
  original_item_subtotal: number;
  original_item_tax_total: number;
  item_total: number;
  item_subtotal: number;
  item_tax_total: number;

  original_total: number;
  original_subtotal: number;
  original_tax_total: number;
  total: number;
  subtotal: number;
  tax_total: number;

  discount_total: number;
  discount_tax_total: number;
  gift_card_total: number;
  gift_card_tax_total: number;

  shipping_total: number;
  shipping_subtotal: number;
  shipping_tax_total: number;
  original_shipping_total: number;
  original_shipping_subtotal: number;
  original_shipping_tax_total: number;

  region?: unknown;
  region_id?: string;
  customer_id?: string;
  sales_channel_id?: string;
  email?: string;
  shipping_address?: unknown;
  billing_address?: unknown;
  items?: StoreCartLineItem[];
  shipping_methods?: unknown[];
  payment_collection?: unknown;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}
