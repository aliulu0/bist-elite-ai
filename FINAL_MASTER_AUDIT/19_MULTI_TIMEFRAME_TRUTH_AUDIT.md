# 19 — MULTI-TIMEFRAME & DERIVED DATA TRUTH AUDIT

## Claims

- R2-026/027/028 scoring across 8 timeframes (1h, 2h, 4h, 1d, 1w, 1M, 3M, 6M).
- R2-044 `/market-data/timeframes` reports `REAL / DERIVED / UNAVAILABLE` per timeframe.
- R2-041/042 shared indicator computation once per timeframe.

## Reality

- Indicator cache keys and timeframes: **1h, 2h, 4h, 1d, 1w, 1m, 3m, 6m** present as TTL config — matches.
- **Derived timeframes (e.g., 1h/2h → 4h aggregation): NOT implemented.** No candle-derivation module found. `DERIVED` status may be reported by the timeframes endpoint, but the derivation engine itself does not exist → `DOCUMENTED_ONLY`.
- Multi-timeframe scoring (alignment, trend/momentum alignment) is real code in `ai-early-opportunity` — unit-verified.
- Reality at runtime: no provider returns OHLCV → MTF sees empty candles → scores 0 / unavailable.

## Classification

| Item | Status |
|---|---|
| MTF alignment/scoring | REAL_AND_WORKING (unit) |
| 8-timeframe indicator caching | REAL_AND_WORKING |
| Derived timeframe derivation | **NOT_PRESENT** |
| Real multi-timeframe data | NOT_RUNTIME_CONNECTED |

## Verdict

- Core MTF logic good; derived timeframes are a **gap** (documented, not implemented). Personal-use: non-critical, defer.