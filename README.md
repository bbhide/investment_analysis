# Investment Analysis Tool

A self-serve web rebuild of [`kudratsinvestmentanalysistool.xlsx`](kudratsinvestmentanalysistool.xlsx) — a real-estate investment workbook covering mortgage amortization, monthly/yearly cash-flow forecasts, dashboard KPIs (ROI, ROE, Cap Rate, DSCR, LTV, LTC), and a comparables tool.

**Stack:** Node 20 · TypeScript · Fastify · Prisma · PostgreSQL · Vue 3 · Vite · Pinia · Tailwind · Chart.js · pnpm workspaces.

## Repository layout

```
packages/
  shared/   TS types + Zod schemas (Inputs, Comparables, Scenario)
  calc/     Pure TS calculation engine (PMT/PPMT/IPMT, amortization, forecast, summary)
            Tested against the source xlsx as a golden fixture
  api/      Fastify + Prisma + Postgres (scenarios CRUD, /calculate, share links)
  web/      Vue 3 SPA (inputs editor, summary dashboard, mortgage, forecast, comparables)
scripts/
  extract-fixture.py   Reads the xlsx with data_only=True and writes the golden fixture
docker-compose.yml     Local Postgres
```

The calc engine is the source of truth for the math and is shared between API and web via `workspace:*`.

## Local setup

Prereqs: Node 20+, pnpm 9+, Docker.

```bash
# 1. install
pnpm install

# 2. start postgres
docker compose up -d

# 3. configure api env (copy then leave defaults for local)
cp packages/api/.env.example packages/api/.env

# 4. apply schema
pnpm --filter @inv/api prisma:generate
pnpm --filter @inv/api prisma:migrate -- --name init

# 5. dev (api on :4000, web on :5173, web proxies /api -> api)
pnpm dev
```

Then open <http://localhost:5173>.

## Tests

```bash
pnpm --filter @inv/calc test    # 14 tests, including the golden parity test against the xlsx
pnpm -r typecheck               # type-check every package
pnpm -r build                   # build every package
```

The golden fixture is regenerated with:

```bash
python3 scripts/extract-fixture.py
```

## Known spreadsheet quirk

`Inputs!K39` / `K49` / `K50` (the "Monthly Loan Payment" summary cells) add fees at their full annual value to the monthly payment (missing a `/12`), while the amortization schedule in `Mortgage Calc!C23` correctly divides by 12. The calc engine implements the mathematically correct behavior; the golden test calls this out explicitly.

## Architecture notes

- **Anonymous workspaces.** First request sets a long-lived httpOnly `inv_ws` cookie. No signup. Drop in real auth later by wiring the workspaceId middleware to your auth provider.
- **Stateless `/calculate`.** The web app debounces and calls `POST /api/calculate` while editing — no persistence required to see results. Saved scenarios are then PUT-updated on autosave (1.5s debounce).
- **Currency.** Stored per-scenario; rendering uses `Intl.NumberFormat`. The engine is currency-agnostic.
- **Share links.** `POST /api/scenarios/:id/share` issues a `shareToken`; `/shared/:token` is a public read-only view. Owner can revoke.
- **Calc parity.** Vitest opens `the-lofts.json` (harvested from the xlsx) and asserts every key derived value, year-1 + year-N forecast, and amortization invariants match within 0.5 AED.

## Deploying

- API: build with `pnpm --filter @inv/api build`, run `node packages/api/dist/server.js`, point `DATABASE_URL` at a managed Postgres.
- Web: `pnpm --filter @inv/web build` → static files in `packages/web/dist`, serve from any static host; set the API URL via a reverse-proxy on `/api`.


# from your laptop
rsync -az --delete --exclude=node_modules --exclude=.git --exclude=dist --exclude=.env \
  ~/code/allan/investment_analysis/ ubuntu@15.207.133.143:~/code/investment_analysis/
ssh ubuntu@15.207.133.143 'cd ~/code/investment_analysis && \
  docker compose -f docker-compose.prod.yml -p inv build && \
  docker compose -f docker-compose.prod.yml -p inv up -d'