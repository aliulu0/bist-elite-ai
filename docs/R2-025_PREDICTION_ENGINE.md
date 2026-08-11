# R2-025 — Multi-Timeframe Prediction Engine

**Version:** 1.0.0
**Status:** ✅ COMPLETE
**Scope:** Deterministic, multi-timeframe probability estimation.
**Does NOT** select stocks. Stock selection belongs to R2-026 (Early Opportunity Engine).

---

## 1. Architecture

The Prediction Engine is a **deterministic** probability layer that reuses every existing
production engine and **never** computes its own indicators.

### Pipeline

```
MarketDataService.fetchData          (Historical Engine  — 1 provider request per timeframe)
  ↓
IndicatorEngine.calculateAll         (Indicator Engine  — calculated once, reused everywhere)
  ↓
MarketStructureEngine.analyze        (Market Structure)
  ↓
SmartMoneyService.getSmartMoney      (Smart Money Engine — cached read)
CatalystService.getCatalyst          (Catalyst Engine    — cached read)
VerificationAIService.getVerification (Verification AI   — cached read)
  ↓
CoreBacktestEngine.run               (Backtest Engine   — confidence calibration, same OHLCV)
EntryZoneEngine.evaluate             (Entry Zone Engine — entry/stop/target zones, no new calcs)
  ↓
PredictionEngine.evaluate            (probability + scenario + signal model)
  ↓
PredictionScoreEngine.score          (calibrated confidence, final result)
  ↓
PredictionRegistry.save / CacheService.set
```

### Module layout

```
apps/api/src/modules/prediction/
├── prediction.types.ts          # result + feature type definitions
├── prediction.config.ts         # deterministic config, timeframe mapping, cache TTL
├── prediction.utils.ts          # timeframe type-guard
├── prediction.engine.ts         # probability / momentum / trend / volatility model
├── prediction-score.engine.ts   # confidence calibration + scenarios + final scoring
├── prediction-registry.ts       # LRU(200) in-memory registry, top-by-probability
├── prediction.service.ts        # pipeline orchestration (1 provider req / tf)
├── prediction.controller.ts     # GET /prediction/:ticker | GET /prediction/top | POST /prediction/refresh
├── prediction.module.ts         # NestJS module wiring
├── index.ts                     # barrel exports
├── dto/prediction.dto.ts        # Swagger DTOs
├── prediction-engine.spec.ts
├── prediction-score.engine.spec.ts
├── prediction-registry.spec.ts
├── prediction.service.spec.ts
└── prediction.controller.spec.ts
```

### Reuse summary

| Engine | Reused how | File |
|--------|-----------|------|
| Historical Engine | `MarketDataService.fetchData` (single per timeframe) | `prediction.service.ts` |
| Indicator Engine | `IndicatorEngine.calculateAll` once → shared with EntryZone input | `prediction.service.ts` |
| Backtest Engine | `CoreBacktestEngine.run(ohlcv, tf, momentumStrategy)` for win-rate calibration | `prediction.service.ts` |
| Catalyst Engine | `CatalystService.getCatalyst` (cached read) | `prediction.service.ts` |
| Smart Money Engine | `SmartMoneyService.getSmartMoney` (cached read) | `prediction.service.ts` |
| Entry Zone Engine | `EntryZoneEngine.evaluate` for entry/stop/target zones | `prediction.service.ts` |
| Verification AI | `VerificationAIService.getVerification` (cached read) | `prediction.service.ts` |
| Market Structure | `MarketStructureEngine.analyze` | `prediction.service.ts` |
| Cache Layer | global `CacheService` (namespace `research`) | `prediction.service.ts` |

> **Architecture note (non-breaking):** `CoreBacktestEngine` was added to
> `BacktestModule.exports` so the Prediction module can reuse it directly.
> No existing engine was modified or redesigned.

---

## 2. Timeframes

8 prediction horizons are supported. Each maps to an underlying data timeframe that the
Indicator Engine / Backtest Engine already understand (`'4h' | '1d' | '1w' | '1m' | '3m' | '6m'`).
`1h` / `2h` ride on the `4h` data timeframe (the closest supported intraday bar) — this is
documented in `dataTimeframe` on every result.

| Prediction TF | Data TF | Holding window |
|---------------|---------|----------------|
| 1h            | 4h      | 4 hours        |
| 2h            | 4h      | 8 hours        |
| 4h            | 4h      | 16 hours       |
| 1d            | 1d      | 4 days         |
| 1w            | 1w      | 2 weeks        |
| 1m            | 1m      | 1 month        |
| 3m            | 3m      | 3 months       |
| 6m            | 6m      | 6 months       |

---

## 3. Probability Model (deterministic)

`PredictionEngine.evaluate` produces feature sub-scores (0–100) from **cached indicator
results** + structure + smart-money results. Nothing is recomputed.

| Feature | Source | Method |
|---------|--------|--------|
| Trend score | SMA20/50/200, EMA20/50 alignment, ADX, MarketStructure.trend | weighted deltas from a 50 baseline |
| Momentum score | RSI, MACD histogram, ROC(10) | weighted deltas from a 50 baseline |
| Money-flow score | `SmartMoney.moneyFlowScore` ×0.6 + `smartMoneyScore` ×0.4 | |
| Catalyst feature | `Catalyst.catalystScore` × direction of `expectedImpact` | bullish/bearish/neutral weighting |
| Verification feature | `Verification.verified` + `verificationScore` | verdict base × score scale |
| Mean-reversion (neutral driver) | RSI 40–60, price near SMA20 (≤0.5×ATR), Bollinger %B 0.3–0.7, ADX<25 | 0–1 |

**Probability math (always sums to 100):**
- `bullishRaw = Σ(feature × weight)` (≈ 50 centered).
- `bearishRaw = 100 − bullishRaw`.
- `neutralShare = min(0.5, meanReversion × 0.5)` — range-bound setups pull probability to neutral.
- `bullishProbability = round(bullishRaw × (1 − neutralShare))`
- `bearishProbability = round(bearishRaw × (1 − neutralShare))`
- `neutralProbability = 100 − bullish − bearish`.

---

## 4. Risk / Volatility / Return

- **Expected volatility** = `ATR% × √(holdingBars)` — per-bar ATR scaled to the horizon via
  square-root-of-time (deterministic).
- **Risk score** = `volatilityScore×0.5 + distributionScore×0.3 + (100−liquidityScore)×0.2`
  → `low` (<35) / `medium` (35–60) / `high` (>60).
- **Expected return** is derived from the **Entry Zone Engine** target1 vs entry midpoint
  (`(target1 − entryMid)/entryMid × 100`), falling back to the feature-level drift estimate
  `(bullish − bearish)/100 × expectedVolatility`.
- **Liquidity quality** is mirrored from the Smart Money `liquidity` label, with a volume-fallback.

---

## 5. Scenario Engine

Every result emits three scenarios (bullish / neutral / bearish) with probability, trigger and
expected return:

- **Bullish** — `probability = bullishProbability`; trigger: price stays above EMA/SMA structure &
  momentum stays positive; return = move to `target1`.
- **Neutral** — `probability = neutralProbability`; trigger: price consolidates in support–resistance
  range; return ≈ 0.
- **Bearish** — `probability = bearishProbability`; trigger: price breaks below `stopZone`; return =
  move to stop.

---

## 6. Confidence Calibration

The Backtest Engine is reused with a **momentum strategy** (`MACD_CROSSOVER` entry, `TRAILING_STOP`
exit) over the same `OHLCV` used for the prediction, to obtain historical accuracy:

- `winRate`, `totalTrades`, `sharpeRatio` → `backtestAccuracy` (exposed in the result and used by
  R2-026).

Calibration formula:
```
agreement   = |bullishProbability − bearishProbability|
base        = clamp(40 + agreement × 0.5) + dataQualityBonus(5)
if backtest.isValid && totalTrades >= 3:
    confidence = base × 0.7 + winRate × 0.3          # historical calibration
if verification != null:
    confidence += verified==TRUE ? +5  :  (verified==FALSE ? −10 : 0)
if catalyst != null:
    confidence = confidence × 0.9 + catalyst.confidence × 0.1
confidence = clamp(round(confidence))
```

No learning engine is implemented yet — only the `backtestAccuracy` interface is prepared, ready
for future Portfolio Intelligence consumption (per sprint constraints).

---

## 7. API

All endpoints are `@Public()`, identical shape to other analysis engines.

| Method | Route | Query params | Description |
|--------|-------|--------------|-------------|
| GET | `/prediction/:ticker` | `timeframe` (1h\|2h\|4h\|1d\|1w\|1m\|3m\|6m, default 1d) | Single ticker, single timeframe |
| GET | `/prediction/top` | `limit` (default 10) | Top predictions sorted by bullish probability |
| POST | `/prediction/refresh` | `ticker` (required), `timeframe` (optional) | Force a deterministic refresh |

Literal routes (`top`, `refresh`) are declared before the `:ticker` parameter route.

### Example — GET /prediction/ASELS.IS?timeframe=1d

```json
{
  "ticker": "ASELS.IS",
  "timeframe": "1d",
  "dataTimeframe": "1d",
  "bullishProbability": 91,
  "bearishProbability": 9,
  "neutralProbability": 0,
  "confidence": 92,
  "trendStrength": "strong",
  "trendDirection": "up",
  "momentum": "strong_bullish",
  "expectedReturn": 6.4,
  "expectedVolatility": 2.1,
  "risk": "low",
  "riskScore": 22,
  "liquidityQuality": "high",
  "expectedHoldingPeriod": { "value": 4, "unit": "days" },
  "entryZone": { "min": 158, "max": 161 },
  "stopZone": 154,
  "target1": 170,
  "target2": 177,
  "riskRewardRatio": 1.7,
  "scenarios": [
    { "bias": "bullish",   "title": "Yükseliş Senaryosu", "probability": 91, "expectedReturn": 6.4 },
    { "bias": "neutral",   "title": "Yatay Senaryo",       "probability": 0,  "expectedReturn": 0 },
    { "bias": "bearish",   "title": "Düşüş Senaryosu",    "probability": 9,  "expectedReturn": -3.6 }
  ],
  "signals": [ { "type": "trend_bullish", "strength": 76, "description": "Fiyat yapısı yükseliş eğiliminde" } ],
  "backtestAccuracy": { "winRate": 68, "totalTrades": 12, "sharpeRatio": 1.4, "isValid": true },
  "verification": "TRUE",
  "catalystScore": 90,
  "smartMoneyScore": 93,
  "generatedAt": "2026-08-07T12:00:00.000Z",
  "isValid": true
}
```

---

## 8. Performance Guarantees

- **ZERO duplicated provider requests** — `MarketDataService.fetchData` is called exactly
  **once per timeframe** (verified by `prediction.service.spec.ts`).
- **ZERO duplicated indicator calculations** — `IndicatorEngine.calculateAll` is called exactly
  **once** and its output feeds both the probability model and the Entry Zone input
  (verified by `prediction.service.spec.ts`).
- Smart Money / Catalyst / Verification engines are consumed through their **cached service
  reads** — no re-fetches.
- Cache: global `CacheService` (namespace `research`, key `prediction:{TICKER}:{TF}`, TTL 10 min)
  plus an in-memory `PredictionRegistry` (LRU 200, keyed by `ticker:timeframe`).

---

## 9. Future Integration (R2-026+)

`PredictionResult` is a stable, serializable interface exposing `bullishProbability`,
`confidence`, `expectedReturn`, `risk`, `backtestAccuracy`, `scenarios`, `entryZone`,
`stopZone`, `target1`, `target2` and `signals`. R2-026 Early Opportunity Engine can read
predictions directly from `PredictionService.getPrediction(ticker)` /
`PredictionRegistry` without recomputing probabilities. R2-027 Portfolio Intelligence will
consume the stored `backtestAccuracy` + `scenarios` for calibration history.
