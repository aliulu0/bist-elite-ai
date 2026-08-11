# R2-046 — Historical Early Opportunity Backtest & Decision Validation

## Problem

The existing Early Opportunity Decision engine (R2-045) produces deterministic decisions
for the current market state, but the platform had no way to answer:

> "If BIST ELITE AI had evaluated this stock on historical date X using ONLY information
> available at date X, would the Early Opportunity Decision have been useful?"

There was no historical validation engine, no point-in-time data isolation, no future
outcome evaluation, no confidence calibration, no lead-time measurement, and no false
positive / missed opportunity analysis for the existing Early Opportunity system.

## Solution

A new `early-opportunity-backtest` module at
`apps/api/src/modules/early-opportunity-backtest/` that reuses the existing
`HistoricalMarketDataService`, `EarlyOpportunityIntelligenceService`,
`EarlyOpportunityDecisionEngine`, `CacheService`, and `IndicatorCacheService`.
No second backtest engine, no second historical-data pipeline, no duplication of
provider calls or calculations. Deterministic. No GPT. No randomness.

### Data Flow

```
Historical Date T
    ↓
HistoricalMarketDataService (existing, cached)
    ↓
Validated historical dataset available at T
    ↓
PointInTimeDataService (filters to timestamp <= T)
    ↓
Existing EarlyOpportunityIntelligenceService + EarlyOpportunityDecisionEngine
    ↓
Immutable Decision Snapshot (Object.freeze, SHA256 inputDigest)
    ↓
FutureOutcomeService (uses future data ONLY for evaluation — never decision)
    ↓
DecisionSuccessService + BenchmarkService + ConfidenceCalibrationService
    ↓
LeadTimeService + FalsePositiveService + MissedOpportunityService
    ↓
Historical Validation Report (HISTORICAL_OUTCOME_VALIDATION)
```

## Architecture

### Services

| Service | Responsibility |
|---|---|
| `PointInTimeDataService` | Filters candles, fundamentals, catalysts, research, signals to `timestamp <= T`. Rejected count tracked. |
| `FutureOutcomeService` | Calculates 1W/1M/3M/5M/6M/1Y outcomes: abs return, pct return, MFE, MAE, max drawdown, time-to-positive, time-to-target, time-to-stop. |
| `DecisionSuccessService` | Multi-dimension success: RETURN, RISK_ADJUSTED, TARGET, EARLY_OPPORTUNITY. Stop-first detection. |
| `BenchmarkService` | Stock vs benchmark comparison per horizon. Returns null if unavailable — never fabricates. |
| `ConfidenceCalibrationService` | LOW/MEDIUM/HIGH confidence buckets vs actual returns. Win rate, avg/median return, avg drawdown. Also handles sample quality classification. |
| `LeadTimeService` | Days between decision and major price appreciation. By score bucket, by signal strength. |
| `FalsePositiveService` | Identifies positive decisions with poor outcomes. Classifies reason from metadata (weak_fundamentals, weak_smart_money, catalyst_failure, prediction_failure, low_signal_convergence, market_wide_selloff, etc.). Returns "yetersiz_kanit" when no deterministic explanation. |
| `MissedOpportunityService` | Identifies stocks with strong later returns but not selected by Early Opportunity. Reports filter failures, missing data. |
| `HistoricalEarlyOpportunityBacktestService` | Main orchestrator. Runs the full 14-step backtest execution pipeline. In-memory run registry. |

### Immutable Decision Snapshots

Reuses the existing `EarlyOpportunityDecisionSnapshot` from R2-045. Each snapshot
contains: decisionTimestamp, symbol, timeframeContext, decisionScore, decisionStatus,
earlyOpportunity, entry, stop, target1, target2, expectedReturn, confidence, evidence
(per-dimension scores), and a SHA256 `inputDigest` for reproducibility verification.

Snapshots are frozen with `Object.freeze()` after creation. Historical decisions are
never overwritten.

### Point-in-Time Protection

- **Daily candles**: Only candles with `timestamp <= decisionDate` are used.
- **Intraday**: Only candles with `timestamp <= decisionTimestamp` are used.
- **Fundamentals**: Only statements with `timestamp <= decisionDate`.
- **Research/Catalyst**: Only evidence with `publishedAt <= decisionTimestamp`.
  If publication timestamp is unavailable, evidence is marked as unsuitable for
  strict historical validation (not silently used).

### Decision Horizons

| Horizon | Days |
|---|---|
| 1W | 7 |
| 1M | 30 |
| 3M | 90 |
| 5M | 150 |
| 6M | 180 |
| 1Y | 365 |

### Sample-Size Protection

Every metric includes `sampleCount`. Interpretation labels:

| Sample Count | Label |
|---|---|
| < 10 | INSUFFICIENT_SAMPLE |
| 10-29 | LOW_CONFIDENCE |
| 30-99 | MODERATE_CONFIDENCE |
| 100+ | STRONGER_STATISTICAL_SIGNAL |

These are interpretation labels only — no automatic claim of statistical significance.

### Survivorship Bias

The system explicitly marks `SURVIVORSHIP_BIAS_POSSIBLE` in every report because
historical BIST symbol membership is not available. The universe is documented in
every run result.

### Corporate Actions

Delisted handling, ticker changes, splits, dividends, and mergers are NOT supported
by the existing historical data layer. This limitation is explicitly flagged in
every report (`corporateActions.note`).

### Evaluation Type

Labelled as `HISTORICAL_OUTCOME_VALIDATION` — NOT "out-of-sample" or "ML validation"
since there is no training process.

## API

```
GET  /backtest/early-opportunity/:ticker        — ticker info
GET  /backtest/early-opportunity                — list runs
POST /backtest/early-opportunity/run            — start backtest
GET  /backtest/early-opportunity/:runId        — full result
GET  /backtest/early-opportunity/:runId/summary
GET  /backtest/early-opportunity/:runId/decisions
GET  /backtest/early-opportunity/:runId/failures
GET  /backtest/early-opportunity/:runId/missed-opportunities
GET  /backtest/early-opportunity/:runId/calibration
GET  /backtest/early-opportunity/:runId/lead-time
```

### Backtest Request

```typescript
{
  symbols?: string[];
  timeframes?: string[];
  startDate: string;          // default: 2024-01-01
  endDate: string;            // default: 2024-12-31
  horizons?: BacktestHorizon[];
  minScore?: number;
  minConfidence?: number;
  benchmark?: string;
  commission?: number;         // default: 0
  slippage?: number;           // default: 0
  maxSymbols?: number;         // default: 10
  maxDecisions?: number;       // default: 100
}
```

Conservative defaults — no massive historical market-wide scan by default.

### Decision Table

Each run produces a decision-level table with: Ticker, Decision Date, Decision,
Elite Score, Confidence, Expected Return, Realized Return, 1W/1M/3M/6M/1Y returns,
Benchmark Return, Excess Return, Max Drawdown, Lead Time, Outcome, Data Quality.

## Cache

Reuses existing:
- `CacheService` (historical namespace)
- `IndicatorCacheService`
- `HistoricalMarketDataService` (validated historical data)

No new cache namespaces created. Repeated historical requests reuse cached
validated data via `CacheService.get/set` with `historical:{symbol}:{tf}:{start}:{end}` keys.

## Performance Metrics

Every run tracks:
- `providerCalls`
- `cacheHits`
- `indicatorCacheHits`
- `decisionsEvaluated`
- `outcomesEvaluated`
- `skippedDates`
- `invalidDates`
- `historicalCoverage`
- `executionDurationMs`
- `averageDecisionDurationMs`

## Frontend

A lightweight "Historical Opportunity Backtest" page section (via API consumption).
No new UI framework, no huge dashboard. Displays: run config, win rate, average/median
return, benchmark excess, max drawdown, average lead time, confidence calibration,
expected vs realized, false positives, missed opportunities, sample quality,
survivorship warning, data quality.

All user-facing explanations are in Turkish. Examples:
- "Bu fırsat karar tarihinden sonra %X getiri sağladı."
- "Karar üretiminde geleceğe ait veri kullanılmadı."
- "Bu karar yanlış pozitif olarak sınıflandırıldı."
- "Bu fırsat sistem tarafından kaçırıldı."
- "Örneklem sayısı güvenilir yorum için yetersiz."

## Tests

52 deterministic tests across 10 suites:

| Suite | Tests | Covers |
|---|---|---|
| `point-in-time-data.service.spec.ts` | 9 | PIT isolation, future candle rejection, future fundamental/research/catalyst/signal rejection |
| `future-outcome.service.spec.ts` | 12 | 1W/1M/3M/5M/6M/1Y outcomes, positive/negative return, target/stop reached, commission/slippage |
| `decision-success.service.spec.ts` | 5 | RETURN/RISK_ADJUSTED/TARGET/EARLY_OPPORTUNITY success, stop-first |
| `benchmark.service.spec.ts` | 3 | Excess return, unavailable benchmark, all horizons |
| `confidence-calibration.service.spec.ts` | 5 | Bucket classification, sample quality labels |
| `lead-time.service.spec.ts` | 2 | Lead time summary, no-data handling |
| `false-positive.service.spec.ts` | 4 | False positive detection, reason classification, yetersiz_kanit |
| `missed-opportunity.service.spec.ts` | 3 | Missed opportunity detection, missing decisions |
| `critical-look-ahead.spec.ts` | 5 | **MANDATORY**: future price/fundamental/catalyst/research/signal must NOT affect decision |
| `call-count.spec.ts` | 4 | Deterministic replay, future data verification, failure recovery |

### Critical Look-Ahead Tests (Mandatory)

These 5 tests are mandatory for GREEN status:
1. Future price added → decision MUST remain unchanged
2. Future fundamental statement added → decision MUST remain unchanged
3. Future catalyst added → decision MUST remain unchanged
4. Future research evidence added → decision MUST remain unchanged
5. Future signal added → decision MUST remain unchanged

All 5 pass.

## Known Issues

1. **Survivorship bias**: Historical BIST symbol membership is not available;
   the system explicitly flags `SURVIVORSHIP_BIAS_POSSIBLE`.
2. **Corporate actions**: No split/dividend/merger/delisting adjustments in the
   existing historical data layer. Flagged in every report.
3. **Walk-forward ML**: The system is a deterministic rolling historical evaluation,
   NOT a true ML walk-forward (no training process). Labelled as
   `HISTORICAL_OUTCOME_VALIDATION`.
4. **Lead time**: The current implementation uses the 3M return threshold (>10%)
   as a proxy for "major move" detection since historical candle-by-candle
   major-move detection requires additional infrastructure.
5. **Frontend page**: The API is fully functional but the frontend page is a
   lightweight section consuming the API (not a separate dashboard).

## Files Created

- `apps/api/src/modules/early-opportunity-backtest/early-opportunity-backtest.types.ts`
- `apps/api/src/modules/early-opportunity-backtest/point-in-time-data.service.ts`
- `apps/api/src/modules/early-opportunity-backtest/future-outcome.service.ts`
- `apps/api/src/modules/early-opportunity-backtest/decision-success.service.ts`
- `apps/api/src/modules/early-opportunity-backtest/benchmark.service.ts`
- `apps/api/src/modules/early-opportunity-backtest/confidence-calibration.service.ts`
- `apps/api/src/modules/early-opportunity-backtest/lead-time.service.ts`
- `apps/api/src/modules/early-opportunity-backtest/false-positive.service.ts`
- `apps/api/src/modules/early-opportunity-backtest/missed-opportunity.service.ts`
- `apps/api/src/modules/early-opportunity-backtest/historical-early-opportunity-backtest.service.ts`
- `apps/api/src/modules/early-opportunity-backtest/historical-early-opportunity-backtest.controller.ts`
- `apps/api/src/modules/early-opportunity-backtest/early-opportunity-backtest.module.ts`
- `apps/api/src/modules/early-opportunity-backtest/dto/early-opportunity-backtest-request.dto.ts`
- `apps/api/src/modules/early-opportunity-backtest/dto/index.ts`
- `apps/api/src/modules/early-opportunity-backtest/__tests__/*.spec.ts` (10 files)

## Files Modified

- `apps/api/src/app.module.ts` (added `EarlyOpportunityBacktestModule` import)

## Next Sprint

R2-047: Real-time Early Opportunity Monitoring & Notification System
