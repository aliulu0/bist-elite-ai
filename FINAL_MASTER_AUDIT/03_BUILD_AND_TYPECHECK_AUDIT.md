# 03 — BUILD & TYPECHECK AUDIT

> Executed 2026-08-12 from repo root using `node_modules/typescript/bin/tsc`.

## API

Command: `node tsc --noEmit -p apps/api/tsconfig.json`

**Result: FAIL (exit 2, 5 errors)** — all in the R2-046 `early-opportunity-backtest` module:

| # | File | Error |
|---|---|---|
| 1 | `early-opportunity-backtest.module.ts:13` | TS2307 Cannot find module `../common/cache/cache.module` |
| 2 | `historical-early-opportunity-backtest.service.ts:2` | TS2307 Cannot find module `uuid` |
| 3 | `historical-early-opportunity-backtest.service.ts:13` | TS2307 Cannot find module `../common/cache/cache.service` |
| 4 | `historical-early-opportunity-backtest.service.ts:14` | TS2307 Cannot find module `../indicators/indicator-cache.service` |
| 5 | `historical-early-opportunity-backtest.service.ts:289` | TS2554 Expected 2–3 arguments, but got 4 |

### Root causes (verified)

- Real module lives at `src/common/cache/cache.module.ts` + `src/common/cache/cache.service.ts`, but R2-046 imports `../common/cache/…` from `src/modules/early-opportunity-backtest/` → resolves to `src/modules/common/cache/…` which **does not exist**. Correct relative paths: `../../common/cache/…`.
- Real indicator-cache service lives at `src/modules/indicator-cache/indicator-cache.service.ts`; R2-046 imports `../indicators/indicator-cache.service` → **does not exist**. Correct: `../indicator-cache/indicator-cache.service`.
- `uuid` is **not installed** in `node_modules` (root or `apps/api`) → import fails.
- Line 289 calls `historicalMarketDataService.getValidatedHistory(symbol, timeframe, startDate, endDate)` with 4 args; the method signature accepts 2–3 → arity error.

### Impact

- Because `app.module.ts` imports `EarlyOpportunityBacktestModule`, the **entire API fails to compile**. The API cannot boot as committed.
- This makes `PROJECT_STATUS.md` ("tsc --noEmit passes", "Overall: GREEN") and `MASTER_ROADMAP.md` ("tsc --noEmit clean") **FALSE as of HEAD**.

## Web

Command: `node tsc --noEmit -p apps/web/tsconfig.json`

**Result: PASS (exit 0, no errors).** Web compiles cleanly.

## Other build surface

- `pnpm build` / turbo not runnable here (corepack/pnpm broken in this environment — pre-existing).
- Docker compose present (`docker-compose.yml`) but not exercised in this audit.

## Verdict

- **API build: BROKEN** (must-fix, 5 errors, ~1–2 h).
- **Web build: GREEN.**
- Doc claims of green build are stale and must be corrected.
