# R2-016 — Tomorrow Opportunity Engine

## Overview

The Tomorrow Opportunity Engine is **not** prediction, forecasting, ML, or GPT. It is a **filter + prioritization layer** that runs on top of the already-computed Opportunity (R2-013) and Elite Score (R2-015) outputs. For every candidate it produces a single **Tomorrow Score**, a **Tomorrow Confidence**, a user-facing **category**, and a full explanation (reasons, warnings, positive/negative signals, tags).

Identical inputs always produce identical outputs — the engine is fully deterministic and performs zero new calculations beyond a weighted average of existing production values.

## Pipeline

```
Scanner
   ↓
Strategy
   ↓
Score
   ↓
Decision (R2-012)
   ↓
Opportunity (R2-013) ──► OpportunityRegistry
   ↓
Elite Score (R2-015)  ──► EliteScoreRegistry
   ↓
Tomorrow Opportunity Engine (deterministic filter/prioritize)
   ↓
TomorrowRegistry ──► TomorrowController (/tomorrow)
```

## Tomorrow Score Formula

```
tomorrowScore = Σ(value_i × weight_i) / Σ(weight_i)   (present values only, 0-100)
```

| Dimension | Weight |
|---|---|
| Elite Daily | 0.30 |
| Opportunity Score | 0.20 |
| Elite Weekly | 0.15 |
| AI Score | 0.10 |
| Decision Score | 0.10 |
| Verification | 0.075 |
| Catalyst | 0.075 |

Dimensions that are `null` are skipped and their weight is redistributed across the remaining present dimensions (normalized weighted average).

## Confidence

```
tomorrowConfidence = round(mean(Günlük Elite confidence, Opportunity confidence, AI confidence))
```

Only present values are averaged; all-null inputs yield 0.

## Categories (5 levels)

| Category | Label | Stars | Min Score |
|---|---|---|---|
| `VERY_HIGH` | Çok Yüksek Fırsat | ★★★★★ | 85 |
| `HIGH` | Yüksek Fırsat | ★★★★☆ | 70 |
| `MEDIUM` | Orta Fırsat | ★★★☆☆ | 55 |
| `WATCH` | İzle | ★★☆☆☆ | 40 |
| `WEAK` | Zayıf | ★☆☆☆☆ | 0 |

## Ranking

Registry ranking sorts by (in order):

1. Tomorrow Score (desc)
2. Elite Daily (desc)
3. AI Score (desc)
4. Tomorrow Confidence (desc)
5. Ticker (asc, tie-break)

## Night Analysis

The architecture for a nightly re-run exists **only**: the window is defined as 22:00 / 23:00 / 00:00 and results are stored into `TomorrowRegistry`. **No scheduler is implemented** — this is by design and deferred.

## API

| Method | Route | Description |
|---|---|---|
| GET | `/tomorrow` | All tomorrow candidates, Tomorrow Score ranked, plus night-analysis meta |
| GET | `/tomorrow/top10` | Strongest 10 candidates |
| GET | `/tomorrow/top20` | Strongest 20 candidates |
| GET | `/tomorrow/:ticker` | Single candidate for a ticker (404 if absent) |
| POST | `/tomorrow/batch` | Evaluate a batch through Opportunity + EliteScore engines |

Candidate payload includes: Ticker, Company, Tomorrow Score, Tomorrow Confidence, Category + Label + Stars, AI Score, Elite Daily, Elite Weekly, Decision, Opportunity, Strategy, Verification, Catalyst, Reasons[], Warnings[], Positive/Negative Signals[], Tags[].

## File Map

```
apps/api/src/modules/tomorrow/
├── tomorrow.types.ts        TomorrowInput, TomorrowCandidateResult, RegistryEntry
├── tomorrow.config.ts       Categories, score weights, dimension labels, night window
├── tomorrow.engine.ts       TomorrowOpportunityEngine (deterministic)
├── tomorrow.registry.ts     TomorrowRegistry (Map + ranking)
├── tomorrow.service.ts      sync from Opportunity+EliteScore registries, batch, night window
├── tomorrow.dto.ts          Swagger DTOs (candidate, response, batch)
├── tomorrow.controller.ts   /tomorrow routes
├── tomorrow.module.ts       imports OpportunityModule + EliteScoreModule
├── index.ts
└── tomorrow.spec.ts         20 tests
```

Registered in `AppModule` as `AiTomorrowModule` (collision-safe naming per R2-013/015 precedent).

## Reuse (zero new calculations)

- Opportunity results: `OpportunityRegistry` + `OpportunityEngine` (R2-013)
- Elite Score results: `EliteScoreRegistry` + `EliteScoreEngine` + `EliteScoreService` (R2-015)
- Decision batch input mapper: `toDecisionInput` (R2-012)

## Out of Scope (not implemented)

Prediction, ML, GPT, price/target forecasting, portfolio, backtesting, notifications, scheduler, UI redesign.

## Verification

- Build: `pnpm --filter @bist-elite/api build` — GREEN
- Tomorrow suite: `jest tomorrow` — 20/20 GREEN
- Related suites (elite-score, opportunity-center, opportunity, decision): 591/591 GREEN
