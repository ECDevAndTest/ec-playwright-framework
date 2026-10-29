import { expect, test } from '../../../../src/api/fixtures/medusa-fixtures';

test.describe('Store promotions', () => {
  test('MED-STORE-PROMOTIONS-001 - Add promotions to a cart: unknown promotion code', async ({
    cartClient,
    promotionClient,
  }) => {
    const created = await cartClient.create();
    expect(created.response.status()).toBe(200);

    const { response } = await promotionClient.add(created.body.cart.id, [
      'NO-SUCH-CODE',
    ]);

    expect([400, 404, 422]).toContain(response.status());
  });

  test('MED-STORE-PROMOTIONS-002 - Remove promotions from a cart: expired promotion', async ({
    cartClient,
    promotionClient,
  }) => {
    const created = await cartClient.create();
    expect(created.response.status()).toBe(200);

    const { response, body } = await promotionClient.remove(created.body.cart.id, [
      'EXPIRED-CODE',
    ]);

    expect(response.status()).toBe(200);
    expect(body.cart.promotions).toEqual([]);
  });
});
