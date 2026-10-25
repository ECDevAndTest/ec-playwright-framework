export type SmokeMethod = 'GET' | 'POST' | 'DELETE';

export type StoreSmokeEndpoint = {
  method: SmokeMethod;
  path: string;
  expectedStatus: number;
  body?: Record<string, unknown>;
  knownDefect?: string;
};

const missingId = 'smoke_missing';

/**
 * One call per mounted Store and Auth route.
 * Requests use an unknown id or an invalid body, so the check proves the route
 * is mounted without creating carts, customers, or orders.
 *
 * GET /store/locales is omitted. Medusa disables that route unless the
 * translation feature flag is on.
 */
export const storeSmokeEndpoints: StoreSmokeEndpoint[] = [
  { method: 'GET', path: '/health', expectedStatus: 200 },
  { method: 'GET', path: '/store/custom', expectedStatus: 200 },

  { method: 'GET', path: '/store/products', expectedStatus: 200 },
  { method: 'GET', path: `/store/products/${missingId}`, expectedStatus: 404 },
  { method: 'GET', path: '/store/collections', expectedStatus: 200 },
  {
    method: 'GET',
    path: `/store/collections/${missingId}`,
    expectedStatus: 404,
  },
  { method: 'GET', path: '/store/regions', expectedStatus: 200 },
  { method: 'GET', path: `/store/regions/${missingId}`, expectedStatus: 404 },
  { method: 'GET', path: '/store/currencies', expectedStatus: 200 },
  { method: 'GET', path: '/store/currencies/usd', expectedStatus: 200 },
  { method: 'GET', path: '/store/currencies/zz', expectedStatus: 404 },
  { method: 'GET', path: '/store/product-categories', expectedStatus: 200 },
  {
    method: 'GET',
    path: `/store/product-categories/${missingId}`,
    expectedStatus: 200,
  },
  { method: 'GET', path: '/store/product-options', expectedStatus: 200 },
  {
    method: 'GET',
    path: `/store/product-options/${missingId}`,
    expectedStatus: 404,
  },
  { method: 'GET', path: '/store/product-tags', expectedStatus: 200 },
  { method: 'GET', path: `/store/product-tags/${missingId}`, expectedStatus: 404 },
  { method: 'GET', path: '/store/product-types', expectedStatus: 200 },
  {
    method: 'GET',
    path: `/store/product-types/${missingId}`,
    expectedStatus: 404,
  },
  { method: 'GET', path: '/store/product-variants', expectedStatus: 200 },
  {
    method: 'GET',
    path: `/store/product-variants/${missingId}`,
    expectedStatus: 404,
  },
  { method: 'GET', path: '/store/return-reasons', expectedStatus: 200 },
  {
    method: 'GET',
    path: `/store/return-reasons/${missingId}`,
    expectedStatus: 200,
  },
  { method: 'GET', path: '/store/payment-providers', expectedStatus: 400 },
  { method: 'GET', path: '/store/shipping-options', expectedStatus: 400 },
  { method: 'GET', path: '/store/orders', expectedStatus: 401 },
  { method: 'GET', path: `/store/orders/${missingId}`, expectedStatus: 404 },
  { method: 'GET', path: '/store/customers/me', expectedStatus: 401 },
  { method: 'GET', path: '/store/customers/me/addresses', expectedStatus: 401 },
  {
    method: 'GET',
    path: `/store/customers/me/addresses/${missingId}`,
    expectedStatus: 401,
  },
  { method: 'GET', path: `/store/carts/${missingId}`, expectedStatus: 404 },

  {
    method: 'POST',
    path: '/store/carts',
    body: { email: 'not-an-email' },
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: `/store/carts/${missingId}`,
    body: {},
    expectedStatus: 404,
  },
  {
    method: 'POST',
    path: `/store/carts/${missingId}/complete`,
    body: {},
    expectedStatus: 404,
  },
  {
    method: 'POST',
    path: `/store/carts/${missingId}/customer`,
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: `/store/carts/${missingId}/line-items`,
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: `/store/carts/${missingId}/line-items/${missingId}`,
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'DELETE',
    path: `/store/carts/${missingId}/line-items/${missingId}`,
    expectedStatus: 404,
    knownDefect:
      'Medusa returns 500 when deleting a line item from a cart that does not exist',
  },
  {
    method: 'POST',
    path: `/store/carts/${missingId}/promotions`,
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'DELETE',
    path: `/store/carts/${missingId}/promotions`,
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: `/store/carts/${missingId}/shipping-methods`,
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: `/store/carts/${missingId}/taxes`,
    body: {},
    expectedStatus: 404,
  },
  { method: 'POST', path: '/store/customers', body: {}, expectedStatus: 401 },
  {
    method: 'POST',
    path: '/store/customers/me',
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: '/store/customers/me/addresses',
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: `/store/customers/me/addresses/${missingId}`,
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'DELETE',
    path: `/store/customers/me/addresses/${missingId}`,
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: '/store/payment-collections',
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: `/store/payment-collections/${missingId}/payment-sessions`,
    body: {},
    expectedStatus: 400,
  },
  { method: 'POST', path: '/store/returns', body: {}, expectedStatus: 400 },
  { method: 'POST', path: '/store/search', body: {}, expectedStatus: 400 },
  {
    method: 'POST',
    path: `/store/shipping-options/${missingId}/calculate`,
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: `/store/orders/${missingId}/transfer/request`,
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: `/store/orders/${missingId}/transfer/accept`,
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: `/store/orders/${missingId}/transfer/decline`,
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: `/store/orders/${missingId}/transfer/cancel`,
    body: {},
    expectedStatus: 401,
  },

  { method: 'GET', path: '/auth/customer/providers', expectedStatus: 200 },
  { method: 'GET', path: '/auth/user/providers', expectedStatus: 200 },
  { method: 'GET', path: '/auth/customer/emailpass', expectedStatus: 401 },
  { method: 'GET', path: '/auth/user/emailpass', expectedStatus: 401 },
  {
    method: 'POST',
    path: '/auth/customer/emailpass',
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: '/auth/customer/emailpass/register',
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'GET',
    path: '/auth/customer/emailpass/callback',
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: '/auth/customer/emailpass/callback',
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: '/auth/customer/emailpass/reset-password',
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: '/auth/customer/emailpass/update',
    body: {},
    expectedStatus: 401,
  },
  { method: 'POST', path: '/auth/session', body: {}, expectedStatus: 401 },
  { method: 'DELETE', path: '/auth/session', expectedStatus: 401 },
  { method: 'POST', path: '/auth/token/refresh', body: {}, expectedStatus: 401 },
  {
    method: 'POST',
    path: '/auth/verification/confirm',
    body: {},
    expectedStatus: 400,
  },
  {
    method: 'POST',
    path: '/auth/verification/request',
    body: {},
    expectedStatus: 401,
  },
  { method: 'POST', path: '/auth/emailpass/user', body: {}, expectedStatus: 401 },
  { method: 'GET', path: '/auth/mfa/factors', expectedStatus: 401 },
  { method: 'POST', path: '/auth/mfa/factors', body: {}, expectedStatus: 401 },
  {
    method: 'DELETE',
    path: `/auth/mfa/factors/${missingId}`,
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: `/auth/mfa/factors/${missingId}/verify`,
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: `/auth/mfa/challenges/${missingId}/verify`,
    body: {},
    expectedStatus: 401,
  },
  {
    method: 'POST',
    path: '/auth/mfa/recovery-codes',
    body: {},
    expectedStatus: 401,
  },
];
