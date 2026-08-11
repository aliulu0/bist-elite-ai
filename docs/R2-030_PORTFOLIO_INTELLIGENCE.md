# R2-030 — Portfolio Intelligence Engine & Portfolio Dashboard

## Overview

The Portfolio Intelligence Engine produces **ONE unified portfolio intelligence view** for a
personal portfolio by consuming the intelligence already produced by the platform. It is NOT a
new opportunity detector, NOT an independent prediction system, and NOT a broker. It aggregates
Early Opportunity Intelligence, Multi-Timeframe Opportunity, Smart Money, Catalyst, Verification
AI, Elite Score, Self-Learning, Backtest, Market Data Orchestrator, Symbol Registry and Cache into
a deterministic, explainable (Turkish) portfolio decision-support layer. It never executes trades.

## Architecture

```
apps/api/src/modules/portfolio-intelligence/
├── portfolio-intelligence.config.ts      # Centralized documented weights, thresholds, cache TTL
├── portfolio-intelligence.types.ts       # Full type model
├── portfolio-intelligence.engine.ts      # Pure deterministic engine (score/risk/rebalance/scenarios/horizons)
├── portfolio-intelligence.registry.ts    # Position store + up-to-50 analysis snapshots + comparison
├── portfolio-intelligence.service.ts     # Orchestration, cache, sub-reports, learning, telegram report
├── portfolio-intelligence.controller.ts  # 12 REST endpoints under /portfolio
├── portfolio-intelligence.module.ts      # NestJS module
├── dto/portfolio-intelligence.dto.ts     # AddPositionDto / UpdatePositionDto (class-validator)
├── index.ts                              # Barrel export
└── __tests__/                            # engine/registry/service/controller specs + test-helpers
```

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    PortfolioIntelligenceService                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  For each stored position (exactly one provider call each):                  │
│   1. EarlyOpportunityIntelligenceService.getEarlyOpportunity(ticker)         │
│        └─ bundles Prediction, Elite, MTF, Smart Money, Catalyst,             │
│           Verification, Research Consensus, Entry, Risk, Expected Return     │
│   2. MarketDataOrchestrator.fetchLatestPrice(ticker)  → authoritative close  │
│   3. SymbolRegistryService.getSymbol(ticker)          → sector / company     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Engine (pure):                                                              │
│   - Portfolio Intelligence Score 0-100 (documented weights)                  │
│   - Portfolio status (ÇOK GÜÇLÜ/GÜÇLÜ/DENGELİ/DİKKAT/YÜKSEK RİSK)            │
│   - Position status (STRONG_HOLD/HOLD/WATCH/REDUCE/EXIT_REVIEW)              │
│   - Risk metrics + Turkish warnings                                          │
│   - Rebalancing ranges + priority + reason                                   │
│   - Bull/Base/Bear scenarios + intraday/swing/position/investment horizons   │
│   - Opportunities section (improving/deteriorating/new + fit flags)          │
├──────────────────────────────────────────────────────────────────────────────┤
│  Cache: CacheService namespace "portfolio", keys "analysis"/"opportunities"  │
│  Registry: PortfolioIntelligenceRegistry (positions + snapshots)             │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Files Created

Backend (`apps/api/src/modules/portfolio-intelligence/`):

| File | Responsibility |
|---|---|
| `portfolio-intelligence.config.ts` | Weights, thresholds, status labels, cache constants |
| `portfolio-intelligence.types.ts` | Type model (analysis, risk, positions, rebalance, scenarios, horizons, opportunities, snapshots, learning) |
| `portfolio-intelligence.engine.ts` | Pure deterministic engine |
| `portfolio-intelligence.registry.ts` | Positions + snapshots + comparison |
| `portfolio-intelligence.service.ts` | Orchestration + cache + sub-reports + learning + telegram |
| `portfolio-intelligence.controller.ts` | REST endpoints |
| `portfolio-intelligence.module.ts` | NestJS module |
| `dto/portfolio-intelligence.dto.ts` | Add/Update position DTOs |
| `index.ts` | Barrel export |
| `__tests__/` | 4 spec files + test-helpers |

Files Modified (backend): `apps/api/src/app.module.ts` — registered the new module before
`PortfolioModule` (route precedence for static `/portfolio/*`).

Frontend (`apps/web`): `components/portfolio/portfolio-intelligence.tsx` (new tab),
`components/portfolio/index.ts`, `pages/portfolio.tsx`, `lib/sdk.ts`
(`portfolioIntelligence.*` methods), `components/portfolio/__tests__/portfolio-intelligence.test.tsx`.

## Inputs

- Stored positions: `ticker`, `quantity`, `averageCost`, optional `currentPrice`,
  `manualTarget`, `manualStop`, `notes`, `portfolioWeight`.
- When authoritative market data exists it always wins over any manually supplied price.
- Candidate opportunities come from `EarlyOpportunityIntelligenceService.getEarlyOpportunities`
  (the platform's existing opportunity discovery) — never re-detected here.

## Outputs

### Unified analysis (`GET /portfolio/analysis`)
- `score` (0-100) + `scoreBreakdown` (earlyOpportunity, eliteScore, multiTimeframe,
  confidence, smartMoney, catalyst, riskInverse, liquidity, verification, diversification)
- `statusKey` / `statusLabel` — ÇOK GÜÇLÜ / GÜÇLÜ / DENGELİ / DİKKAT / YÜKSEK RİSK
- `risk` — totalValue, investedCapital, cash, unrealizedPnl(+%), max/min weight,
  sectorConcentration, top3/top5 concentration, diversificationScore, portfolioRiskScore,
  portfolioConfidence, portfolioOpportunityScore, portfolioExpectedReturn,
  portfolioDownsideRisk, portfolioRiskReward, `warnings` (Turkish), low-liquidity /
  low-confidence / weak-smart-money / negative-catalyst / weak-verification weights
- `positions[]` — full per-position analysis (see below)
- `sectorAllocation[]`, `rebalance[]`, `scenarios` (bull/base/bear), `horizons`
  (best/worst + intraday/swing/position/investment), `opportunities`, `recommendations[]`
  (per ticker, Turkish reason)

### Per position
ticker, company, sector, quantity, averageCost, currentPrice, positionValue,
investedCapital, unrealizedPnl(+%), portfolioWeight, sectorWeight, riskScore, eliteScore,
earlyOpportunityScore/Level, multiTimeframeScore, bullishPercent, confidence,
expectedReturn, smartMoneyScore, catalystScore, verificationStatus, entryZone, stop,
target1, target2, riskRewardRatio, holdingPeriod, trendStage, momentum, liquidityQuality,
`status` (STRONG_HOLD/HOLD/WATCH/REDUCE/EXIT_REVIEW), `recommendation`, `recommendationReason`,
`evaluation`.

## Scoring

`Portfolio Intelligence Score = Σ(weight × component)`, weights centralized and documented in
`portfolio-intelligence.config.ts` (earlyOpportunity, eliteScore, multiTimeframe, confidence,
smartMoney, catalyst, riskInverse, liquidity, verification, diversification — sum = 1). The risk
component uses the inverse of the portfolio risk score; the diversification component rewards
top3/top5 concentration below thresholds. No arbitrary duplicate scores — every component is a
deterministic function of existing engine outputs.

## Risk & Concentration Warnings (deterministic, Turkish)

- excessive single-stock concentration, e.g. `"Portföy ağırlığının %31'i tek hissede yoğunlaşıyor."`
- excessive sector concentration, e.g. `"Bankacılık sektörü portföyün %48'ini oluşturuyor."`
- low-confidence exposure, low-liquidity exposure, weak Smart Money exposure, negative catalyst
  exposure, weak verification exposure.

## Rebalancing Intelligence

Deterministic target allocation ranges per position:
- `REDUCE_CONCENTRATION` — current weight > recommended max (priority HIGH/MEDIUM)
- `CONSIDER_INCREASE` — current weight < recommended min
- `IN_RANGE` — within the recommended range

Range considers risk, opportunity, confidence, sector concentration, liquidity, Smart Money,
MTF alignment and expected return. **No trade execution — recommendation only.**

## Scenarios

Bull / Base / Bear per portfolio: expected portfolio return, risk, main drivers, main risks,
most sensitive positions, explanation. All calculations deterministic; horizon classification
(intraday/swing/position/investment) and best/worst horizon derive from existing MTF outputs.

## APIs

| Method | Path | Description |
|---|---|---|
| GET | `/portfolio/analysis` | Unified intelligence view |
| GET | `/portfolio/positions` | Stored positions |
| GET | `/portfolio/opportunities` | Improving/deteriorating holdings + new opportunities |
| GET | `/portfolio/risk` | Risk metrics + warnings |
| GET | `/portfolio/rebalance` | Target allocation ranges |
| GET | `/portfolio/scenarios` | Bull/Base/Bear + horizons |
| GET | `/portfolio/history` | Snapshot history |
| GET | `/portfolio/learning` | Recommendation/classification accuracy + expected-vs-realized |
| POST | `/portfolio/position` | Add position |
| PUT | `/portfolio/position/:ticker` | Update position |
| DELETE | `/portfolio/position/:ticker` | Remove position |
| POST | `/portfolio/refresh` | Bypass cache, recompute |
| POST | `/portfolio/analyze` | Fresh analysis |

All responses: `{ success, data, timestamp }`. All endpoints `@Public()` (personal, no-login app).
Root `GET /portfolio` list (existing SDK contract) is intentionally NOT redefined; the unified
view lives at `/portfolio/analysis`.

## Dashboard

Elite Dashboard (apps/web) portfolio page gained a **"Portfolio Intelligence"** tab:
portfolio summary cards (score, value, P&L, expected return, risk, confidence, diversification,
risk/reward), score breakdown, holdings table (weight, P&L, elite, early-opportunity, MTF, SM,
catalyst, confidence, risk, status), rebalancing recommendations, Bull/Base/Bear scenarios, new
opportunities + improving/weakening holdings, Turkish warnings, and AI recommendations with a
"Yenile" (refresh) action.

## Cache

- Existing `CacheService` (no new cache implementation).
- Namespace `portfolio`; keys `analysis` / `opportunities`.
- TTL centralized: `PORTFOLIO_INTELLIGENCE_CACHE_TTL_MS = 30_000` (matches `cache.config.ts`
  portfolio strategy).

## Registry

`PortfolioIntelligenceRegistry` stores positions in memory and keeps up to 50 analysis
snapshots. `compareSnapshots` returns score change, status change, improving/deteriorating
positions. No second persistence mechanism introduced.

## Learning Integration

`PortfolioLearning` reuses `SelfLearningService` (modifiers) and Backtest win-rate
(`BacktestService.getReport(...).result.performance.winRate`) to expose:
`snapshotCount`, `recommendationAccuracy`, `positionClassificationAccuracy`,
`expectedVsRealized` (expected vs realized return per ticker, error, modifier). No second
learning architecture.

## Telegram Preparation

Service methods exist for `/portfolio`, `/portfolio-risk`, `/portfolio-opportunities`,
`/portfolio-rebalance`, `/portfolio-report` (`getTelegramReport(type)`). The bot itself is out of
scope for this sprint; it will consume the same `PortfolioIntelligenceService` APIs.

## Testing

Backend (70 deterministic tests): engine (weights sum to 1, score, risk incl. sector
concentration, rebalance reduce/increase/in-range, scenarios, horizons, P&L, empty/single/
multiple portfolios, deterministic output), registry (upsert/remove/cap/compareSnapshots),
service (enrichment, cache reuse, missing intelligence, no-duplicate provider calls,
opportunities exclude held tickers, sub-reports, learning, telegram report), controller (all
routes). No randomness, no live API, mocks only at provider boundaries.

Web (8 tests): PortfolioIntelligence component renders score/status/holdings/rebalancing/
scenarios/opportunities/warnings and the error state.

## Reused Engines

| Engine | Reused For |
|---|---|
| Early Opportunity Intelligence | Per-position intelligence + candidate opportunities |
| Multi-Timeframe Opportunity | `intelligence.multiTimeframe` (bundled), horizons |
| Smart Money | Position/portfolio smart money scores |
| Catalyst | Position/portfolio catalyst scores |
| Verification AI | Verification status |
| Elite Score | Position elite scores |
| Prediction | Bullish probability, confidence, expected return (via intelligence) |
| Entry Zone | Entry zone, stop, targets |
| Self-Learning | Confidence/learning modifiers |
| Backtest | Win-rate (learning section) |
| Market Data Orchestrator | Authoritative current price |
| Symbol Registry | Sector / company name |
| Cache | Analysis + opportunities caching |

**No duplicate calculations** — per position exactly one intelligence fetch (bundles MTF),
one price fetch, one symbol lookup; no duplicate indicators or predictions.

## Known Issues / Limitations

- Portfolio positions/snapshots are in-memory; restart loses them (consistent with the
  in-memory registry pattern; DB persistence is a future sprint).
- Recommendation/classification accuracy starts `null` until snapshots accumulate.
- Root `GET /portfolio` list endpoint is unchanged; unified view requires
  `GET /portfolio/analysis` (documented deviation).
- `eslint` binary is not vendored in this environment; TypeScript strict typecheck is the gate.
- Jest may hang on exit for some suites — run with `--forceExit`.

## Next Sprint

Per `MASTER_ROADMAP.md`, the roadmap remains the single source of truth. Planned phases after
R2-030: Phase 5 Data Pipeline (real-time BIST feed, historical import, alternative data,
validation, incremental updates) — see `MASTER_ROADMAP.md` / `PROJECT_STATUS.md`.
