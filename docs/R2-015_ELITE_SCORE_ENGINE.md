# R2-015 — Elite Score Engine

## Overview

The Elite Score Engine is **not** another scoring engine. It is a **composite layer** that aggregates existing production outputs into five deterministic investment horizons:

- Günlük (Daily)
- Haftalık (Weekly)
- Aylık (Monthly)
- 3 Aylık (3M)
- 6 Aylık (6M)

Elite Score performs **zero** provider requests, **zero** indicator calculations, and **zero** prediction. Every score is a deterministic weighted aggregation of values already produced by the production engines. Identical inputs always produce identical outputs.

> Naming note: the two pre-existing `elite-score` modules (a candidate/confluence rating engine in `modules/elite-score` and a global orchestrator in `common/elite-score`) are **untouched**. This sprint's composite lives in `apps/api/src/modules/ai-elite-score/` and is registered in `AppModule` as `AiEliteScoreModule` to avoid a name collision.

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
Opportunity   ──►  OpportunityRegistry (source of truth)
   ↓
Elite Score Engine (deterministic composite, 5 horizons)
   ↓
EliteScoreRegistry ──► EliteScoreController (/elite-score)
```

## Composite Formula

For each horizon, Elite Score is a weighted average over the production dimensions:

```
horizonScore = Σ(value_i × weight_i) / Σ(weight_i)     (present values only, 0-100)
confidence   = average of present { aiConfidence, decisionConfidence, opportunityConfidence }
```

Each dimension's weight is fixed per horizon (see `elite-score.config.ts`), tilting short horizons toward momentum/technical/catalyst/liquidity and long horizons toward fundamentals/trend/quality:

| Dimension | Günlük | Haftalık | Aylık | 3 Aylık | 6 Aylık |
| --- | --- | --- | --- | --- | --- |
| AI Score | 0.12 | 0.11 | 0.10 | 0.08 | 0.06 |
| Decision Score | 0.10 | 0.11 | 0.12 | 0.11 | 0.10 |
| Opportunity Score | 0.10 | 0.10 | 0.12 | 0.12 | 0.11 |
| Strategy Score | 0.05 | 0.05 | 0.06 | 0.07 | 0.08 |
| Verification | 0.08 | 0.09 | 0.08 | 0.07 | 0.06 |
| Catalyst | 0.08 | 0.09 | 0.08 | 0.07 | 0.06 |
| Technical | 0.12 | 0.10 | 0.08 | 0.06 | 0.04 |
| Fundamental | 0.02 | 0.04 | 0.07 | 0.10 | 0.13 |
| Momentum | 0.15 | 0.12 | 0.08 | 0.05 | 0.03 |
| Trend | 0.03 | 0.06 | 0.09 | 0.11 | 0.12 |
| Liquidity | 0.05 | 0.04 | 0.03 | 0.03 | 0.03 |
| Quality | 0.02 | 0.03 | 0.05 | 0.07 | 0.10 |
| Risk (safety) | 0.08 | 0.06 | 0.04 | 0.06 | 0.08 |
| **Total** | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |

## Reuse Graph

Every Elite Score is built exclusively from:

- **AI Score / AI Confidence** — Score Engine
- **Decision, Decision Score, Decision Confidence, Signals** — Decision Engine
- **Opportunity Level, Opportunity Score, Confidence, Tags** — Opportunity Engine
- **Verification** — Verification Engine
- **Catalyst** — Catalyst Engine
- **Strategy (id, name, score)** — Strategy Engine
- **Risk, Momentum, Trend, Liquidity, Quality, Technical, Fundamental** — Indicator/Score Engine outputs

**No new calculations** — only a weighted average over values that already exist.

## Output

Each ticker produces an `EliteScoreResult` with:

- `horizons[5]`: Günlük / Haftalık / Aylık / 3 Aylık / 6 Aylık, each 0-100 with `confidence`, `reasons[]`, `warnings[]`
- `dominantStrategyId` / `dominantStrategyName`
- `dominantSignals[]` (strongest contributing dimensions + positive signals, max 5)
- `decision`, `decisionLabel`, `opportunityLevel`

### Example

```
THYAO
  Elite Daily   83/100
  Elite Weekly  87/100
  Elite Monthly 91/100
  Elite 3M      89/100
  Elite 6M      94/100
```

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/elite-score/:ticker` | Single ticker Elite Score (404 Turkish if absent) |
| `GET /api/elite-score/top` | Ranked by Daily score |
| `GET /api/elite-score/daily` | Ranked by Günlük |
| `GET /api/elite-score/weekly` | Ranked by Haftalık |
| `GET /api/elite-score/monthly` | Ranked by Aylık |
| `GET /api/elite-score/3m` | Ranked by 3 Aylık |
| `GET /api/elite-score/6m` | Ranked by 6 Aylık |
| `POST /api/elite-score/batch` | Compute Elite Scores for a batch (reuses Decision + Opportunity engines) |

## Opportunity Center Integration

The Opportunity Center's `GET /api/opportunity-center/elite-score` endpoint no longer returns placeholders. It now displays real **Günlük / Haftalık / Aylık / 3 Aylık / 6 Aylık** Elite Scores for every card:

- `skor` is always a non-null number (0-100) — the average of the cards' Elite Scores for that horizon.
- Every card carries `eliteScore: { gunluk, haftalik, aylik, ucAylik, altiAylik }`.

## Performance

- **ZERO** provider requests — the engine never fetches data.
- **ZERO** indicator calculations — only weighted averages over existing values.
- `EliteScoreService.sync()` reads `OpportunityRegistry` (in-memory); `EliteScoreRegistry` is a `Map` with O(1) per-ticker lookup.

## Files

- `apps/api/src/modules/ai-elite-score/elite-score.types.ts`
- `apps/api/src/modules/ai-elite-score/elite-score.config.ts`
- `apps/api/src/modules/ai-elite-score/elite-score.engine.ts`
- `apps/api/src/modules/ai-elite-score/elite-score.registry.ts`
- `apps/api/src/modules/ai-elite-score/elite-score.service.ts`
- `apps/api/src/modules/ai-elite-score/elite-score.dto.ts`
- `apps/api/src/modules/ai-elite-score/elite-score.controller.ts`
- `apps/api/src/modules/ai-elite-score/elite-score.module.ts`
- `apps/api/src/modules/ai-elite-score/elite-score.spec.ts`

## Modified

- `apps/api/src/app.module.ts` — `AiEliteScoreModule` registered.
- `apps/api/src/modules/opportunity-center/opportunity-center.types.ts` — `EliteScoreBreakdown`, `EliteScoreCard`.
- `apps/api/src/modules/opportunity-center/opportunity-center.service.ts` — real elite scores via `EliteScoreEngine`.
- `apps/api/src/modules/opportunity-center/opportunity-center.dto.ts` — non-null `skor`, `EliteScoreCardDto`, `EliteScoreBreakdownDto`.
- `apps/api/src/modules/opportunity-center/opportunity-center.controller.ts` — elite-score endpoint returns real values.
- `apps/api/src/modules/opportunity-center/opportunity-center.module.ts` — imports `EliteScoreModule`.
- `apps/api/src/modules/opportunity-center/opportunity-center.spec.ts` — elite-score tests now assert real values.
