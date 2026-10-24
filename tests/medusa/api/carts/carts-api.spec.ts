import { test, expect } from '../../../../src/api/fixtures/medusa-fixtures';

test('MED-STORE-CARTS-001 - Create a cart: valid lifecycle state', async ({ cartClient }) => {
  const { response, body } = await cartClient.create();
  expect(response.status()).toBe(200);
  expect(body.cart.id).toMatch(/^cart_/);
  expect(body.cart.items?.length).toBe(0);
  expect(body.cart.total).toBe(0);
});

test('MED-STORE-CARTS-002 - Add an item to a cart: valid lifecycle state', async ({
  cartClient,
  backpackVariant,
}) => {
  const { response: createResponse, body: createBody } = await cartClient.create();
  expect(createResponse.status()).toBe(200);
  const { response: addItemResponse, body: addItemBody } =
    await cartClient.addItem(createBody.cart.id, backpackVariant.id);

  expect(addItemResponse.status()).toBe(200);
  expect(addItemBody.cart.items).toHaveLength(1);
  expect(addItemBody.cart.items?.[0]).toMatchObject({
    id: expect.stringMatching(/^cali_/),
    variant_id: backpackVariant.id,
    quantity: 1,
    unit_price: expect.any(Number),
  });
  expect(addItemBody.cart.total).toBeGreaterThan(0);
});