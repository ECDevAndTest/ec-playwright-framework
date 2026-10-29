---
name: medusa-playwright-hosted
description: >-
  Operating context for the ECDevAndTest Playwright framework and its hosted
  Medusa backend on Render and Neon. Use when working in this repo, changing
  tests, the README, GitHub Actions, Render, Neon, the publishable key, carts,
  customers, smoke checks, or the store catalog.
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

The storefront Next app is not deployed. The hosted URL above is the API and admin.

## Smoke check

`tests/medusa/api/store-smoke.spec.ts` hits each mounted Store and Auth route once. `DELETE /store/carts/{id}/line-items/{line_id}` is an expected failure: the spec wants 404 and Medusa returns 500, so Playwright marks it `x` and the run still passes.

## Git

Commit only files Eric named. Push `cart-cases-01` and merge to `master` with a pull request when he asks. A fresh clone of `master` is the shared state.

Work that exists only in an uncommitted working tree on one machine is not on the other computer. As of the last session on the original machine, that unpublished set included Neon client wiring, customer registration tests, cart client edits, and temp scripts. Do not assume those files exist after `git pull`.
