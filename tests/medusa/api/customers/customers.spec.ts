import { randomUUID } from 'node:crypto';
import { test, expect } from '../../../../src/api/fixtures/medusa-fixtures';


test('MED-STORE-CUSTOMERS-001 - Create the authenticated customer: valid customer token', async ({
  authClient,
  customerClient,
}) => {
  const email = `pw-${randomUUID()}@example.com`;
  const password = 'Playwright-test-1';

  const { response: registerResponse, body: registerBody } =
    await authClient.registerCustomer(email, password);

  expect(registerResponse.status()).toBe(200);
  expect(registerBody.token).toEqual(expect.any(String));

  const { response, body } = await customerClient.create(registerBody.token, {
    email,
  });

  expect(response.status()).toBe(200);
  expect(body.customer.id).toMatch(/^cus_/);
  expect(body.customer.email).toBe(email);
});
