# 04 — TEST SUITE AUDIT

> Jest runs via `apps/api/node_modules/jest/bin/jest.js` with `apps/api/jest.config.ts` (rootDir `src`). `CI=true` to silence watch. Long runtime (~135 s) due to ts-jest + open-handle force-exit.

## Executed this audit

### R2-046 `early-opportunity-backtest` (10 suites / 52 tests) — PASS

```
Test Suites: 10 passed, 10 total
Tests:       52 passed, 52 total
```

- Suites: point-in-time-data, future-outcome, decision-success, benchmark, confidence-calibration,
  lead-time, false-positive, missed-opportunity, critical-look-ahead, call-count.
- **Caveat (critical):** these tests pass because they **construct services directly with mock/fake
  dependencies**. They do NOT exercise the real Nest DI wiring — which is exactly where the 5 `tsc`
  errors live (wrong module imports, missing `uuid`). The tests are green while the module cannot compile.

### R2-045 `early-opportunity-decision` (2 suites / 16 tests) — PASS

```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

## Structural evidence (repo-wide)

- API `*.spec.ts`: **342 files**.
- Web test files: **708** (`*.test.tsx` / `*.test.ts`).
- Scheduler job specs present: alert-refresh, macro-refresh, nightly-backtest, portfolio-refresh, retry-failed-jobs.
- Provider adapter specs present for all 8 unified adapters (alpha-vantage, finnhub, fintables, kap, mkk, serpapi, tcmb, yahoo) + legacy yahoo/fintables providers.
- Docs claim large regression baselines (R2-043: 329 suites / 5535 tests; R2-042: 326 suites / 5512 tests). These numbers are **not reproducible** in this environment without `turbo run test` (turbo unavailable). Not independently verified here.

## Truth table

| Claim (docs) | Reality |
|---|---|
| R2-046 10 suites / 52 tests GREEN | ✅ Verified (52/52) — but mocked |
| R2-045 16 tests GREEN | ✅ Verified (16/16) |
| R2-046 `tsc --noEmit` clean | ❌ FALSE (5 errors, see 03) |
| Whole-project tsc passes | ❌ FALSE for API |
| All suites pass (5512 tests) | ⚠️ Not re-run here; blocked by API compile + turbo unavailability |

## Verdict

- Unit-test culture: STRONG (342 API suites + 708 web tests exist).
- But **no E2E/integration suite can run** while the API fails to compile; mocked tests give false confidence for R2-046.
- Recommend adding a CI gating step `tsc --noEmit` so green docs cannot diverge again.
