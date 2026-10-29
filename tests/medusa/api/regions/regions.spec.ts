import { expect, test } from '../../../../src/api/fixtures/medusa-fixtures';

test.describe('Store regions', () => {
  test('MED-STORE-REGIONS-001 - List regions: default pagination', async ({
    regionClient,
  }) => {
    const { response, body } = await regionClient.list();
    const names = body.regions.map((region) => region.name);

    expect(response.status()).toBe(200);
    expect(names).toEqual(expect.arrayContaining(['United States', 'Europe']));
    expect(body.count).toBeGreaterThanOrEqual(body.regions.length);
    expect(body.offset).toBe(0);
  });

  test('MED-STORE-REGIONS-002 - Retrieve a region: limit one', async ({
    regionClient,
  }) => {
    const listed = await regionClient.list();
    const unitedStates = listed.body.regions.find(
      (region) => region.name === 'United States',
    );

    expect(unitedStates).toBeTruthy();

    const { response, body } = await regionClient.retrieve(unitedStates!.id);

    expect(response.status()).toBe(200);
    expect(body.region).toMatchObject({
      id: unitedStates!.id,
      name: 'United States',
      currency_code: 'usd',
    });
  });

  test('MED-STORE-REGIONS-032 - Retrieve a region: malformed region ID', async ({
    regionClient,
  }) => {
    const { response } = await regionClient.retrieve('not-a-region');

    expect([400, 404]).toContain(response.status());
  });
});
