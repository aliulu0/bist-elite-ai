# R2-018 — AI Analyst Engine

## Overview

The AI Analyst Engine is **not** GPT, LLM, or text generation. It is a **deterministic explanation layer** that produces Turkish-language analyst summaries by applying fixed rules to the outputs of every upstream production engine in the pipeline. Every explanation is built from structured data — never invented text.

Identical inputs always produce identical outputs.

## Pipeline

```
Scanner
  ↓
Strategy
  ↓
Score
  ↓
Decision
  ↓
Opportunity
  ↓
Elite Score
  ↓
Tomorrow
  ↓
Entry Zone
  ↓
AI Analyst Engine (deterministic explanation layer)
```

The Analyst Engine reads from every upstream registry and repository, applies deterministic rules, and produces a full analyst summary per stock.

## Rule System

The `AnalystExplanationEngine` applies deterministic if/then rules to structured inputs. Each section has specific thresholds and conditions:

### Genel Analiz
- Trend direction (UPTREND/DOWNTREND/SIDEWAYS) from MarketStructureEngine
- Opportunity level (ÇOK_GÜÇLÜ_FIRSAT, GÜÇLÜ_FIRSAT, etc.)
- Elite Score daily horizon score

### Teknik Analiz
- MACD histogram sign → pozitif/negatif
- RSI ranges → aşırı alım (>75), aşırı satım (<30), normal
- Price vs EMA20 → üzerinde/altında
- Price vs SMA50 → üzerinde/altında
- Price vs Bollinger Bands → üst bant/alt bant/içinde

### Temel Analiz
- Fundamental score from OpportunityResult
- Technical score
- Quality score

### Risk Analizi
- Risk score from OpportunityResult (high = low risk)
- ATR level → volatilite yüksek/düşük

### Momentum Analizi
- Momentum score from OpportunityResult
- MomentumOscillator indicator value
- ROC indicator value

### Trend Analizi
- Trend direction from MarketStructureEngine

### Likidite Analizi
- Liquidity score from OpportunityResult
- RelativeVolume indicator → yıllık ortalamanın üzerinde/normal/altında

### Verification Analizi
- VerifiedCount / TotalEvidence ratio → doğrulanmış/kısmi/yok
- Conflicts count → çelişki tespit edildi
- Average confidence

### Catalyst Analizi
- Bullish catalysts → Pozitif katalizör
- Bearish catalysts → Negatif katalizör
- No catalysts → Katalizör mevcut değil

### Entry Yorumu / Stop Yorumu / Target Yorumu
- From EntryZoneResult (idealEntryZone, stopLoss, target1/2/3)

### Strengths / Weaknesses / Warnings / Positive Signals / Negative Signals
- Merged from DecisionResult, OpportunityResult, EntryZoneResult, VerificationResult, CatalystResultDto
- Deduplicated via Set

## Explanation Flow

```
AnalystService.computeForTicker(ticker)
  → Fetch historical OHLCV (cached)
  → IndicatorEngine.calculateAll(ohlcv)
  → MarketStructureEngine.analyze(ohlcv)
  → Read OpportunityRegistry.get(ticker)
  → Read EliteScoreRegistry.get(ticker)
  → Read TomorrowRegistry.get(ticker)
  → Read DecisionRegistry.get(ticker)
  → Read EntryRegistry.get(ticker) (via EntryService.getCached)
  → Read VerificationRepository.getVerificationResult(ticker)
  → Read ResearchIntelligenceService.getCompanyResearch(ticker) → catalysts
  → Build AnalystInput
  → AnalystEngine.evaluate(input)
    → AnalystExplanationEngine.generate(input)
      → Apply deterministic rules per section
      → Return AnalystResult
  → Store in AnalystRegistry
  → Return AnalystResult
```

## API

| Method | Route | Description |
|---|---|---|
| GET | `/analysis/:ticker` | AI analyst summary for one stock (404 if uncomputable) |
| GET | `/analysis/top?limit=10` | Strongest AI analyst results, confidence-ranked |
| GET | `/analysis/batch` | All currently cached analyst results |
| POST | `/analysis/batch` | Evaluate a batch of tickers through the engine |

Result payload includes all 13 explanation sections plus Strengths[], Weaknesses[], Warnings[], PositiveSignals[], NegativeSignals[].

## Integration Points

### Scanner Results
Every `EliteScannerResult` now carries an `analyst?: AnalystResult | null` field. `ScannerService.enrichWithDecisions` calls `analystService.computeForTicker()` per result. `ScannerResultDto` exposes the `analyst` field.

### Opportunity Center Cards
Every `OpportunityCenterCard` now carries an `analyst: AnalystResult | null` field. `OpportunityCenterService.sync()` calls `analystService.getCached()` per ticker. `OpportunityCenterCardDto` exposes the `analyst` field. `toOpportunityCenterCard()` accepts the optional `analyst` parameter.

## File Map

```
apps/api/src/modules/analyst/
├── analyst.types.ts            AnalystInput, AnalystResult, AnalystRegistryEntry
├── analyst.config.ts           Thresholds, weights, limits
├── analyst-explanation.engine.ts AnalystExplanationEngine (deterministic rules)
├── analyst.engine.ts           AnalystEngine (thin orchestrator)
├── analyst.registry.ts         AnalystRegistry (Map + date ranking)
├── analyst.service.ts          AnalystService (data fetching + orchestration)
├── analyst.dto.ts              Swagger DTOs (result, top/batch/calculate)
├── analyst.controller.ts       /analysis routes
├── analyst.module.ts           imports all upstream modules
├── index.ts                    barrel exports
└── analyst.spec.ts             47 tests
```

Registered in `AppModule` as `AiAnalystModule` (collision-safe naming per R2-013/015/016/017 precedent).

## Reuse (zero duplicated provider requests / zero duplicated indicator calculations)

- Historical prices: `MarketDataService.fetchData` via `MarketDataCacheService.getOrSet`
- Indicators: `IndicatorEngine.calculateAll` only
- Market structure: `MarketStructureEngine.analyze` only
- Symbols: `SymbolRegistryService`
- Opportunity (R2-013), Elite Score (R2-015), Tomorrow (R2-016), Entry Zone (R2-017): read from their registries
- Verification: `VerificationRepository.getVerificationResult` (from ResearchModule)
- Catalysts: `ResearchIntelligenceService.getCompanyResearch` (from ResearchModule)
- Decision (R2-012): read from `DecisionRegistry`

## Out of Scope (not implemented)

Prediction, ML, GPT, portfolio, backtesting, scheduler, notifications, UI redesign.

## Verification

- Build: `pnpm --filter @bist-elite/api build` — GREEN
- Analyst suite: `jest analyst` — 47/47 GREEN
- All affected suites (scanner, opportunity-center, tomorrow, ai-elite-score, decision, ai-opportunity): 394/394 GREEN
