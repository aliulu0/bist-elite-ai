# 06 — LIVE RUNTIME AUDIT

> Objective: answer "does the system actually run and produce real output?" in this environment.

## Boot status

- **API cannot boot.** `app.module.ts` imports `EarlyOpportunityBacktestModule` (line: `import { EarlyOpportunityBacktestModule } from './modules/early-opportunity-backtest/early-opportunity-backtest.module';`), which has 5 compile errors (see 03). `tsc --noEmit` fails → NestJS app cannot be started as committed.
- Therefore **no live E2E run** (boot → scan → decision → backtest) was possible in this audit.

## What was verified at runtime (Jest, real service instances)

- R2-045 decision engine: pure function over an `EarlyOpportunityIntelligenceResult` — 16/16 tests. Logic is deterministic and correct.
- R2-046 backtest services: 52/52 tests, but with **mocked** inputs — no real historical data exercised.

## Prior truth-audit runtime evidence (re-run unavailable due to compile break)

- Live scan over all BIST symbols produced **`INVALID_OPPORTUNITY` for every symbol** because hard gates trigger on missing/insufficient market data (no provider returns candles).
- Decision engine's own logic was proven correct; the failure is entirely upstream (no data).
- KAP disclosures were the only live data that returned.

## Endpoints that would run once compiled (from code)

- `POST /backtest/early-opportunity/run`, `GET /backtest/early-opportunity/:runId` (+8 more)
- `GET /ai-early-opportunity/decision/:ticker`
- `GET /early-opportunities`, `/scanner`, `/portfolio/*`, `/market-data/*`, `/signals/*`, etc.
- Scheduler jobs (marketOpenScan, incrementalScan, nightlyBacktest, …) are enabled by default config.

## Runtime classification

| Layer | Status |
|---|---|
| Nest bootstrap | BROKEN (compile) |
| HTTP layer (controller/DTO) | CODE_ONLY until boot fixed |
| Decision intelligence (R2-045) | REAL_AND_WORKING (pure logic, unit-proven) |
| Backtest validation (R2-046) | MOCK_ONLY (tests pass; no real data; module broken) |
| Real BIST data flow | NOT_RUNTIME_CONNECTED |
| Scheduler | CODE_ONLY (would run once booted) |
| Web dashboard | CODE_ONLY (needs API) |

## Verdict

- **The system is NOT currently operational.** It neither compiles nor serves data.
- Restore compile → configure ≥1 keyed provider → run one live smoke before trusting any output.
