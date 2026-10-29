import { randomUUID } from 'node:crypto';
import { test, expect } from '../../../../src/api/fixtures/medusa-fixtures';

test.describe('Store customers', () => {
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

  test('MED-STORE-CUSTOMERS-002 - Retrieve the current customer: missing customer authentication', async ({
    customerClient,
  }) => {
    const { response, body } = await customerClient.getMe();

    expect(response.status()).toBe(401);
    expect(body).not.toHaveProperty('customer');
  });

  test('MED-STORE-CUSTOMERS-003 - Update the current customer: expired customer token', async ({
    customerClient,
  }) => {
    const { response } = await customerClient.updateMe(expiredCustomerJwt(), {
      first_name: 'Playwright',
    });

    expect(response.status()).toBe(401);
  });

  test('MED-STORE-CUSTOMERS-004 - List customer addresses: malformed bearer token', async ({
    customerClient,
  }) => {
    const { response } = await customerClient.listAddresses('not-a-jwt');

    expect(response.status()).toBe(401);
  });
});

function expiredCustomerJwt(): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ actor_type: 'customer', exp: 1 }),
    'expired',
  ].join('.');
}
