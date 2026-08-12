# 20 — EARLY OPPORTUNITY PIPELINE TRUTH AUDIT

> End-to-end truth for the flagship feature.

## Chain

```
Provider (KAP/Finnhub/Yahoo) → MarketDataOrchestrator (cache+dedup)
 → IndicatorEngine (cache) → Prediction/SmartMoney/Catalyst/Signals/Quality/MTF
 → EarlyOpportunityIntelligence (R2-027, filters) → DecisionEngine (R2-045)
 → [R2-046 backtest validation]
```

## Verified

- All stages are implemented with unit tests EXCEPT the live data link.
- R2-045 decision gates are proven (16/16 tests): with `NO_MARKET_DATA` / `DATA_INSUFFICIENT` → `INVALID_OPPORTUNITY`.
- R2-038 signals and R2-037 quality sharpen scoring when data exists.

## Runtime truth (this environment)

- **Every symbol evaluates to `INVALID_OPPORTUNITY`** because no provider returns usable OHLCV.
- Dashboard/scanner therefore shows **no early opportunities** — the platform's entire purpose is currently dormant.
- KAP disclosures alone don't feed the scoring (catalysts yes, candles no).

## Classification

- Pipeline architecture: COHERENT.
- Pipeline live output: **EMPTY / INVALID**.
- Root cause chain: missing provider keys → no candles → empty indicators → invalid decisions.

## Quick path to first real output

1. Fix R2-046 compile (18) → API boots.
2. Add one OHLCV key (Finnhub or Fintables) + confirm Yahoo reachable.
3. Run `GET /early-opportunities` smoke — expect real scores for THYAO/GARAN/etc.
4. Then run decision + one R2-046 backtest run on a real symbol.

## Verdict

- Early-opportunity feature: **BUILT but DATA-STARVED** → effectively not producing real signals today.