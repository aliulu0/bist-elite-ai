# Enterprise Strategy Validation Engine

Production-ready strategy validation engine with performance metrics, signal quality analysis, market condition evaluation, multi-timeframe validation, and comprehensive Turkish reporting.

## Architecture

```
strategy-validation/
├── types.ts                          # 30+ types, enums, config
├── turkish-terms.ts                  # Turkish translation maps and generators
├── performance-metrics.service.ts    # 21 performance metrics calculator
├── signal-quality.service.ts         # Signal quality analysis (precision, recall, F1)
├── market-condition.service.ts       # Market condition classification and analysis
├── multi-timeframe-validator.service.ts # Multi-timeframe validation
├── elite-score-validator.service.ts  # Elite score accuracy and calibration
├── report-generator.service.ts       # Report generation with Turkish summaries
├── validation-orchestrator.service.ts # Main orchestrator with batch processing
├── strategy-validation.module.ts     # Global NestJS module
├── index.ts                          # Barrel exports
└── *.spec.ts                         # 61 tests / 7 suites
```

## Validation Types

| Type | Description |
|------|-------------|
| SINGLE_STRATEGY | Validate a single strategy independently |
| MULTI_STRATEGY_COMPARISON | Compare multiple strategies side by side |
| INDICATOR_COMBINATION | Validate indicator combinations |
| PORTFOLIO_VALIDATION | Validate portfolio-level strategies |
| MULTI_TIMEFRAME | Validate across multiple timeframes |
| HISTORICAL_SCENARIO | Validate under historical scenarios |

## Performance Metrics

| Metric | Description |
|--------|-------------|
| Total Return | Absolute and percentage return |
| Annualized Return | Year-over-year return rate |
| Win Rate | Percentage of winning trades |
| Loss Rate | Percentage of losing trades |
| Profit Factor | Gross profit / Gross loss |
| Sharpe Ratio | Risk-adjusted return (vs risk-free rate) |
| Sortino Ratio | Downside risk-adjusted return |
| Max Drawdown | Maximum peak-to-trough decline |
| Avg Drawdown | Average drawdown magnitude |
| Recovery Factor | Return / Max Drawdown |
| Avg Holding Period | Average trade duration |
| Signal Frequency | Trades per day |
| Volatility | Annualized standard deviation |
| Beta | Market sensitivity |
| Alpha | Excess return vs market |
| Treynor Ratio | Return per unit of market risk |
| Calmar Ratio | Return / Max Drawdown |
| Expectancy | Expected value per trade |
| Kelly Criterion | Optimal position sizing |

## Signal Quality

| Metric | Description |
|--------|-------------|
| Precision | True positives / (True + False positives) |
| Recall | True positives / (True + False negatives) |
| F1 Score | Harmonic mean of precision and recall |
| False Positive Rate | False positives / (False positives + True negatives) |
| False Negative Rate | False negatives / (False negatives + True positives) |
| Signal Stability | Consistency of confidence levels |
| Signal Consistency | Consistency of trade outcomes |

## Market Conditions

| Condition | Description |
|-----------|-------------|
| BULL_MARKET | Upward trending market |
| BEAR_MARKET | Downward trending market |
| SIDEWAYS_MARKET | Range-bound market |
| HIGH_VOLATILITY | High price volatility |
| LOW_VOLATILITY | Low price volatility |
| HIGH_VOLUME | Above-average trading volume |
| LOW_VOLUME | Below-average trading volume |

## Usage

```typescript
import { ValidationOrchestrator, ValidationType } from './common/strategy-validation';

const orchestrator = new ValidationOrchestrator();

const result = await orchestrator.validate({
  strategyId: 'momentum-v1',
  strategyName: 'Momentum Strategy V1',
  validationType: ValidationType.SINGLE_STRATEGY,
  timeframes: [Timeframe.D1, Timeframe.W1],
  trades: [/* ... */],
  signals: [/* ... */],
  marketData: [/* ... */],
});

// result.overallScore: 72.5
// result.status: 'PASSED'
// result.performanceMetrics: { winRate: 65, sharpeRatio: 1.5, ... }
// result.signalQuality: { precision: 0.72, f1Score: 0.70, ... }
// result.marketConditionPerformance: [...]
// result.timeframeValidation: [...]
// result.strengths: ['Yüksek kazanma oranı: %65.0']
// result.weaknesses: ['Yüksek drawdown: %18.0']
// result.improvementSuggestions: ['Drawdown azaltın']
```

## Strategy Comparison

```typescript
const comparison = await orchestrator.compare([
  { strategyId: 's1', strategyName: 'Strategy 1', ... },
  { strategyId: 's2', strategyName: 'Strategy 2', ... },
]);

// comparison.winner: { strategyId: 's2', overallScore: 80 }
// comparison.strategies: [{ rank: 1, ... }, { rank: 2, ... }]
```

## Report Generation

```typescript
const report = await orchestrator.generateReport(input);

// report.summary: ValidationSummary
// report.detailedAnalysis.tradeAnalysis: [...]
// report.detailedAnalysis.monthlyReturns: [...]
// report.detailedAnalysis.drawdownAnalysis: [...]
// report.detailedAnalysis.indicatorPerformance: {...}
// report.disclaimer: 'Bu rapor yalnızca bilgilendirme amaçlıdır...'
```

## Turkish Summaries

```typescript
const turkishSummary = reportGenerator.generateTurkishSummary(summary);

// ## Doğrulama Özeti - Momentum Strategy V1
//
// **Genel Skor:** 72.5/100
// **Durum:** Başarılı
// **Güven:** 78.0%
//
// ### Performans Metrikleri
// | Metrik | Değer |
// |--------|-------|
// | Toplam Getiri | 25.50% |
// | Kazanma Oranı | 65.0% |
// | Kâr Faktörü | 2.10 |
// ...
```

## Configuration

```typescript
import { getValidationConfig } from './common/strategy-validation';

const config = getValidationConfig({
  validationWindows: { shortTerm: 30, mediumTerm: 90, longTerm: 365 },
  performanceThresholds: {
    minWinRate: 55,
    minProfitFactor: 1.5,
    minSharpeRatio: 1.0,
    maxDrawdown: 20,
  },
  metricWeights: {
    returnWeight: 0.30,
    riskWeight: 0.25,
    qualityWeight: 0.25,
    consistencyWeight: 0.20,
  },
  acceptanceCriteria: {
    minOverallScore: 65,
    minConfidence: 0.7,
    maxConflictLevel: 0.4,
  },
  riskFreeRate: 0.15,
  tradingDaysPerYear: 252,
});
```

## Integration

The `StrategyValidationModule` is registered as a global module in `AppModule` and available for injection throughout the application. All services are independently testable and composable. The engine integrates with the Elite Score Engine, Explainability Engine, and Multi-Timeframe Consensus Engine for comprehensive strategy evaluation.
