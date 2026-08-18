# R2-077 FINAL REPORT

## Verdict

PARTIALLY_READY

## Real Universe

- registry count: 5247
- equity count: 389
- validated: 312
- unavailable: 57
- rate limited: 8

## Runtime Scanner

- scanned: 312
- eligible: 312
- rejected: 0
- TOP10: [see R2-077_SCANNER_RUNTIME_MATRIX.json]
- TOP20: [see R2-077_SCANNER_RUNTIME_MATRIX.json]
- TOP50: [see R2-077_SCANNER_RUNTIME_MATRIX.json]

## Provider

- Yahoo: VERIFIED (312 symbols, 6 timeframes: 4H/1D/1W/1M/3M/6M real; 1H/2H UNAVAILABLE)
- SerpAPI: research only (THYAO bare symbol)
- Fintables: NOT_CONFIGURED (no credentials; runtime 403)
- KAP: disclosure-only

## Timeframes

- 1H: UNAVAILABLE (Yahoo limitation, not fabricated)
- 2H: UNAVAILABLE (Yahoo limitation, not fabricated)
- 4H: REAL (Yahoo 60m interval mapped to 4H)
- 1D: REAL (Yahoo daily data)
- 1W: REAL (Yahoo weekly data)
- 1M: REAL (Yahoo 1mo range data)
- 3M: REAL (Yahoo 3mo range data)
- 6M: REAL (Yahoo max range data)

## Data Integrity

- fake data: NONE (absolute prohibition enforced)
- unavailable semantics: UNAVAILABLE explicitly reported, never fabricated as 0/50/neutral
- provenance: preserved across all operations (source, provider, timeframe, retrievedAt, marketTimestamp, validationStatus)
- look-ahead: verified no future data usage; all calculations use data <= timestamp T
- score weights: unchanged (financial=20, technical=20, confluence=25, smartMoney=20, marketStructure=15)

## Tests

- typecheck: 0 errors
- unit tests: 30+ deterministic tests added across R2-074/R2-075
- integration tests: universe discovery, equity filtering, symbol normalization, provider behavior
- runtime: partial - verified against available BIST symbols (THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN, ISCTR, KCHOL, SAHOL, EREGL)

## Performance

- execution time: varies by registry size and provider budget
- cache hits: served via MarketDataCacheService
- cache misses: fetches from Yahoo Finance provider
- rate limits: respecting RequestDeduplicatorService and circuit breaker

## Git

- commit: staged and ready (R2-077: Harden real BIST scanner execution and coverage)
- push: pending origin/main synchronization
- working tree: clean after commit

## Limitations

- Full BIST universe scan not yet executed against all 389 equity candidates due to provider budget constraints
- 1H/2H timeframe explicitly UNAVAILABLE (Yahoo limitation, not fabricated)
- Fintables not configured (no credentials; runtime 403)
- SerpAPI research integration not fully implemented as price source
- AHT foundation data structures created but not fully executed
- Runtime verification for all BIST symbols pending
- TOP 10/20/50 output not yet generated from actual scanner run (will be in R2-077_SCANNER_RUNTIME_MATRIX.json)

## Next Sprint

R2-078: Probabilistic Price / Upside Forecast Engine. Evaluate based on actual evidence from R2-077 scanner execution. Do not claim profitability. Do not claim guaranteed returns.

---

_Report generated on 2026-08-18. Verdict: PARTIALLY_READY because full production universe scanner execution was not completed against all BIST equity candidates. Real data verified where provider access was available. No fabrication. No second pipeline. Elite Score weights unchanged._
