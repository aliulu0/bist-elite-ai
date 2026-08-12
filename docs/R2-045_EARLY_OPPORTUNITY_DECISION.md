# R2-045 — Early Opportunity Decision & Signal Convergence

## Problem

The Early Opportunity Intelligence Engine (R2-027), Multi-Timeframe Intelligence (R2-028),
Elite Dashboard (R2-029), Portfolio Intelligence (R2-030), Data Research Pipeline (R2-031),
Financial Data Quality (R2-037) and the Early Signal Scanner (R2-038) all produce rich,
deterministic signals — but the platform had no single, deterministic "is this stock
currently an EARLY OPPORTUNITY?" convergence/decision layer that combines all of those
signals into one verdict (status, score, early flag, entry/stop/target, Turkish reason,
and an immutable snapshot for backtesting). Filters such as `minDecisionScore` were
referenced by the intelligence engine but not backed by a complete decision model.

## Solution

A new pure, deterministic convergence layer in
`apps/api/src/modules/ai-early-opportunity/decision/` (`EarlyOpportunityDecisionEngine`,
`EarlyOpportunityDecisionService`, `EarlyOpportunityDecisionController`) that reuses the
existing `EarlyOpportunityIntelligenceResult` and never refetches data, never recomputes
indicators, and never calls GPT. Same input → same output.

Data flow:

```
EarlyOpportunityIntelligenceResult (cached, reused)
   ==> EarlyOpportunityDecisionEngine.decide()   (pure, synchronous)
   ==> EarlyOpportunityDecision  (status, score, snapshot, Turkish explanation)
   ==> GET /ai-early-opportunity/decision/:ticker  (single-ticker)
   ==> enrichWithDecisions()                       (batch, attaches to TOP-10 scan results)
```

### Dimensions (weighted convergence)

10 independent evidence dimensions. Each is **present** only when the underlying
engine output actually exists — absent evidence never adds positive score.
Documented weights (sum = 1.00), centralized in `early-opportunity-decision.types.ts`:

| Dimension | Weight | Source | Score basis |
|---|---|---|---|
| earlyStage | 0.15 | `multiTimeframe.trendStage` | Early=100, Growing=80, Breakout=50, Extended=20, Late=5 |
| multiTimeframe | 0.15 | `multiTimeframe.alignments` | 0.4·MTF + 0.3·agreement + 0.2·trendAlign + 0.1·momentumAlign |
| prediction | 0.15 | confidence / bullishPercent / expectedReturn | 0.4·conf + 0.3·bullish + 0.3·normalized expected return |
| smartMoney | 0.10 | `smartMoney.score` / `accumulation` | raw score |
| catalyst | 0.10 | `catalyst.score` (+5 if verified) | score + verification boost |
| fundamentals | 0.10 | `fundamentals.score` / `overallStatus` | score − penalty (WATCH −8, FAIL −20, UNKNOWN −5) |
| signals | 0.10 | `signalConvergenceScore` / `earlySignalCount` | convergence + 2·early bonus |
| verification | 0.05 | `verificationStatus` / `researchConsensus.consensusScore` | 0.5·base + 0.5·consensus |
| dataQuality | 0.05 | `financialDataQuality.qualityScore` | quality score |
| risk | 0.05 | `risk` / R-R ratio / entry/stop/target presence | 0.4·risk + 0.3·R-R + 0.3·framework |

### Convergence & score

- `coverage` = Σ weight of **present** dimensions (0–100% of total weight).
- `convergence` = weight-averaged mean of present dimension scores (0–100).
- `decisionScore` = `round(convergence × coverageFactor)` where
  `coverageFactor = 0.5 + 0.5·min(1, coverage/0.7)`. No present evidence → score 0.
- `confidence` = `0.6·decisionScore + 0.4·dataQualityScore` (when quality data exists),
  else `decisionScore`.

### Status classification (7-way)

`classify(score, earlyStage)` → then `applyGates(baseStatus, gates)`:

| decisionScore | trendStage threshold | Status |
|---|---|---|
| ≥ 75 | earlyStage ≥ 70 | STRONG_EARLY_OPPORTUNITY (🔥) |
| ≥ 75 | earlyStage ≥ 40 | CONFIRMED_OPPORTUNITY (✅) |
| ≥ 75 | otherwise | EXTENDED_OPPORTUNITY (🟠) |
| ≥ 60 | earlyStage ≥ 55 | EARLY_OPPORTUNITY (🟢) |
| ≥ 60 | earlyStage ≥ 40 | CONFIRMED_OPPORTUNITY |
| ≥ 60 | otherwise | EXTENDED_OPPORTUNITY |
| ≥ 45 | — | WATCHLIST_OPPORTUNITY (🟡) |
| < 45 | — | WEAK_OPPORTUNITY (⚪) |

`earlyOpportunity` (the flag) = STRONG_EARLY_OPPORTUNITY || EARLY_OPPORTUNITY.

### Gates (hard rules)

- **Invalidate (→ INVALID_OPPORTUNITY):** no primary market/prediction data;
  `financialDataQuality.status === DATA_INSUFFICIENT`;
  `financialDataQuality.marketIntegrity.valid === false`;
  `marketDataScore < 50`.
- **Downgrade (cap at WATCHLIST_OPPORTUNITY):** provider conflict;
  severe DATA_WARNING (score < 60); stale data; fundamental FAIL;
  high risk with missing stop/target; no entry framework despite primary data.
- **Coverage enforcement:** coverage == 0 → `NO_EVIDENCE` invalidate;
  coverage < 50% → `INSUFFICIENT_EVIDENCE` downgrade.

### Snapshot (R2-046 backtesting input)

`EarlyOpportunityDecisionSnapshot` captures only data available at decision time
(`decisionTimestamp == input.evaluatedAt`), plus a SHA-256 `inputDigest` of the
canonical input — so a later backtest can verify the decision matched its inputs.

### API

- `GET /ai-early-opportunity/decision/:ticker` — full decision for a single ticker.
  Response is `EarlyOpportunityDecisionDto.from(decision)` (`@Public()`).
- Decisions are **batch-attached** to the TOP-10 scan path via
  `EarlyOpportunityDecisionService.enrichWithDecisions()` (concurrency 12) so scan
  results carry the decision without a per-ticker intelligence round-trip; the
  intelligence engine then filters with `minDecisionScore` / early-opportunity flags.

### Caching

No new cache namespace and no new provider calls: a decision is a pure function of an
already-cached `EarlyOpportunityIntelligenceResult`, so it is computed at memory cost.
The intelligence result itself is served from the existing intelligence cache, so the
effective provider/indicator cost of a decision is zero.

### Integration points (reused, not duplicated)

- `EarlyOpportunityIntelligenceService` injects `EarlyOpportunityDecisionService`
  (`@Optional()` + `forwardRef`) and calls `enrichWithDecisions` on the filtered,
  ranked, and single-ticker paths.
- `EarlyOpportunityIntelligenceEngine.matchesFilters` honors `minDecisionScore`
  (via `result.decision.decisionScore`) plus the existing `earlyOpportunity` /
  `earlySignalCount` filters.
- `EarlyOpportunityModule` registers the engine, service, controller and DTOs.
- The decision attaches a `decision` field onto `EarlyOpportunityIntelligenceResult`
  consumed by the intelligence engine and the scan.

## Files (Backend)

| File | Responsibility |
|---|---|
| `decision/early-opportunity-decision.types.ts` | Dimension/weight/status tables, result + snapshot types |
| `decision/early-opportunity-decision.engine.ts` | Pure `decide(input)` engine |
| `decision/early-opportunity-decision.service.ts` | `evaluate(ticker)`, `enrichWithDecisions(results)`, `decideFor(result)` |
| `decision/early-opportunity-decision.dto.ts` | Swagger DTOs + `.from()` mappers |
| `decision/early-opportunity-decision.controller.ts` | `GET /ai-early-opportunity/decision/:ticker` |
| `decision/early-opportunity-decision.engine.spec.ts` | Engine + classification + gate tests |
| `decision/early-opportunity-decision.service.spec.ts` | Service (evaluate / enrich / concurrency) tests |

## Verification

- `tsc --noEmit -p apps/api/tsconfig.json` — clean (exit 0); `apps/web` typecheck clean.
- R2-045 decision suites: **2/2 suites, 16/16 tests GREEN**.
- `ai-early-opportunity` regression: **11 suites / 146 tests GREEN** (includes the
  intelligence engine `minDecisionScore` tests and the R2-026 scanner).
- Deterministic: pure function of the intelligence result; no randomness, no GPT.

## Notes / Out of scope

- Does not trade, does not place orders, does not introduce a new prediction/scoring
  system, and does not add new indicators.
- The immutable snapshot is the contract consumed by R2-046 (Decision Backtesting).
