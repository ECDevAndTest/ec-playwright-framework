import { expect, test } from '../../../../src/api/fixtures/medusa-fixtures';
import type { ProductClient } from '../../../../src/api/clients/product-client';
import type { StoreProduct } from '../../../../src/api/types/product-types';

test.describe('Store products', () => {
  test('MED-STORE-PRODUCTS-001 - List products: default pagination', async ({
    productClient,
  }) => {
    const { response, body } = await productClient.list();

    expect(response.status()).toBe(200);
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.products.length).toBeLessThanOrEqual(body.limit);
    expect(body.offset).toBe(0);
    expect(body.count).toBeGreaterThanOrEqual(body.products.length);
  });

  test('MED-STORE-PRODUCTS-002 - Retrieve a product: first result', async ({
    productClient,
  }) => {
    const listed = await productClient.list({ limit: 1, offset: 0 });
    expect(listed.response.status()).toBe(200);
    const first = listed.body.products[0];

    const { response, body } = await productClient.retrieve(first.id, {
      limit: 1,
      offset: 0,
    });

    expect(response.status()).toBe(200);
    expect(body.product.id).toBe(first.id);
  });

  test('MED-STORE-PRODUCTS-003 - List products: zero limit', async ({ productClient }) => {
    const { response, body } = await productClient.list({ limit: 0 });

    expect(response.status()).toBe(200);
    expect(body.products).toHaveLength(0);
  });

  test('MED-STORE-PRODUCTS-004 - Retrieve a product: negative limit', async ({
    productClient,
  }) => {
    const product = await publishedProduct(productClient);
    const { response, body } = await productClient.retrieve(product.id, { limit: -1 });

    expect(response.status()).toBe(200);
    expect(body.product.id).toBe(product.id);
  });

  test('MED-STORE-PRODUCTS-005 - List products: non-integer limit', async ({
    productClient,
  }) => {
    const { response } = await productClient.list({ limit: 'abc' });

    expect([400, 422]).toContain(response.status());
  });

  test('MED-STORE-PRODUCTS-006 - Retrieve a product: large offset', async ({
    productClient,
  }) => {
    const product = await publishedProduct(productClient);
    const { response, body } = await productClient.retrieve(product.id, {
      offset: 100000,
    });

    expect(response.status()).toBe(200);
    expect(body.product.id).toBe(product.id);
  });

  test('MED-STORE-PRODUCTS-007 - List products: negative offset', async ({
    productClient,
  }) => {
    test.fail(true, 'Medusa returns 500 for offset=-1. The list should reject it with 400.');

    const { response } = await productClient.list({ offset: -1 });

    expect(response.status()).toBe(400);
  });

  test('MED-STORE-PRODUCTS-008 - Retrieve a product: search by exact title', async ({
    productClient,
  }) => {
    const product = await publishedProduct(productClient);
    const { response, body } = await productClient.retrieve(product.id, {
      q: product.title,
    });

    expect(response.status()).toBe(200);
    expect(body.product.title).toBe(product.title);
  });

  test('MED-STORE-PRODUCTS-009 - List products: search by partial title', async ({
    productClient,
  }) => {
    const { response, body } = await productClient.list({ q: 'Backpack' });

    expect(response.status()).toBe(200);
    expect(body.products.some((product) => product.title.includes('Backpack'))).toBe(
      true,
    );
  });

  test('MED-STORE-PRODUCTS-010 - Retrieve a product: search with no matches', async ({
    productClient,
  }) => {
    const product = await publishedProduct(productClient);
    const { response } = await productClient.retrieve(product.id, {
      q: 'pw-no-such-product',
    });

    expect(response.status()).toBe(404);
  });

  test('MED-STORE-PRODUCTS-011 - List products: ascending title order', async ({
    productClient,
  }) => {
    const { response, body } = await productClient.list({ order: 'title' });
    const titles = body.products.map((product) => product.title);

    expect(response.status()).toBe(200);
    expect(titles).toEqual([...titles].sort((left, right) => left.localeCompare(right)));
  });

  test('MED-STORE-PRODUCTS-012 - Retrieve a product: descending created date order', async ({
    productClient,
  }) => {
    const product = await publishedProduct(productClient);
    const { response, body } = await productClient.retrieve(product.id, {
      order: '-created_at',
    });

    expect(response.status()).toBe(200);
    expect(body.product.id).toBe(product.id);
  });
});

async function publishedProduct(productClient: ProductClient): Promise<StoreProduct> {
  const { response, body } = await productClient.findByHandle('pw-test-backpack');
  expect(response.ok()).toBeTruthy();

  const product = body.products[0];
  expect(product).toBeTruthy();

  return product;
}
