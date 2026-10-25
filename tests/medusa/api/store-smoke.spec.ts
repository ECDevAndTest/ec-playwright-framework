import { test, expect } from '../../../src/api/fixtures/medusa-fixtures';
import { storeSmokeEndpoints } from './store-smoke.endpoints';

for (const endpoint of storeSmokeEndpoints) {
  test(`SMOKE ${endpoint.method} ${endpoint.path}`, async ({
    request,
    publishableApiKey,
  }) => {
    test.fail(Boolean(endpoint.knownDefect), endpoint.knownDefect);

    const response = await request.fetch(endpoint.path, {
      method: endpoint.method,
      headers: {
        accept: 'application/json',
        'x-publishable-api-key': publishableApiKey,
      },
      ...(endpoint.body ? { data: endpoint.body } : {}),
    });

    expect(
      response.status(),
      `${endpoint.method} ${endpoint.path}`,
    ).toBe(endpoint.expectedStatus);
  });
}
