# Adaptive Scoring Calibration Engine

Enterprise-grade adaptive calibration system that continuously monitors scoring component health, evaluates performance, analyzes trends, and generates actionable recommendations for weight adjustment. Part of Sprint 8 Prompt 50.

## Architecture

```
┌─────────────────────────────────────────────┐
│          CalibrationOrchestrator             │
│  (calibrate / generateReport / Turkish)     │
├─────────────┬───────────────┬───────────────┤
│ Scoring     │ Performance   │ Trend         │
│ Diagnostics │ Evaluator     │ Analyzer      │
│ Service     │ Service       │ Service       │
├─────────────┼───────────────┼───────────────┤
│ Recommend.  │ Report Gen.   │               │
│ Engine      │ Service       │               │
└─────────────┴───────────────┴───────────────┘
```

## Components

### ScoringDiagnosticsService
Analyzes individual scoring components against historical snapshots.

- **Effectiveness**: Prediction accuracy with score-outcome correlation
- **Stability**: Coefficient of variation of scores
- **Contribution**: Correlation between component scores and outcomes
- **Issue Detection**: 6 diagnostic issue types
- **Health Status**: EXCELLENT / GOOD / FAIR / POOR / CRITICAL

### PerformanceEvaluatorService
Evaluates overall scoring system performance.

- Prediction accuracy, precision, recall, F1 score
- Profit factor, Sharpe ratio, max drawdown
- Historical reliability
- Score distribution analysis (mean, median, stdDev, min, max)
- Calibration error and Brier score
- Integration with validation results from Strategy Validation Engine

### TrendAnalyzerService
Identifies scoring trends using linear regression.

- Per-component direction (IMPROVING / STABLE / DEGRADING / INSUFFICIENT_DATA)
- Slope, R², forecast for next period
- Strength and confidence calculation
- Overall trend summary

### RecommendationEngineService
Generates prioritized weight adjustment recommendations.

- Weight change calculation per issue type
- Priority levels: LOW / MEDIUM / HIGH / CRITICAL
- Expected impact estimation (accuracy, confidence, risk changes)
- Safeguard generation
- Approval requirements and auto-applicability

### CalibrationReportGeneratorService
Generates comprehensive Turkish reports.

- Component rankings
- Improvement opportunities
- Risk assessment
- Turkish summary with tables and recommendations

## Calibration Status

| Status | Description |
|--------|-------------|
| HEALTHY | Score ≥ 75, all components performing well |
| NEEDS_REVIEW | Score ≥ 60, some components need attention |
| DEGRADING | Score ≥ 40, multiple components underperforming |
| CRITICAL | Score < 40 or ≥ 3 critical components |

## Usage

```typescript
// Inject via NestJS DI
constructor(
  private readonly orchestrator: CalibrationOrchestrator
) {}

// Run calibration
const summary = await this.orchestrator.calibrate({
  snapshots: historicalData,
  validationResults: strategyValidationResults,
  config: { /* optional overrides */ }
});

// Generate report
const report = await this.orchestrator.generateReport(summary);

// Get Turkish summary
const turkishReport = await this.orchestrator.generateTurkishSummary(summary);
```

## Configuration

Default configuration in `CALIBRATION_CONFIG_DEFAULTS`:

```typescript
{
  evaluationWindow: { shortTerm: 30, mediumTerm: 90, longTerm: 365 },
  thresholds: {
    minSampleSize: 30,
    effectivenessThreshold: 0.6,
    stabilityThreshold: 0.7,
    trendSensitivity: 0.1,
    recommendationConfidence: 0.7,
  },
  recommendationSettings: {
    maxWeightChange: 0.05,
    minWeightChange: 0.01,
    requireApprovalAbove: 0.03,
    autoApplyBelow: 0.01,
    cooldownPeriod: 30,
  },
}
```

## Test Coverage

- 54 unit tests across 6 test suites
- Coverage: ScoringDiagnostics, PerformanceEvaluator, TrendAnalyzer, RecommendationEngine, CalibrationReportGenerator, CalibrationOrchestrator

## File Structure

```
apps/api/src/common/adaptive-calibration/
├── types.ts                              # 30+ types, enums, config defaults
├── turkish-terms.ts                      # Turkish translations and generators
├── scoring-diagnostics.service.ts        # Component health analysis
├── scoring-diagnostics.service.spec.ts   # 9 tests
├── performance-evaluator.service.ts      # Performance evaluation
├── performance-evaluator.service.spec.ts  # 12 tests
├── trend-analyzer.service.ts             # Trend analysis
├── trend-analyzer.service.spec.ts        # 8 tests
├── recommendation-engine.service.ts      # Recommendation generation
├── recommendation-engine.service.spec.ts  # 7 tests
├── calibration-report-generator.service.ts # Report generation
├── calibration-report-generator.service.spec.ts # 8 tests
├── calibration-orchestrator.service.ts   # Main orchestrator
├── calibration-orchestrator.service.spec.ts # 10 tests
├── adaptive-calibration.module.ts        # NestJS module
└── index.ts                              # Public exports
```
