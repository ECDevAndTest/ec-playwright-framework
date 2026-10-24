import { test as base, expect } from '@playwright/test';
import { CartClient } from '../clients/cart-client';
import { ProductClient } from '../clients/product-client';
import type { StoreProductVariant } from '../types/product-types';

type MedusaFixtures = {
  publishableApiKey: string;
  cartClient: CartClient;
  productClient: ProductClient;
  backpackVariant: StoreProductVariant;
};

export const test = base.extend<MedusaFixtures>({
  publishableApiKey: async ({}, use) => {
    const publishableApiKey = process.env.MEDUSA_PUBLISHABLE_API_KEY;

    if (!publishableApiKey) {
      throw new Error('MEDUSA_PUBLISHABLE_API_KEY is not set');
    }

    await use(publishableApiKey);
  },

  cartClient: async ({ request, publishableApiKey }, use) => {
    await use(new CartClient(request, publishableApiKey));
  },

  productClient: async ({ request, publishableApiKey }, use) => {
    await use(new ProductClient(request, publishableApiKey));
  },

  backpackVariant: async ({ productClient }, use) => {
    const { response, body } =
      await productClient.findByHandle('pw-test-backpack');

    if (!response.ok()) {
      throw new Error(
        `Unable to retrieve the Backpack product: HTTP ${response.status()}`,
      );
    }

    const product = body.products[0];
    const variant = product?.variants?.find(({ title }) => title === 'Black');

    if (!variant) {
      throw new Error('The Black Backpack variant was not found');
    }

    await use(variant);
  },
});

export { expect };
