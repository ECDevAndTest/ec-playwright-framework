# Medusa Playwright Framework

A production-oriented Playwright and TypeScript automation framework for the hosted [Medusa](https://medusajs.com/) backend at `https://ec-medusa-app.onrender.com`. GitHub Actions wakes that service, runs the suite, and publishes the report.

## CI/CD

Workflow: [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml). It runs on a push to `master`, on a pull request, and from the Actions tab (**Run workflow**). There is no schedule. The hosted service sleeps on the free tier, so the job wakes it only when tests are about to run.

```text
push, pull request, or manual run
  → checkout, Node 22, npm ci, install Chromium
    → poll https://ec-medusa-app.onrender.com/health every 10s until HTTP 200
      → npm test
        → upload the playwright-report artifact
```

`scripts/wait-for-medusa.mjs` performs that poll. The default wait is 3 minutes (`MEDUSA_WAIT_TIMEOUT_MS`). The job itself times out after 20 minutes.

The workflow sets `MEDUSA_BASE_URL` to `https://ec-medusa-app.onrender.com` and reads `MEDUSA_PUBLISHABLE_API_KEY` from the repository secret of the same name. That key is the publishable API key for the hosted store’s Default Sales Channel. Failed tests retry twice. The HTML report is kept for 7 days whether the suite passes or fails.

Open the run from the [Actions tab](https://github.com/ECDevAndTest/ec-playwright-framework/actions). The job is `test`. The wake step is **Wake Medusa**. Download `playwright-report` from the run summary when the job finishes.

## Current coverage

- Medusa backend health check
- Store and Auth API smoke status check
- Store API cart creation
- Product lookup by stable handle
- Adding a dynamically resolved product variant to a cart
- Typed API clients, response models, and custom Playwright fixtures
- HTML, list, and JUnit reporting
- Trace, screenshot, and video artifact configuration

## Architecture

```text
src/api/
├── clients/       # Domain-specific Store API clients
├── fixtures/      # Typed Playwright dependency injection
└── types/         # Request and response contracts

tests/medusa/api/  # API specs, including the store smoke check
test-cases/        # Generated risk-based test-case candidates
scripts/           # Wake-up poll and test-case generators
```

Tests receive configured clients through custom fixtures:

```text
Playwright request context
  → API client
    → custom fixture
      → test
```

## Store smoke check

`tests/medusa/api/store-smoke.spec.ts` calls each mounted Store and Auth route once. The route table lives in `tests/medusa/api/store-smoke.endpoints.ts`.

Each call sends the publishable key with an unknown id or an invalid body. The expected status shows that the route is mounted:

- `200` — a public read succeeded
- `400` — validation rejected the body before anything was written
- `401` — the route required a customer or admin session
- `404` — the route exists and the fake id does not

`POST /store/carts` uses an invalid email, so the smoke run does not create a cart. `GET /store/locales` is omitted because Medusa mounts it only when the translation feature flag is on. Admin routes are a separate API and are not part of this check.

`DELETE /store/carts/{id}/line-items/{line_id}` is an expected failure. Medusa currently returns `500` when the cart does not exist, and the spec still expects `404`. Playwright marks that test with `x`. The run exits 0. If Medusa starts returning `404`, that mark becomes a real failure so the expected status can be updated.

## Design principles

- Tests describe behavior; clients own HTTP mechanics.
- Fixtures own configuration and dependency construction.
- Generated database IDs are resolved from stable business identifiers.
- API response types provide compile-time guidance; runtime assertions verify behavior.
- Tests are isolated for parallel execution.

## Roadmap

- Test-data tagging and cleanup
- Runtime OpenAPI response validation
- Additional cart lifecycle coverage
- Storefront UI projects and page objects
