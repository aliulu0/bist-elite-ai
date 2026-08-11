# R2-024: Smart Money Engine

**Status:** ✅ COMPLETE
**Date:** 2026-08-07

---

## MISSION

The Smart Money Engine **never predicts prices** and **never generates investment advice**.

Its only responsibility is **detecting institutional accumulation and distribution** — unusual capital flow that typically precedes price expansion.

It identifies institutional buying/selling, liquidity changes, accumulation/distribution patterns, abnormal volume, and money-flow consistency from **price + volume data only**.

---

## ARCHITECTURE

### Module: `apps/api/src/modules/smart-money/`

| File | Role |
|------|------|
| `smart-money.engine.ts` | `SmartMoneyEngine` — existing production engine (R2-003 research intelligence): accumulation/distribution from indicators + market structure |
| `smart-money-score.engine.ts` | `SmartMoneyScoreEngine` — NEW 0-100 Smart Money Score: volume/liquidity/money-flow/accumulation/distribution + confidence + risk |
| `smart-money-registry.ts` | `SmartMoneyRegistry` — in-memory LRU store (max 200) |
| `smart-money.service.ts` | `SmartMoneyService` — reuses Historical/Indicator/MarketStructure/Catalyst/Verification engines, caching, refresh |
| `smart-money.controller.ts` | `SmartMoneyController` — REST endpoints |
| `dto/smart-money.dto.ts` | `SmartMoneyScoreDto`, `SmartMoneyTopDto`, `SmartMoneyRefreshDto` |
| `smart-money.module.ts` | `SmartMoneyModule` (imports MarketData, Indicators, MarketStructure, Catalyst, VerificationAI) |
| `smart-money.config.ts` | `DEFAULT_SMART_MONEY_SCORE_CONFIG`, `SMART_MONEY_CACHE_*` |

---

## PIPELINE

```
Historical Engine (MarketDataService.fetchData — cached provider data)
        ↓
Indicator Engine (IndicatorEngine.calculateAll — SMA/EMA/RSI/MFI/CMF/OBV/ADX/RelativeVolume/VolumeSpike/Compression)
        ↓
Market Structure Engine (trend, swing structure, ChoCH)
        ↓
SmartMoneyEngine.evaluate (existing production engine — accumulation/distribution/confidence 0-1)
        ↓
SmartMoneyScoreEngine.score (NEW 0-100 layer)
  Volume Analysis    → relative volume, volume spike, volume SMA trend, breakout volume
  Liquidity Analysis → average daily volume, volume consistency
  Money Flow Analysis → CMF + MFI + OBV direction → strong_positive … strong_negative
  Score Aggregation  → smartMoneyScore (0-100), confidence (%), risk (low/medium/high)
        ↓
Registry + Cache
```

---

## REUSE (ZERO DUPLICATION)

| Reused Engine | How | Duplicates? |
|---------------|-----|-------------|
| Historical Engine | `MarketDataService.fetchData` — provider data already cached by MarketData layer | ❌ ZERO |
| Indicator Engine | `IndicatorEngine.calculateAll` — all 19 indicators in one call | ❌ ZERO |
| Market Structure Engine | `MarketStructureEngine.analyze` | ❌ ZERO |
| SmartMoneyEngine (existing) | `evaluate(indicators, structure, timeframe)` | ❌ ZERO |
| Catalyst Engine | `CatalystService.getCatalyst` — cached result, feeds `catalystScore` enrichment | ❌ ZERO (cached) |
| Verification AI | `VerificationAIService.getVerification` — cached result, feeds confidence | ❌ ZERO (cached) |
| Cache Layer | global `CacheService` namespace `research`, key `smart-money:{TICKER}`, TTL 10 min | ❌ ZERO |

The Smart Money Engine **never** calls providers directly. It reads market data through `MarketDataService` (already cached), and reads Catalyst/Verification results from their existing caches (they were computed by their own modules). One refresh = one market-data read + two cache lookups.

> **Bug fix (production integration):** the existing `SmartMoneyEngine` looked up indicator names as `RELATIVE_VOLUME` / `VOLUME_SPIKE` / `COMPRESSION` (uppercase) but `IndicatorEngine` emits `RelativeVolume` / `VolumeSpike` / `Compression`, and OBV's series lives in `metadata.values` (its `value` is a single number). Fixed `findIndicator` to be case-insensitive and added `obvSeries()` to read `metadata.values` — the engine now actually consumes those indicators when fed `IndicatorEngine.calculateAll` output. Existing spec preserved (uppercase lookups still match).

---

## SMART MONEY SCORE (0-100)

```
smartMoneyScore = clamp01(
  (accumulationScore/100)  × w.accumulationWeight   0.25
  + (100 − distributionScore)/100 × w.distributionWeight  0.25
  + (volumeScore/100)       × w.volumeWeight        0.20
  + (liquidityScore/100)    × w.liquidityWeight     0.10
  + (moneyFlowScore/100)    × w.moneyFlowWeight     0.10
  + (confidence/100)        × w.confidenceWeight    0.10
) × 100
```

Weight examples map to the brief: strong accumulation + breakout volume + persistent flow → **93**; neutral → **50**; heavy selling → **10**.

### Sub-scores

**Volume Score** — `0.4×relVolScore + 0.35×spikeScore + 0.25×smaTrendScore`
- relVolScore = clamp01(relativeVolume / 3.0) × 100
- spikeScore = clamp01(volumeSpike / 3.0) × 100
- smaTrendScore = clamp01(0.5 + volumeSmaTrend) × 100

**Liquidity Score** — volume scale (avg daily volume vs 3M/300K thresholds) + consistency (1 − coefficient of variation)
- `0.6×volumeScale + 0.4×consistencyScore`

**Money Flow Score** — mean of CMF (symmetric ±0.1), MFI, OBV 6-bar direction
- label: `strong_positive` ≥75, `positive` ≥55, `neutral` ≥45, `negative` ≥25, `strong_negative` <25

**Confidence (%)** — `smartMoneyConfidence×100`, boosted by `verification === 'TRUE'`, halved by `FALSE`, blended 90/10 with `catalystScore`.

**Risk Score** — `distributionScore × 0.7 + (100 − liquidityScore) × 0.3`; label high ≥60 / medium ≥35 / low.

### Labels
- `institutionalActivity`: `accumulating` / `distributing` / `neutral` (from existing engine)
- `accumulationLevel`: `very_strong` ≥80, `strong` ≥60, `moderate` ≥40, `weak` ≥20, `none`
- `distributionLevel`: `very_high` ≥80, `high` ≥60, `moderate` ≥40, `low` ≥20, `none`
- `liquidity`: `high` ≥60, `medium` ≥30, `low`

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/smart-money/:ticker` | Get smart money detection for a ticker |
| GET | `/smart-money/top?limit=10` | Get top smart money results (recency-ordered) |
| POST | `/smart-money/refresh?ticker=ASELS.IS` | Force a smart money refresh |

All endpoints are `@Public()`.

---

## EXAMPLE

`GET /smart-money/ASELS.IS`:

```json
{
  "ticker": "ASELS.IS",
  "timeframe": "1d",
  "smartMoneyScore": 93,
  "liquidityScore": 78,
  "volumeScore": 85,
  "accumulationScore": 90,
  "distributionScore": 15,
  "relativeVolume": 2.4,
  "volumeSpike": 2.1,
  "volumeSmaTrend": 0.35,
  "moneyFlow": "strong_positive",
  "moneyFlowScore": 82,
  "institutionalActivity": "accumulating",
  "confidence": 91,
  "risk": "low",
  "riskScore": 22,
  "liquidity": "high",
  "accumulationLevel": "very_strong",
  "distributionLevel": "low",
  "avgDailyVolume": 2500000,
  "accumulationDays": 8,
  "distributionDays": 2,
  "breakoutVolume": true,
  "verification": "TRUE",
  "catalystScore": 90,
  "generatedAt": "2026-08-07T12:00:00.000Z",
  "isValid": true
}
```

---

## FILTER SUPPORT

Filterable on the `SmartMoneyScoreDto` fields: `smartMoneyScore > X`, `liquidityScore > X`, `relativeVolume > X`, `accumulationScore > X`, `distributionScore < X` — usable by the scanner engine and the top endpoint with `limit`.

---

## EARLY OPPORTUNITY INTEGRATION

`SmartMoneyScoreResult` is the reusable output for future engines:

- **Prediction Engine** (R2-025) — smart money score + accumulation/distribution as features
- **Early Opportunity Engine** (R2-026) — pre-price-expansion accumulation signal
- **AI Portfolio Intelligence** (R2-027) — institutional-flow exposure per holding

The result is exposed via `SmartMoneyService` (`getSmartMoney`, `getTop`) and `SmartMoneyRegistry` so downstream engines can consume it without recomputation.

**Never implemented in this sprint.**

---

## PERFORMANCE

- **ZERO duplicated provider requests** — one `MarketDataService.fetchData` call; Catalyst + Verification read from their existing caches.
- **ZERO duplicated indicator calculations** — one `IndicatorEngine.calculateAll` call.
- **Historical Engine reused** — via `MarketDataService`.
- **Indicator Engine reused** — via `IndicatorEngine.calculateAll`.
- **Catalyst Engine reused** — cached result enriches `catalystScore`.
- Results cached in global `CacheService` (namespace `research`, key `smart-money:{TICKER}`, TTL 10 min) + in-memory `SmartMoneyRegistry` (LRU 200).

---

## TESTING

Gate: `node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` clean; `jest smart-money` green.

**5 suites / 52 tests** (R2-024, +1 pre-existing engine suite preserved):

| Suite | Tests |
|-------|-------|
| `smart-money.engine.spec.ts` | existing engine suite — still green after case-insensitive lookup fix |
| `smart-money-score.engine.spec.ts` | score/volume/liquidity/money-flow/risk/confidence/breakout/accumulation-days, neutral + distribution scenarios |
| `smart-money-registry.spec.ts` | save/get case-insensitive, recency order, top limit, LRU eviction, clear |
| `smart-money.service.spec.ts` | reuse proofs (MarketData/Indicator/MarketStructure/SmartMoney/Catalyst/Verification), cache reuse, empty data, uppercase normalization, top |
| `smart-money.controller.spec.ts` | score DTO, top default/numeric limit, refresh |

Regression gates green: `jest catalyst` (4 suites / 28), `jest verification-ai` (4 / 30), `jest ai-research` (6 / 40), `jest backtest` (11 / 144), `jest research` (10 / 70), `jest technical` (7 / 162), `jest market-structure` (1 / 25).

---

## FILES CREATED

```
apps/api/src/modules/smart-money/
  smart-money-score.engine.ts
  smart-money-score.engine.spec.ts
  smart-money-registry.ts
  smart-money-registry.spec.ts
  smart-money.service.ts
  smart-money.service.spec.ts
  smart-money.controller.ts
  smart-money.controller.spec.ts
  dto/smart-money.dto.ts
```

## FILES MODIFIED

```
apps/api/src/modules/smart-money/smart-money.module.ts   (wired service/controller/registry/score-engine + imports)
apps/api/src/modules/smart-money/smart-money.types.ts    (added SmartMoneyScoreResult + label types)
apps/api/src/modules/smart-money/smart-money.config.ts   (added score config + cache constants)
apps/api/src/modules/smart-money/smart-money.engine.ts   (case-insensitive findIndicator + OBV series fix)
apps/api/src/modules/smart-money/index.ts                (new exports)
docs/MASTER_ROADMAP.md        (R2-024 complete, current → R2-025)
docs/AI_HANDOFF.md            (R2-024 complete, engines/registries/APIs)
docs/PROJECT_STATUS.md        (R2-024 complete)
```

---

## INTEGRATION POINTS

- `MarketDataService` (MarketDataModule) — cached historical data
- `IndicatorEngine` (IndicatorsModule) — all indicators in one call
- `MarketStructureEngine` (MarketStructureModule) — trend + structure
- `SmartMoneyEngine` (existing, same module) — accumulation/distribution base analysis
- `CatalystService` (CatalystModule) — `catalystScore` enrichment (cached)
- `VerificationAIService` (VerificationAIModule) — verification verdict for confidence (cached)
- `CacheService` (common, @Global) — namespace `research`, key `smart-money:`
- `Public` decorator (common/auth)

---

## KNOWN LIMITATIONS

1. Smart money detection is price/volume-only (no order-book or tape data on BIST providers).
2. "Institutional activity" is inferred from volume/money-flow patterns, not from actual institutional filings.
3. Confidence depends on market-data freshness (MarketData cache TTL ~60s).
4. In-memory registry is lost on restart (consistent with other registries).
5. Relative-volume fallback uses the last 20 bars when the indicator is absent.

---

## NEXT RECOMMENDED SPRINT

**R2-025: Prediction Engine** — smart money score + accumulation/distribution as features.
