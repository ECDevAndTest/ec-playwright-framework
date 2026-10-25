# Medusa Playwright Framework

A production-oriented Playwright and TypeScript automation framework targeting a local [Medusa](https://medusajs.com/) commerce stack.

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
scripts/           # Test-case and catalog generators
```

Tests receive configured clients through custom fixtures:

```text
Playwright request context
  → API client
    → custom fixture
      → test
```

## Prerequisites

- Node.js
- npm
- A running Medusa backend at `http://localhost:9000`
- A Medusa publishable API key associated with the test sales channel

## Setup

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
```

Set the local key in `.env`:

```dotenv
MEDUSA_PUBLISHABLE_API_KEY=your_publishable_key
```

## Run

```powershell
npm test
npm run test:headed
npm run test:ui
npm run report
npx playwright test tests/medusa/api/store-smoke.spec.ts --project=chromium
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
- Docker Compose environment
- GitHub Actions execution and artifact publishing
