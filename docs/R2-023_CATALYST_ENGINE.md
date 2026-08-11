# R2-023: Catalyst Detection Engine

**Status:** ✅ COMPLETE
**Date:** 2026-08-07

---

## MISSION

The Catalyst Detection Engine **never predicts** and **never generates investment advice**.

Its only responsibility is **scoring corporate-catalyst news** (tenders, dividends, buybacks, contracts, etc.) on top of already-verified research.

Every news source collected by the AI Research Hub and verified by Verification AI is categorized into one of 22 catalyst categories, weighted by impact, and aggregated into a ticker-level catalyst score (0-100) with an expected-impact label.

---

## ARCHITECTURE

### Module: `apps/api/src/modules/catalyst/`

| File | Role |
|------|------|
| `catalyst.types.ts` | `CatalystCategory` (22), `CatalystEvent`, `CatalystResult`, `CatalystDashboard`, `ExpectedImpact`, `TimeHorizon` |
| `catalyst.config.ts` | `CATALYST_CATEGORIES` weights/impact/horizon/keywords, `CATALYST_CACHE_*`, `categorizeTitle`, `normalizeText` (tr-TR) |
| `catalyst-engine.ts` | `CatalystEngine` — normalize/dedupe → categorize → importance → confidence → `CatalystEvent[]` |
| `catalyst-score-engine.ts` | `CatalystScoreEngine` — per-event score, aggregate, `resultFor` |
| `catalyst-registry.ts` | `CatalystRegistry` — in-memory LRU store (max 200) |
| `catalyst.service.ts` | `CatalystService` — reuses AI Research Hub + Verification AI, caching, refresh, dashboard |
| `catalyst.controller.ts` | `CatalystController` — REST endpoints |
| `dto/catalyst.dto.ts` | `CatalystEventDto`, `CatalystResultDto`, `CatalystTopDto`, `CatalystRefreshDto` |
| `catalyst.module.ts` | `CatalystModule` (imports `AIResearchHubModule`, `VerificationAIModule`) |

---

## CATALYST FLOW

```
AI Research Hub (cached consensus)
        ↓ (parallel)
Verification AI (cached verification)
        ↓
CatalystEngine.detect({ consensus, verification })
  Normalize sources (dedupe by url)
  Categorize each title → CatalystCategory (keyword match, tr-TR normalized)
  Importance (category impact × verified status → CRITICAL/HIGH/MEDIUM/LOW)
  Confidence (verified +0.35, trusted +0.15, conflicting −0.25, importance +0.05)
  → CatalystEvent[] (verified flag, verificationScore, expectedImpact, timeHorizon)
        ↓
CatalystScoreEngine.resultFor(ticker, events, rawSources)
  scoreEvent  (weight × importance × verification × confidence, clamped 0-100)
  aggregate   (0.6×verified + 0.4×total, impact label)
  → CatalystResult (catalystScore, confidence, expectedImpact, events sorted desc)
        ↓
CacheService (namespace research, key catalyst:{TICKER}, TTL 10 min)
        + CatalystRegistry (LRU 200)
```

---

## CATEGORY WEIGHTS

| Category | Weight | Impact | Horizon |
|----------|--------|--------|---------|
| tender_win | 95 | very_bullish | 1_week |
| defense_contract | 92 | very_bullish | 1_week |
| new_investment | 90 | very_bullish | 3_months |
| large_customer_contract | 90 | very_bullish | 1_month |
| factory_opening | 88 | bullish | 3_months |
| capacity_expansion | 85 | bullish | 3_months |
| export_agreement | 82 | bullish | 1_month |
| patent | 80 | bullish | 6_months |
| government_incentive | 78 | bullish | 3_months |
| strategic_partnership | 75 | bullish | 1_month |
| foreign_investment | 72 | bullish | 1_month |
| capital_increase | 70 | neutral | 1_month |
| bonus_issue | 70 | bullish | 1_week |
| share_buyback | 68 | bullish | 1_month |
| index_inclusion | 68 | bullish | 1_month |
| dividend | 65 | bullish | 1_week |
| credit_rating | 62 | bullish | 1_month |
| ceo_change | 55 | neutral | 1_month |
| rnd | 50 | neutral | 6_months |
| board_change | 45 | neutral | 1_month |
| sector_rotation | 40 | neutral | 1_month |
| minor_news | 20 | neutral | 1_week |

---

## SCORING

**Event score** (0-100, clamped):

```
raw = categoryWeight × importanceFactor × verificationFactor × confidenceFactor

importanceFactor: CRITICAL 1.2 / HIGH 1.1 / MEDIUM 1 / LOW 0.8
verificationFactor: verified 1 / unverified 0.55
confidenceFactor: 0.7 + confidence × 0.3
```

**Aggregate score** (0-100):

```
catalystScore = min(100, 0.6 × verifiedWeight + 0.4 × totalWeight)
```

**Impact label** (weighted average of event impacts):

- `very_bullish` ≥ 4.2
- `bullish` ≥ 3
- `bearish` ≤ 2
- `very_bearish` ≤ 0.8
- `neutral` otherwise

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/catalyst/:ticker` | Get catalyst detection for a ticker |
| GET | `/catalyst/top?limit=10` | Get top catalyst results (recency-ordered) |
| POST | `/catalyst/refresh?ticker=ASELS.IS` | Force a catalyst refresh |

All endpoints are `@Public()`.

---

## EXAMPLE

`GET /catalyst/ASELS.IS` (defense contract, verified):

```json
{
  "ticker": "ASELS.IS",
  "catalystScore": 94,
  "confidence": 91,
  "expectedImpact": "very_bullish",
  "verifiedCount": 1,
  "totalCount": 1,
  "events": [
    {
      "id": "cat-ASELS.IS-0-1a2b",
      "category": "defense_contract",
      "title": "Yeni savunma ihalesi kazanıldı",
      "importance": "critical",
      "verified": true,
      "verificationScore": 92,
      "expectedImpact": "very_bullish",
      "timeHorizon": "1_week",
      "confidence": 0.91,
      "catalystScore": 95,
      "keywords": ["savunma ihale"]
    }
  ]
}
```

---

## PERFORMANCE

- **ZERO duplicated provider requests** — Catalyst never calls providers directly; it consumes the AI Research Hub's cached consensus.
- **ZERO duplicated verification requests** — it consumes Verification AI's cached result.
- Both inputs fetched in **parallel** via `Promise.all` in `refreshCatalyst`.
- Results cached in global `CacheService` (namespace `research`, key `catalyst:{TICKER}`, TTL 10 min) + in-memory `CatalystRegistry` (LRU 200).

---

## TESTING

Gate: `node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` clean; `jest catalyst` green.

**4 suites / 28 tests** (R2-023):

| Suite | Tests |
|-------|-------|
| `catalyst-engine.spec.ts` | normalize/dedupe, categorize (tender/dividend/patent/factory/minor_news fallback), detect with category/impact/horizon/confidence, unverified flag on FALSE, empty sources |
| `catalyst-score-engine.spec.ts` | verified-critical ≥ 85, aggregate ≥ 80 for verified events, zero score for empty, sort descending |
| `catalyst.service.spec.ts` | reuses hub + verification, caching (2 cached calls → 1 hub + 1 verification call), refresh, dashboard |
| `catalyst.controller.spec.ts` | result DTO, top with default/numeric limit, refresh |

Regression gates green: `jest verification-ai` (4 suites / 30 tests), `jest ai-research` (6 suites / 40 tests), `jest backtest` (11 suites / 144 tests), `jest research` (10 suites / 70 tests).

---

## FILES CREATED

```
apps/api/src/modules/catalyst/
  catalyst.types.ts
  catalyst.config.ts
  catalyst-engine.ts
  catalyst-engine.spec.ts
  catalyst-score-engine.ts
  catalyst-score-engine.spec.ts
  catalyst-registry.ts
  catalyst-registry.spec.ts
  catalyst.service.ts
  catalyst.service.spec.ts
  catalyst.controller.ts
  catalyst.controller.spec.ts
  catalyst.module.ts
  index.ts
  dto/catalyst.dto.ts
```

## FILES MODIFIED

```
apps/api/src/app.module.ts        (register CatalystModule)
docs/MASTER_ROADMAP.md            (R2-023 complete, re-scoped to Catalyst Detection Engine)
docs/AI_HANDOFF.md                (R2-023 complete, engines/registries/APIs)
docs/PROJECT_STATUS.md            (R2-023 complete)
```

---

## INTEGRATION POINTS

- `AIResearchHubService` (AIResearchHubModule) — cached consensus as the sole news source
- `VerificationAIService` (VerificationAIModule) — cached verification for trust/score
- `CacheService` (common) — catalyst cache namespace `research`, key prefix `catalyst:`
- `Public` decorator (common/auth)
- Base `CatalystDetectionService` (research module, R2-007) — retained and untouched; R2-023 adds a new scoring layer on top of verified research

---

## KNOWN LIMITATIONS

1. Categorization is keyword-based (deterministic); keyword list may miss novel phrasing → falls back to `minor_news`.
2. Catalyst confidence depends on hub consensus freshness (hub TTL 5 min).
3. In-memory registry is lost on restart (consistent with other registries).
4. No persistence of catalyst history.

---

## NEXT RECOMMENDED SPRINT

**R2-024: Fintables Integration** — Fintables data ingestion, financial statements, provider health monitoring.

TradingView Integration remains out of scope (⚠ not implemented).
