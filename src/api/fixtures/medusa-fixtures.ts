import { test as base, expect } from '@playwright/test';
import { AuthClient } from '../clients/auth-client';
import { CartClient } from '../clients/cart-client';
import { CustomerClient } from '../clients/customers-client';
import { OrderClient } from '../clients/order-client';
import { ProductClient } from '../clients/product-client';
import { PromotionClient } from '../clients/promotion-client';
import { RegionClient } from '../clients/region-client';
import type { StoreProductVariant } from '../types/product-types';

type MedusaFixtures = {
  publishableApiKey: string;
  authClient: AuthClient;
  cartClient: CartClient;
  customerClient: CustomerClient;
  orderClient: OrderClient;
  productClient: ProductClient;
  promotionClient: PromotionClient;
  regionClient: RegionClient;
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

  authClient: async ({ request, publishableApiKey }, use) => {
    await use(new AuthClient(request, publishableApiKey));
  },

  cartClient: async ({ request, publishableApiKey }, use) => {
    await use(new CartClient(request, publishableApiKey));
  },

  customerClient: async ({ request, publishableApiKey }, use) => {
    await use(new CustomerClient(request, publishableApiKey));
  },

  orderClient: async ({ request, publishableApiKey }, use) => {
    await use(new OrderClient(request, publishableApiKey));
  },

  productClient: async ({ request, publishableApiKey }, use) => {
    await use(new ProductClient(request, publishableApiKey));
  },

  promotionClient: async ({ request, publishableApiKey }, use) => {
    await use(new PromotionClient(request, publishableApiKey));
  },

  regionClient: async ({ request, publishableApiKey }, use) => {
    await use(new RegionClient(request, publishableApiKey));
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
