# Medusa Playwright Framework

A production-oriented Playwright and TypeScript automation framework targeting a local [Medusa](https://medusajs.com/) commerce stack.

## Current coverage

- Medusa backend health check
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

tests/medusa/api/  # Executable Playwright API specifications
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
```

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
