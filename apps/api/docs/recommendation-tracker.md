# Recommendation Performance Tracker

## Overview

Production-ready Recommendation Performance Tracker that continuously evaluates the real-world performance of generated investment opportunities and provides measurable feedback for system improvement.

## Architecture

```
RecommendationTrackerModule (@Global)
├── RecommendationTrackerService (Orchestrator)
├── PerformanceEvaluationService (Multi-Window Metrics)
├── EliteScoreAnalyzerService (Score Accuracy)
├── AIAnalysisReviewerService (Explanation Consistency)
├── StrategyAnalyzerService (Strategy/Sector/Timeframe Analysis)
├── FailureAnalyzerService (Failure Pattern Detection)
└── RecommendationReportGeneratorService (Turkish Reports)
```

## Services

### RecommendationTrackerService

Main orchestrator for recommendation lifecycle management.

**Key Methods:**
- `trackRecommendation(input)` — Create a new tracking record
- `updateRecommendation(id, updates)` — Update lifecycle state
- `closeRecommendation(id, exitPrice, exitReason)` — Finalize with outcome
- `getRecommendations(query)` — Query with filters and pagination
- `getActiveRecommendations()` — Get all active recommendations
- `getCompletedRecommendations()` — Get all completed recommendations
- `getSuccessAnalytics()` — Calculate overall success metrics
- `getPerformanceDashboard()` — Generate full performance dashboard

### PerformanceEvaluationService

Multi-window performance evaluation across 7 time horizons.

**Evaluation Windows:** 1D, 3D, 1W, 2W, 1M, 3M, 6M

**Key Methods:**
- `evaluatePerformance(rec, priceHistory)` — Full multi-window evaluation
- `calculateReturnMetrics(entry, exit)` — Return, max gain, max drawdown
- `calculateRiskAdjustedReturn(returns)` — Sharpe-like ratio
- `calculateSharpeRatio(returns)` / `calculateSortinoRatio(returns)`
- `getWindowPerformance(rec, prices, window)` — Single window metrics
- `getAggregatePerformance(recommendations)` — Cross-window aggregation

### EliteScoreAnalyzerService

Analyzes elite score accuracy and prediction quality.

**Key Methods:**
- `analyzeScoreAccuracy(recommendations)` — Score vs actual outcome
- `analyzeConfidenceAccuracy(recommendations)` — Confidence calibration
- `analyzeScoreStability(recommendations)` — Score drift over time
- `analyzePredictionQuality(recommendations)` — Brier score, calibration
- `calculateBrierScore(predictions, outcomes)` — Prediction accuracy
- `calculateCalibrationError(predictions, outcomes)` — Calibration error

### AIAnalysisReviewerService

Reviews explanation consistency and confidence calibration.

**Key Methods:**
- `reviewExplanationConsistency(recommendations)` — Explanation vs outcome
- `reviewEvidenceQuality(recommendations)` — Evidence relevance scoring
- `reviewRecommendationQuality(recommendations)` — Recommendation accuracy
- `reviewConfidenceCalibration(recommendations)` — Confidence vs hit rate

### StrategyAnalyzerService

Analyzes strategy, indicator, sector, timeframe, and market condition performance.

**Key Methods:**
- `analyzeStrategyPerformance(recommendations)` — Per-strategy metrics
- `analyzeIndicatorPerformance(recommendations)` — Per-indicator accuracy
- `analyzeSectorPerformance(recommendations)` — Per-sector metrics
- `analyzeTimeframePerformance(recommendations)` — Per-timeframe accuracy
- `analyzeMarketConditionPerformance(recommendations)` — Per-regime metrics

### FailureAnalyzerService

Identifies failure patterns and root causes.

**Failure Types:**
- `LATE_SIGNAL` — Delayed signal generation
- `FALSE_POSITIVE` — Incorrect buy signal
- `FALSE_NEGATIVE` — Missed opportunity
- `WEAK_CONFIRMATION` — Low-confidence entry
- `HIGH_RISK_SIGNAL` — Risk-adjusted failure
- `POOR_TIMING` — Entry/exit timing issues

### RecommendationReportGeneratorService

Generates Turkish reports for all analysis results.

**Report Types:**
- Summary Report — Overall performance overview
- Performance Dashboard — Metrics breakdown
- Accuracy Report — Score accuracy analysis
- Sector Report — Sector performance comparison
- Strategy Report — Strategy comparison
- Monthly Report — Monthly aggregation
- Failure Report — Failure pattern analysis

## Configuration

```typescript
interface RecommendationTrackerConfig {
  enabled: boolean;
  evaluationWindows: EvaluationWindow[];
  successThresholds: {
    minWinRate: number;       // default: 55%
    minProfitFactor: number;  // default: 1.3
    minSharpeRatio: number;   // default: 1.0
    maxDrawdown: number;      // default: 20%
  };
  alertThresholds: {
    lowWinRate: number;       // default: 40%
    highDrawdown: number;     // default: 25%
    poorSharpe: number;       // default: 0.5
    lowConfidence: number;    // default: 0.3
  };
  metricWeights: {
    returnWeight: number;     // default: 0.35
    riskWeight: number;       // default: 0.25
    qualityWeight: number;    // default: 0.25
    consistencyWeight: number;// default: 0.15
  };
  tracking: {
    maxHistorySize: number;   // default: 10000
    enableCaching: boolean;   // default: true
    cacheTtlMs: number;       // default: 300000
  };
}
```

## Integration Points

| Engine | Data Flow |
|--------|-----------|
| Paper Portfolio Engine | Position entry/exit prices, holding periods |
| Elite Score Engine | Score accuracy, confidence calibration |
| Explainability Engine | Explanation consistency, evidence quality |
| Consensus Engine | Consensus accuracy, conflict resolution |
| Strategy Validation Engine | Strategy performance, signal quality |
| Adaptive Calibration Engine | Weight effectiveness, trend analysis |
| Notification Engine | Notification timing, delivery status |

## Usage Examples

### Track a Recommendation

```typescript
const tracker = new RecommendationTrackerService(...);

const record = tracker.trackRecommendation({
  stockSymbol: 'THYAO',
  stockName: 'Turk Hava Yollari',
  entryPrice: 100,
  entryEliteScore: 75,
  entryConfidence: 0.8,
  entryConsensusScore: 70,
  strategyUsed: 'elite-score',
  marketRegime: MarketRegime.BULL,
  timeframeConsensus: 'balanced',
  sector: 'Turizm',
});
```

### Close a Recommendation

```typescript
const closed = tracker.closeRecommendation(record.id, 115, 'target-reached');
// closed.outcome === RecommendationOutcome.WINNER
// closed.actualReturn === 15
```

### Get Performance Dashboard

```typescript
const dashboard = tracker.getPerformanceDashboard();
// dashboard.summary.winRate === 60
// dashboard.topPerformers === [...]
// dashboard.strategyBreakdown === [...]
```

### Generate Reports

```typescript
const summaryReport = tracker.generateSummaryReport();
const accuracyReport = tracker.generateAccuracyReport();
const sectorReport = tracker.generateSectorReport();
const failureReport = tracker.generateFailureReport();
```

## Testing

```bash
npx jest --config jest.config.ts --testPathPattern="recommendation-tracker"
```

**134 tests across 10 test suites:**
- types.spec.ts — 8 tests
- turkish-terms.spec.ts — 14 tests
- performance-evaluation.service.spec.ts — 12 tests
- elite-score-analyzer.service.spec.ts — 10 tests
- ai-analysis-reviewer.service.spec.ts — 8 tests
- strategy-analyzer.service.spec.ts — 12 tests
- failure-analyzer.service.spec.ts — 12 tests
- recommendation-report-generator.service.spec.ts — 8 tests
- recommendation-tracker.service.spec.ts — 15 tests
- recommendation-tracker.module.spec.ts — 6 tests
