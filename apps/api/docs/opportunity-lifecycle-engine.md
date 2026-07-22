# Opportunity Lifecycle Engine

> Enterprise-grade opportunity lifecycle tracking, health monitoring, early detection, failure analysis, and evolution tracking for Borsa Istanbul.

## Overview

The Opportunity Lifecycle Engine tracks opportunities through 8 lifecycle stages, monitors health and evolution, classifies early detection performance, analyzes failures, and generates Turkish-language reports.

## Architecture

```
OpportunityLifecycleModule (@Global)
│
├── LifecycleTrackerService (Core Tracking)
├── EvolutionAnalyzerService (Score/Confidence Evolution)
├── HealthIndexService (Health Scoring)
├── EarlyDetectionAnalyzerService (Detection Classification)
├── FailureAnalyzerService (Failure Analysis)
└── LifecycleReportGeneratorService (Turkish Reports)
```

## Lifecycle Stages

| Stage | Turkish | Description |
|-------|---------|-------------|
| DETECTED | Tespit Edildi | Initial detection |
| EMERGING | Gelenme | Signal emerging, needs confirmation |
| CONFIRMED | Onaylandi | Signal confirmed |
| STRENGTHENING | Guclenme | Signal strengthening |
| MATURE | Olgun | Signal at peak |
| WEAKENING | Zayiflama | Signal fading |
| EXPIRED | Suresi Doldu | Auto-expired |
| CANCELLED | Iptal Edildi | Manually cancelled |

## Usage

### Tracking an Opportunity

```typescript
import { LifecycleTrackerService, TrackOpportunityInput, OpportunityStage } from './common/opportunity-lifecycle';

const tracker: LifecycleTrackerService;

const input: TrackOpportunityInput = {
  stockSymbol: 'THYAO',
  entryPrice: 280,
  targetPrice: 320,
  stopLoss: 260,
  confidence: 0.85,
  eliteScore: 72,
  strategy: 'momentum',
};

const record = tracker.trackOpportunity(input);
// record.stage === OpportunityStage.DETECTED
// Auto-transitions to EMERGING when eliteScore >= 70 and confidence >= 0.7
```

### Evolution Analysis

```typescript
import { EvolutionAnalyzerService, ScoreEvolution } from './common/opportunity-lifecycle';

const analyzer: EvolutionAnalyzerService;

const evolution = analyzer.analyzeEvolution(record, currentPrice, currentConfidence);
// evolution.trend === EvolutionTrend.IMPROVING
// evolution.metrics — score, confidence, risk, momentum, volume, volatility, composite
```

### Health Monitoring

```typescript
import { HealthIndexService } from './common/opportunity-lifecycle';

const healthService: HealthIndexService;

const health = healthService.calculateHealth(record);
// health.score — 0-100
// health.level — HealthLevel.EXCELLENT/GOOD/FAIR/POOR/CRITICAL
// health.factors — scoreQuality, confidence, momentum, risk, stability
```

### Early Detection

```typescript
import { EarlyDetectionAnalyzerService } from './common/opportunity-lifecycle';

const earlyDetector: EarlyDetectionAnalyzerService;

const detection = earlyDetector.analyzeDetection(record);
// detection.result — EARLY/ON_TIME/LATE/MISSED
// detection.leadTime — hours before confirmation
// detection.earlyDetectionSuccess — boolean
```

### Failure Analysis

```typescript
import { FailureAnalyzerService } from './common/opportunity-lifecycle';

const failureAnalyzer: FailureAnalyzerService;

const failures = failureAnalyzer.analyzeFailures(record);
// failures.failures — array of OpportunityFailure
// Each failure: category (FALSE_POSITIVE/WEAK_SIGNAL/LATE_SIGNAL/CANCELLED/HIGH_RISK), severity, score
```

### Turkish Reports

```typescript
import { LifecycleReportGeneratorService } from './common/opportunity-lifecycle';

const reportGenerator: LifecycleReportGeneratorService;

const timeline = reportGenerator.generateTimelineReport(record);
const summary = reportGenerator.generateLifecycleSummaryReport(allRecords);
const evolutionReport = reportGenerator.generateEvolutionReport(evolution);
const healthReport = reportGenerator.generateHealthReport(health);
const detectionReport = reportGenerator.generateEarlyDetectionReport(detection);
```

## Types

### Enums

- `OpportunityStage` — 8 lifecycle stages
- `StageTransitionReason` — 10 reasons for transitions
- `HealthLevel` — EXCELLENT, GOOD, FAIR, POOR, CRITICAL
- `EvolutionTrend` — IMPROVING, STABLE, DECLINING, VOLATILE
- `FailureCategory` — FALSE_POSITIVE, WEAK_SIGNAL, LATE_SIGNAL, CANCELLED, HIGH_RISK
- `EarlyDetectionResult` — EARLY, ON_TIME, LATE, MISSED
- `SignalDirection` — BULLISH, BEARISH, NEUTRAL

### Core Types

- `OpportunityRecord` — full lifecycle record with scores, health, failures, transitions, snapshots
- `StageTransition` — transition between stages with reason and timestamp
- `OpportunitySnapshot` — point-in-time capture of scores and metrics
- `ScoreEvolution` — evolution analysis results with trend and metrics
- `HealthIndex` — health score with factor breakdown
- `EarlyDetectionMetrics` — detection timing and classification
- `OpportunityFailure` — failure detail with category and severity
- `TrackOpportunityInput` — input for tracking new opportunities
- `UpdateOpportunityInput` — input for updating opportunities
- `LifecycleConfig` — configurable thresholds and weights

## Configuration

```typescript
const config: LifecycleConfig = {
  stageTransition: {
    emerging: { minEliteScore: 70, minConfidence: 0.7 },
    confirmed: { minHoldDays: 1, minHealthScore: 50 },
    strengthening: { minHoldDays: 3, minHealthScore: 70 },
    mature: { minHoldDays: 5, peakScore: 85 },
    weakening: { minHoldDays: 7, declineThreshold: 0.15 },
    expiry: { maxHoldDays: 30 },
  },
  health: {
    weights: { scoreQuality: 0.25, confidence: 0.20, momentum: 0.20, risk: 0.15, stability: 0.20 },
    thresholds: { excellent: 80, good: 60, fair: 40, poor: 20 },
  },
  earlyDetection: {
    earlyThreshold: 24,   // hours before confirmation
    onTimeThreshold: 72,
    lateThreshold: 168,
  },
};
```

## Test Coverage

- 100 unit tests across 9 test suites
- All lifecycle stages tested with auto-transitions
- Evolution, health, early detection, failure analysis fully covered
- Turkish terminology and report generation verified
- Configuration and edge cases covered
