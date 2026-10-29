---
name: medusa-playwright-hosted
description: >-
  Operating context for the ECDevAndTest Playwright framework and its hosted
  Medusa backend on Render and Neon. Use when working in this repo, changing
  tests, the README, GitHub Actions, Render, Neon, the publishable key, carts,
  customers, smoke checks, the store catalog, the storefront, the marketplace,
  admin end-to-end tests, or the BDD feature layout.
---

# Hosted Medusa Playwright

Eric is the owner. The default branch of this repo is `master`, not `main`. The shell on his Windows machines is PowerShell, which does not support `&&`.

Do not print connection strings, publishable keys, JWTs, or passwords. Do not commit `.env` or `tmp-*.js`.

## Repos

| What | Where |
|---|---|
| This framework (public) | `ECDevAndTest/ec-playwright-framework`, branch `master` |
| Medusa app (private) | `ECDevAndTest/ec-medusa-app`, sibling checkout `medusaJsApp` |

Keep the Medusa app private. Do not containerize it unless Eric asks again. Its `.env` is gitignored and is not what Render runs.

## Hosted runtime

- API: `https://ec-medusa-app.onrender.com`
- Admin: `https://ec-medusa-app.onrender.com/app`
- Render service `ec-medusa-app` listens on port 10000. `GET /` is 404. `GET /health` returns body `OK`.
- The free service sleeps. Do not add a cron. The only wake-up is `scripts/wait-for-medusa.mjs` inside `.github/workflows/playwright.yml`.
- That script polls `/health` every 10 seconds until HTTP 200. `MEDUSA_WAIT_TIMEOUT_MS` defaults to 180000. The job timeout is 20 minutes.
- Triggers: push to `master`, pull request, and **Run workflow**. No schedule.
- The workflow sets `MEDUSA_BASE_URL` to the hosted API and reads `MEDUSA_PUBLISHABLE_API_KEY` from the repository secret. The runner has no `.env`.
- Playwright uses one worker. The hosted app has no Redis, so concurrent cart-creation workflows deadlock on the in-memory lock. Do not raise `workers` or turn `fullyParallel` back on unless Render has a real `REDIS_URL`.
- Failed tests retry twice. The `playwright-report` artifact is kept 7 days.
- Logs appear only after the `test` job exists. The wake step is **Wake Medusa**. A run stuck on Queued with no job has not contacted Render.
- Merging to `master` starts this workflow.

The README documents this hosted flow only. Do not add a local setup section back.

## Database

Neon project `ec-medusa-demo` (`cold-darkness-96017546`), branch `production`, database `neondb`. Render's `DATABASE_URL` must use the pooled host (the hostname contains `-pooler`). Migrations and dumps use the direct host. In this repo's `.env`, `DATABASE_URL` is pooled and `DATABASE_URL_UNPOOLED` is direct.

A Neon role password was pasted into an earlier chat. If `neondb_owner` has not been rotated since then, rotate it in the Neon console and update Render's `DATABASE_URL` before relying on the old password. Do not repeat the password.

Hosted admin login is `admin@test.com`. The local Postgres database `ec-test-architecture` still has admin `ecastillo640@gmail.com`. Those are different accounts. Copying the user row does not copy the catalog.

## Catalog the suite depends on

Cart creates send no region, so Medusa prices them with the store default. That default is **United States / USD**. Europe and the European warehouse are still present from the seed.

Also on the hosted store:

- Stock location **US Warehouse** (New York), service zone **Service US**
- Shipping options `ec` (return, amount 0) and `UPS` (amount 3)
- Published product handle `pw-test-backpack`, title **Playwright Test Backpack**, on **Default Sales Channel**
- Variant **Black**, 100 USD and 100 EUR, inventory not managed
- Variant **White**

`backpackVariant` in `src/api/fixtures/medusa-fixtures.ts` loads handle `pw-test-backpack` and variant title `Black`. If either is missing, the cart tests throw `The Black Backpack variant was not found`.

The GitHub secret is the hosted publishable key. The key in the local `.env` matches the local database and does not match Neon. Do not point GitHub at the local key unless a restore replaces the Neon `api_key` row.

The storefront Next app is not deployed. The hosted URL above is the API and admin. The plan for putting it online is under **Marketplace deploy**. Do not deploy it, and do not script admin or marketplace steps, until the BDD layout below exists.

## Smoke check

`tests/medusa/api/store-smoke.spec.ts` hits each mounted Store and Auth route once. `DELETE /store/carts/{id}/line-items/{line_id}` is an expected failure: the spec wants 404 and Medusa returns 500, so Playwright marks it `x` and the run still passes.

## Next session

Agreed order: BDD layout, then feature files, then step names, then script admin steps, then deploy the storefront and script marketplace steps. Eric expects to start this on another machine. A fresh clone of `master` is the shared state.

### BDD before scripting

Use `playwright-bdd`. Feature files are the source. `defineBddConfig` generates tests when Playwright loads its config. Put generated output in `.features-gen` and gitignore it. Keep one worker.

```text
features/admin/*.feature
features/marketplace/*.feature
steps/admin/
steps/marketplace/
src/ui/admin/            page objects, filled in when steps are scripted
src/ui/marketplace/
```

Admin and marketplace each get their own features and steps. The Store API specs in `tests/medusa/api/` stay plain Playwright tests. The JSON catalogs in `test-cases/` stay the Store API catalog. Do not convert them into features.

Tag scenarios out of the default run until their steps exist. A feature with no step body fails the hosted workflow on the next push to `master`. Leave the marketplace project out of that run until `MARKETPLACE_BASE_URL` is set.

First features, still unscripted:

- Admin: log in as the hosted admin, find **Playwright Test Backpack** in the product list, see **United States** in regions.
- Marketplace: open the US shop, see that backpack, add the **Black** variant to the cart.

Admin email and password come from GitHub secrets. A setup project saves the admin session. Admin scenarios must not delete `pw-test-backpack` or the United States region.

### Two end-to-end categories

| Project | What it drives | Base URL |
|---|---|---|
| Existing Store API | `tests/medusa/api/` | `MEDUSA_BASE_URL` (the API) |
| `admin` | `features/admin` | `https://ec-medusa-app.onrender.com/app` |
| `marketplace` | `features/marketplace` | `MARKETPLACE_BASE_URL` (not set yet) |

`npm test` stays one worker, so an admin click and a cart workflow cannot overlap. Admin end-to-end can be scripted before the shop exists. Marketplace end-to-end waits on the storefront URL.

### Marketplace deploy

Deploy `apps/storefront` from the private repo as a second Render web service. No Docker. It calls the API already on Render. Both free services sleep. Do not add a keep-awake cron.

The storefront start script is `next start -p 8000`. Render routes to `PORT`, so change that script to listen on `PORT` before the service can answer.

- Node 22, pnpm, repo root (the app is a workspace; do not set the Render root to `apps/storefront` alone).
- Build: `pnpm install --frozen-lockfile && pnpm --filter @dtc/storefront build`
- Start: `pnpm --filter @dtc/storefront start`
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` = `https://ec-medusa-app.onrender.com`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` = the hosted publishable key. It is public by design and will be in the browser bundle.
- `NEXT_PUBLIC_DEFAULT_REGION` = `us`. The template default is `dk`. The hosted default region is United States.
- `NEXT_PUBLIC_BASE_URL` = the new storefront URL.

Add that storefront origin to `STORE_CORS` and `AUTH_CORS` on the existing API service, then restart it. Customer cookies are set on the storefront. The Next server calls Medusa with the bearer token.

First shop check: a visitor opens the US storefront, sees the catalog including Playwright Test Backpack, and adds it to a cart. Shipping options `ec` and `UPS` are already on the hosted store.

Leave these for after that check:

- The store listing and search drawer call `/store/search`. That route is not in the hosted `medusa-config.ts`. Home and product pages use the Store API.
- Checkout stops at payment unless the hosted store already has a payment provider. Stripe is optional and is not required to get the shop online.

## Git

Commit only files Eric named. Merge to `master` with a pull request when he asks. A fresh clone of `master` is the shared state.

Store API coverage on `master` includes health, smoke, carts, customers, products, regions, promotions, and an orders client with an empty `test.describe`. Playwright `workers` is 1. PR #5 merged as `34ce629`.

Still unpublished on the machine that wrote them: Neon client (`neon.ts`, `src/db/`, `@neon/*` and `pg` in `package.json`), `.env.example` database vars, `.gitignore` entry `.neon`, `tsconfig.json` include of `neon.ts`, `.agents/` Neon skills, `skills-lock.json`, `src/api/types/Untitled`, and `tmp-url-check.js`. Do not commit those unless Eric asks. Do not assume they exist after `git pull`.
