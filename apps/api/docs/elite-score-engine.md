# Enterprise Elite Score Engine 2.0

Production-ready scoring engine with 12 components, 3 weight profiles, evidence matrix, consensus analysis, and historical reliability.

## Architecture

```
elite-score/
├── types.ts                          # 30+ types, enums, config
├── weight-manager.service.ts         # Weight management and normalization
├── technical-scorer.service.ts       # Technical analysis scoring
├── consensus-analyzer.service.ts     # Cross-timeframe consensus
├── historical-reliability.service.ts # Backtest-based reliability
├── early-opportunity.service.ts      # Early opportunity detection
├── evidence-matrix.service.ts        # Evidence matrix generation
├── elite-score.service.ts            # Main orchestrator
├── elite-score.module.ts             # Global NestJS module
├── index.ts                          # Barrel exports
└── *.spec.ts                         # 106 tests / 9 suites
```

## Scoring Components

| Component | Weight (Balanced) | Description |
|-----------|------------------|-------------|
| Technical | 0.10 | Composite technical analysis |
| Trend | 0.10 | Trend direction and strength |
| Momentum | 0.10 | RSI, MACD, Stochastic analysis |
| Volume | 0.08 | Volume analysis and OBV |
| Volatility | 0.08 | ATR-based volatility scoring |
| Liquidity | 0.07 | Market depth and spread |
| Risk | 0.10 | Risk factor penalties |
| Strategy | 0.10 | Strategy agreement score |
| Multi-Timeframe | 0.12 | Cross-timeframe consensus |
| Historical | 0.08 | Backtest reliability |
| Early Opportunity | 0.07 | Fresh signal detection |

## Weight Profiles

### Conservative
- Higher risk weighting (15%), lower momentum (8%), minimal early opportunity (3%)
- Suitable for institutional and risk-averse investors

### Balanced
- Equal distribution across components
- Default profile for most use cases

### Aggressive
- Higher momentum (12%), early opportunity (17%), lower risk (5%)
- Suitable for momentum traders and early-stage detection

## Usage

```typescript
import { EliteScoreOrchestrator, ScoringProfile } from './common/elite-score';

const orchestrator = new EliteScoreOrchestrator();

const result = await orchestrator.calculate({
  stockSymbol: 'THYAO',
  stockName: 'Türk Hava Yolları',
  currentPrice: 280.50,
  profile: ScoringProfile.BALANCED,
  technicalScores: [
    { timeframe: 'D1', trend: 75, momentum: 65, volume: 60, volatility: 45 },
  ],
  historicalReliability: {
    winRate: 72,
    maxDrawdown: 8,
    avgReturn: 18,
    sharpeRatio: 2.1,
  },
  earlyOpportunity: {
    signalFreshness: 0.9,
    confirmationLevel: 0.8,
    timeSinceDetection: 6,
    competitorConfirmation: 0.1,
  },
});

// result.overallEliteScore: 72.5
// result.componentScores: { technical: 65, trend: 75, ... }
// result.evidenceMatrix: [{ component: 'Teknik Analiz', contribution: 6.5, ... }]
// result.riskAdjustment: { adjustedScore: 85, penalties: [...] }
// result.confidenceScore: 0.82
```

## Batch Scoring

```typescript
const results = await orchestrator.calculateBatch([
  { stockSymbol: 'THYAO', stockName: 'Türk Hava Yolları', currentPrice: 280.50 },
  { stockSymbol: 'GARAN', stockName: 'Garanti Bankası', currentPrice: 120.00 },
]);
// results sorted by overallEliteScore descending with rank assignments
```

## Risk Adjustment

The engine applies automatic risk penalties for:
- **High Volatility**: Penalized above configurable threshold (default: 70)
- **Low Liquidity**: Penalized below configurable threshold (default: 30)
- **Timeframe Conflicts**: Penalty per conflict detected
- **Indicator Disagreement**: Penalty proportional to disagreement level
- **Low Reliability**: Penalty for historical reliability below 40

Maximum penalty: 40 points (configurable).

## Evidence Matrix

Each scoring run generates an evidence matrix showing:
- Component name and weight
- Raw and normalized scores
- Contribution to overall score
- Positive and negative impact descriptions
- Confidence level based on score distance from neutral (50)

## Normalization

Three normalization methods available:
- **Sigmoid**: Default, smooth S-curve centered at 50
- **Logistic**: Similar to sigmoid with different steepness
- **Linear**: Direct mapping with clamping

## Configuration

```typescript
const config = getScoringConfig({
  defaultProfile: ScoringProfile.BALANCED,
  normalization: { method: 'sigmoid', center: 50, steepness: 0.1 },
  riskAdjustment: { maxPenalty: 40, volatilityThreshold: 70 },
  earlyOpportunity: { maxBonus: 25, detectionWindowHours: 72 },
});
```

## Integration

The `EliteScoreModule` is registered as a global module in `AppModule` and available for injection throughout the application. All services are independently testable and composable.
