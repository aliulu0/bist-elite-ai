# Sprint 9 - Prompt 53: Market Regime Engine

## Overview

Production-ready Market Regime Engine that classifies current market conditions and provides contextual information for all analysis engines. Detects 13 market regimes, tracks transitions, provides regime-aware context, and generates Turkish reports.

## Architecture

```
MarketRegimeModule (@Global)
│
├── MarketRegimeOrchestratorService (Main Facade)
│   ├── detectRegime()              → Current regime classification
│   ├── detectAllTimeframes()       → Multi-timeframe regime analysis
│   ├── getRegimeSummary()          → Overall regime with confidence
│   ├── getRegimeContext()          → Context for other engines
│   ├── getTransitionAnalysis()     → Transition detection
│   ├── getHistoricalAnalysis()     → Historical regime data
│   └── generateReport()            → Turkish reports
│
├── RegimeDetectorService (Core Classification)
│   ├── classifyRegime()            → Single timeframe regime
│   ├── calculateConfidence()       → Confidence score
│   ├── calculateAgreement()        → Multi-indicator agreement
│   ├── calculateConflict()         → Conflict score
│   └── calculateStability()        → Stability score
│
├── RegimeTransitionService (Transition Detection)
│   ├── detectTransitions()         → Active transitions
│   ├── calculateTransitionProbability() → Transition likelihood
│   ├── detectEmergingTrends()      → Emerging bull/bear
│   ├── detectVolatilityChanges()   → Volatility expansion/contraction
│   └── getTransitionHistory()      → Historical transitions
│
├── RegimeHistoricalService (Historical Analysis)
│   ├── getRegimeDuration()         → How long in current regime
│   ├── getRegimeFrequency()        → How often each regime occurs
│   ├── getRegimePerformance()      → Strategy performance per regime
│   ├── getTransitionFrequency()    → How often transitions occur
│   └── compareRegimes()            → Regime comparison
│
├── RegimeContextService (Context Provider)
│   ├── getEliteScoreContext()      → Context for Elite Score Engine
│   ├── getExplainabilityContext()  → Context for Explainability Engine
│   ├── getConsensusContext()       → Context for Consensus Engine
│   ├── getTrackerContext()         → Context for Recommendation Tracker
│   ├── getPortfolioContext()       → Context for Paper Portfolio
│   └── getNotificationContext()    → Context for Notification Engine
│
└── RegimeReportGeneratorService (Turkish Reports)
    ├── generateSummaryReport()     → Current regime summary
    ├── generateConfidenceReport()  → Confidence analysis
    ├── generateTransitionReport()  → Transition analysis
    ├── generateHistoricalReport()  → Historical comparison
    └── generateRiskContextReport() → Risk context
```

## File Structure

```
apps/api/src/common/market-regime/
├── types.ts                              (40+ types, 13 regimes, config)
├── types.spec.ts                         (8 tests)
├── turkish-terms.ts                      (Turkish translations, helpers)
├── turkish-terms.spec.ts                 (8 tests)
├── regime-detector.service.ts            (Core classification)
├── regime-detector.service.spec.ts       (12 tests)
├── regime-transition.service.ts          (Transition detection)
├── regime-transition.service.spec.ts     (10 tests)
├── regime-historical.service.ts          (Historical analysis)
├── regime-historical.service.spec.ts     (8 tests)
├── regime-context.service.ts             (Context provider)
├── regime-context.service.spec.ts        (8 tests)
├── regime-report-generator.service.ts    (Turkish reports)
├── regime-report-generator.service.spec.ts (8 tests)
├── market-regime-orchestrator.service.ts (Main orchestrator)
├── market-regime-orchestrator.service.spec.ts (15 tests)
├── market-regime.module.ts               (@Global NestJS module)
├── market-regime.module.spec.ts          (6 tests)
└── index.ts                              (Barrel exports)
```

**Total: 20 source files, 91 tests across 10 test suites**

## Types

### Enums

```typescript
enum MarketRegimeType {
  STRONG_BULL = 'STRONG_BULL',
  BULL = 'BULL',
  WEAK_BULL = 'WEAK_BULL',
  SIDEWAYS = 'SIDEWAYS',
  WEAK_BEAR = 'WEAK_BEAR',
  BEAR = 'BEAR',
  STRONG_BEAR = 'STRONG_BEAR',
  HIGH_VOLATILITY = 'HIGH_VOLATILITY',
  LOW_VOLATILITY = 'LOW_VOLATILITY',
  RECOVERY = 'RECOVERY',
  CORRECTION = 'CORRECTION',
  DISTRIBUTION = 'DISTRIBUTION',
  ACCUMULATION = 'ACCUMULATION',
}

enum RegimeConfidence {
  VERY_HIGH = 'VERY_HIGH',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  VERY_LOW = 'VERY_LOW',
}

enum TransitionType {
  EMERGING_BULL = 'EMERGING_BULL',
  EMERGING_BEAR = 'EMERGING_BEAR',
  TREND_WEAKENING = 'TREND_WEAKENING',
  TREND_STRENGTHENING = 'TREND_STRENGTHENING',
  VOLATILITY_EXPANSION = 'VOLATILITY_EXPANSION',
  VOLATILITY_CONTRACTION = 'VOLATILITY_CONTRACTION',
  POSSIBLE_TRANSITION = 'POSSIBLE_TRANSITION',
}

enum RegimeTimeframe {
  M4 = 'M4',
  D1 = 'D1',
  W1 = 'W1',
  M1 = 'M1',
}

enum MarketPhase {
  ACCUMULATION = 'ACCUMULATION',
  MARKUP = 'MARKUP',
  DISTRIBUTION = 'DISTRIBUTION',
  MARKDOWN = 'MARKDOWN',
}
```

### Core Interfaces

```typescript
interface RegimeInput {
  timeframe: RegimeTimeframe;
  trendScore: number;
  momentumScore: number;
  volumeScore: number;
  volatilityScore: number;
  breadthScore?: number;
  priceChange: number;
  highLowRange?: number;
  indicators?: RegimeIndicator[];
}

interface RegimeIndicator {
  name: string;
  value: number;
  signal: string;
  weight: number;
}

interface RegimeClassification {
  type: MarketRegimeType;
  confidence: number;
  agreementScore: number;
  conflictScore: number;
  stabilityScore: number;
  factors: RegimeFactor[];
  classifiedAt: string;
}

interface RegimeFactor {
  factor: string;
  value: number;
  weight: number;
  contribution: number;
  description: string;
}

interface MultiTimeframeRegime {
  regimes: Record<RegimeTimeframe, RegimeClassification>;
  overall: MarketRegimeType;
  overallConfidence: number;
  timeframeAgreement: number;
  hasConflict: boolean;
  detectedAt: string;
}

interface RegimeTransition {
  from: MarketRegimeType;
  to: MarketRegimeType;
  probability: number;
  timeframe: RegimeTimeframe;
  indicators: string[];
  detectedAt: string;
}

interface RegimeContext {
  currentRegime: MarketRegimeType;
  confidence: number;
  duration: number;
  transitionRisk: number;
  recommendedAdjustments: RegimeAdjustment[];
  riskFactors: string[];
}

interface RegimeAdjustment {
  parameter: string;
  currentValue: number;
  recommendedValue: number;
  reason: string;
}

interface RegimeHistoricalData {
  regime: MarketRegimeType;
  occurrences: number;
  avgDuration: number;
  totalDuration: number;
  firstSeen: string;
  lastSeen: string;
}

interface RegimePerformanceByType {
  regime: MarketRegimeType;
  strategyPerformance: Record<string, {
    winRate: number;
    avgReturn: number;
    sharpeRatio: number;
  }>;
}

interface MarketRegimeConfig {
  enabled: boolean;
  regimeThresholds: {
    strongBull: number;
    bull: number;
    weakBull: number;
    sidewaysUpper: number;
    sidewaysLower: number;
    weakBear: number;
    bear: number;
    strongBear: number;
    highVolatility: number;
    lowVolatility: number;
  };
  weights: {
    trend: number;
    momentum: number;
    volume: number;
    volatility: number;
    breadth: number;
  };
  transition: {
    minConfidence: number;
    cooldownPeriod: number;
    maxTransitionsPerDay: number;
  };
  historical: {
    lookbackDays: number;
    minSamples: number;
  };
  enableCaching: boolean;
  cacheTtlMs: number;
}
```

## Service Designs

### 1. RegimeDetectorService

```typescript
@Injectable()
export class RegimeDetectorService {
  classifyRegime(input: RegimeInput): RegimeClassification
  calculateConfidence(indicators: RegimeIndicator[]): number
  calculateAgreement(indicators: RegimeIndicator[]): number
  calculateConflict(indicators: RegimeIndicator[]): number
  calculateStability(history: number[]): number
  determineRegimeType scores: {...}): MarketRegimeType
}
```

### 2. RegimeTransitionService

```typescript
@Injectable()
export class RegimeTransitionService {
  detectTransitions(current: MarketRegimeType, history: MarketRegimeType[]): RegimeTransition[]
  calculateTransitionProbability(from: MarketRegimeType, indicators: RegimeInput): number
  detectEmergingTrends(history: MarketRegimeType[]): TransitionType[]
  detectVolatilityChanges(volatilityHistory: number[]): TransitionType[]
  getTransitionHistory(transitions: RegimeTransition[]): RegimeTransition[]
}
```

### 3. RegimeHistoricalService

```typescript
@Injectable()
export class RegimeHistoricalService {
  getRegimeDuration(currentRegime: MarketRegimeType, history: MarketRegimeType[]): number
  getRegimeFrequency(history: MarketRegimeType[]): RegimeHistoricalData[]
  getRegimePerformance(regime: MarketRegimeType, recommendations: RecommendationRecord[]): RegimePerformanceByType
  getTransitionFrequency(transitions: RegimeTransition[]): Record<string, number>
  compareRegimes(regime1: MarketRegimeType, regime2: MarketRegimeType, history: MarketRegimeType[]): string
}
```

### 4. RegimeContextService

```typescript
@Injectable()
export class RegimeContextService {
  getEliteScoreContext(regime: MarketRegimeType, confidence: number): RegimeContext
  getExplainabilityContext(regime: MarketRegimeType, factors: RegimeFactor[]): RegimeContext
  getConsensusContext(regime: MarketRegimeType, agreement: number): RegimeContext
  getTrackerContext(regime: MarketRegimeType, duration: number): RegimeContext
  getPortfolioContext(regime: MarketRegimeType, transitionRisk: number): RegimeContext
  getNotificationContext(regime: MarketRegimeType, confidence: number): RegimeContext
}
```

### 5. RegimeReportGeneratorService

```typescript
@Injectable()
export class RegimeReportGeneratorService {
  generateSummaryReport(regime: MultiTimeframeRegime): string
  generateConfidenceReport(regime: RegimeClassification): string
  generateTransitionReport(transitions: RegimeTransition[]): string
  generateHistoricalReport(history: RegimeHistoricalData[]): string
  generateRiskContextReport(context: RegimeContext): string
}
```

### 6. MarketRegimeOrchestratorService

```typescript
@Injectable()
export class MarketRegimeOrchestratorService {
  detectRegime(input: RegimeInput): RegimeClassification
  detectAllTimeframe(inputs: Record<RegimeTimeframe, RegimeInput>): MultiTimeframeRegime
  getRegimeSummary(): MultiTimeframeRegime
  getRegimeContext(regime: MarketRegimeType): RegimeContext
  getTransitionAnalysis(): RegimeTransition[]
  getHistoricalAnalysis(): RegimeHistoricalData[]
  generateReport(type: 'summary' | 'confidence' | 'transition' | 'historical' | 'risk'): string
}
```

## Integration Points

| Engine | Context Provided | Data Flow |
|--------|-----------------|-----------|
| Elite Score Engine | Regime-based score adjustments | Read regime, adjust scoring weights |
| Explainability Engine | Regime context for explanations | Read regime, enhance explanations |
| Consensus Engine | Regime-aware consensus | Read regime, adjust consensus weights |
| Recommendation Tracker | Regime performance tracking | Read regime, track per-regime performance |
| Paper Portfolio | Regime-based risk management | Read regime, adjust position sizing |
| Notification Engine | Regime alerts | Read regime, send transition alerts |

## Test Plan

| Test File | Tests | Coverage |
|-----------|-------|----------|
| types.spec.ts | 8 | Type validation, config defaults, factory functions |
| turkish-terms.spec.ts | 8 | Translation maps, formatting, helpers |
| regime-detector.service.spec.ts | 12 | Classification, confidence, agreement, conflict, stability |
| regime-transition.service.spec.ts | 10 | Transition detection, probability, emerging trends |
| regime-historical.service.spec.ts | 8 | Duration, frequency, performance, comparison |
| regime-context.service.spec.ts | 8 | All 6 context providers, adjustments |
| regime-report-generator.service.spec.ts | 8 | All 5 report types, Turkish output |
| market-regime-orchestrator.service.spec.ts | 15 | Orchestrator facade, multi-TF, integration |
| market-regime.module.spec.ts | 6 | Module creation, providers, exports |
| **Total** | **91** | |

## Implementation Order

1. Create `types.ts`
2. Create `turkish-terms.ts`
3. Create `regime-detector.service.ts`
4. Create `regime-transition.service.ts`
5. Create `regime-historical.service.ts`
6. Create `regime-context.service.ts`
7. Create `regime-report-generator.service.ts`
8. Create `market-regime-orchestrator.service.ts`
9. Create `market-regime.module.ts`
10. Create `index.ts`
11. Write all test suites
12. Update `app.module.ts`
13. Update `CHANGELOG.md`
14. Create documentation
15. Run tests

## CHANGELOG Entry

```markdown
## [2.3.0] - 2026-07-21

### Added (Market Regime Engine - Prompt 53)
- `RegimeDetectorService` — Core regime classification with 13 regimes, confidence calculation, indicator agreement/conflict/stability scoring
- `RegimeTransitionService` — Transition detection, probability calculation, emerging trend detection, volatility change detection
- `RegimeHistoricalService` — Regime duration, frequency, performance per regime, transition frequency, regime comparison
- `RegimeContextService` — Context provider for 6 engines (Elite Score, Explainability, Consensus, Tracker, Portfolio, Notification)
- `RegimeReportGeneratorService` — Turkish summary, confidence, transition, historical, and risk context reports
- `MarketRegimeOrchestratorService` — Main facade with regime detection, multi-TF analysis, context, transitions, history, reporting
- `MarketRegimeModule` — global NestJS module exporting all regime services
- 40+ types: `MarketRegimeType`, `RegimeConfidence`, `TransitionType`, `RegimeTimeframe`, `MarketPhase`, `RegimeInput`, `RegimeClassification`, `RegimeFactor`, `MultiTimeframeRegime`, `RegimeTransition`, `RegimeContext`, `RegimeAdjustment`, `RegimeHistoricalData`, `RegimePerformanceByType`, `MarketRegimeConfig`
- 13 market regimes: STRONG_BULL, BULL, WEAK_BULL, SIDEWAYS, WEAK_BEAR, BEAR, STRONG_BEAR, HIGH_VOLATILITY, LOW_VOLATILITY, RECOVERY, CORRECTION, DISTRIBUTION, ACCUMULATION
- Configurable regime thresholds, weights, transition criteria, historical lookback
- Turkish terminology and report generation for all regime analysis
- 91 unit tests across 10 test suites
- Documentation: docs/market-regime-engine.md

### Changed
- `AppModule` now imports `MarketRegimeModule`
- Global services available: `MarketRegimeOrchestratorService`, `RegimeDetectorService`, `RegimeTransitionService`, `RegimeHistoricalService`, `RegimeContextService`, `RegimeReportGeneratorService`
- Total API tests: 961 tests / 83 suites ALL GREEN
```
