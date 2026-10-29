import { test, expect } from '../../../../src/api/fixtures/medusa-fixtures';

test.describe('Store carts', () => {
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

  test('MED-STORE-CARTS-003 - Complete a cart: nonexistent cart', async ({ cartClient }) => {
    const { response: completeResponse } = await cartClient.complete('nonexistent_cart_id');
    expect(completeResponse.status()).toBe(404);
  });

  test('MED-STORE-CARTS-004 - Retrieve a cart after adding an item', async ({
    cartClient,
    backpackVariant,
  }) => {
    const { body: createBody } = await cartClient.create();
    const { body: addItemBody } = await cartClient.addItem(
      createBody.cart.id,
      backpackVariant.id,
    );

    const { response, body } = await cartClient.get(createBody.cart.id);

    expect(response.status()).toBe(200);
    expect(body.cart.items).toHaveLength(1);
    expect(body.cart.items?.[0]).toMatchObject({
      id: addItemBody.cart.items?.[0]?.id,
      variant_id: backpackVariant.id,
      quantity: 1,
    });
    expect(body.cart.total).toBe(addItemBody.cart.total);
    expect(body.cart.total).toBeGreaterThan(0);
  });

  test('MED-STORE-CARTS-027 - Add a line item: quantity zero', async ({
    cartClient,
    backpackVariant,
  }) => {
    const { body: createBody } = await cartClient.create();
    const { response } = await cartClient.addItem(
      createBody.cart.id,
      backpackVariant.id,
      0,
    );

    expect(response.status()).toBe(400);

    const { body } = await cartClient.get(createBody.cart.id);
    expect(body.cart.items?.length).toBe(0);
  });

  test('MED-STORE-CARTS-005 - Update a line item: quantity doubles the total', async ({
    cartClient,
    backpackVariant,
  }) => {
    const { body: createBody } = await cartClient.create();
    const { body: addItemBody } = await cartClient.addItem(
      createBody.cart.id,
      backpackVariant.id,
    );
    const lineItemId = addItemBody.cart.items?.[0]?.id;
    const oneItemTotal = addItemBody.cart.total;

    if (!lineItemId) {
      throw new Error('The added line item has no id');
    }

    const { response, body } = await cartClient.updateItem(
      createBody.cart.id,
      lineItemId,
      2,
    );

    expect(response.status()).toBe(200);
    expect(body.cart.items?.[0]?.quantity).toBe(2);
    expect(body.cart.total).toBe(oneItemTotal * 2);
  });
});
