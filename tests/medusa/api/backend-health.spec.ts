import { test, expect } from '@playwright/test';

test('Medusa backend reports healthy status', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toBe('OK');
});