# Enterprise Multi-Timeframe Consensus Engine

Production-ready consensus analysis engine with conflict detection, dominant trend resolution, early alignment detection, and full Turkish explanation generation.

## Architecture

```
multi-timeframe-consensus/
├── types.ts                          # 30+ types, enums, config
├── turkish-terms.ts                  # Turkish translation maps and generators
├── consensus-calculator.service.ts   # Per-timeframe consensus scoring
├── conflict-detector.service.ts      # 7 conflict type detection
├── dominant-trend.service.ts         # Primary/secondary trend resolution
├── early-alignment.service.ts        # Leading timeframe detection
├── explanation-generator.service.ts  # Full Turkish explanation generation
├── consensus-orchestrator.service.ts # Main orchestrator with batch processing
├── multi-timeframe-consensus.module.ts # Global NestJS module
├── index.ts                          # Barrel exports
└── *.spec.ts                         # 72 tests / 7 suites
```

## Timeframes

| Timeframe | Label | Weight (Default) | Description |
|-----------|-------|------------------|-------------|
| H4 | 4 Saat | 0.15 | Short-term momentum |
| D1 | 1 Gün | 0.30 | Primary trading timeframe |
| W1 | 1 Hafta | 0.30 | Medium-term trend |
| MN1 | 1 Ay | 0.25 | Long-term direction |

## Consensus Scoring

Each timeframe is scored across 8 factors:
- **Trend Agreement**: Direction alignment with dominant trend
- **Momentum Agreement**: RSI/MACD/Stochastic consistency
- **Volume Agreement**: Volume profile alignment
- **Risk Agreement**: Risk level consistency
- **Indicator Agreement**: Technical indicator consensus
- **Strategy Agreement**: Strategy signal alignment
- **Support/Resistance**: S/R level proximity
- **Signal Timing**: Entry/exit timing alignment

## Conflict Detection

The engine detects 7 types of conflicts:

| Conflict Type | Severity | Description |
|--------------|----------|-------------|
| SHORT_LONG_CONFLICT | High | Timeframes disagree on direction (short vs long) |
| TREND_REVERSAL | High | Contradictory trend directions across timeframes |
| WEAK_CONFIRMATION | Medium | Insufficient timeframe agreement for signal |
| MIXED_INDICATORS | Medium | Technical indicators give conflicting signals |
| VOLUME_RISK_INCONSISTENCY | Low | Volume doesn't support risk assessment |
| MOMENTUM_DIVERGENCE | Medium | Momentum indicators diverge across timeframes |

## Dominant Trend Resolution

The engine determines the dominant trend by:
1. Calculating weighted scores per timeframe
2. Identifying primary direction (bullish/bearish/neutral)
3. Determining secondary direction if applicable
4. Calculating overall trend strength (0-100)
5. Flagging short/medium/long-term direction separately

## Early Alignment Detection

Detects emerging opportunities by identifying:
- **Leading Timeframe**: Which timeframe is showing the earliest signal
- **Emerging Indicators**: New patterns forming across multiple timeframes
- **False Confirmation Risk**: Probability that the signal is a false positive
- **Detection Timing**: How early the signal is relative to typical confirmation

## Usage

```typescript
import { ConsensusOrchestrator } from './common/multi-timeframe-consensus';

const orchestrator = new ConsensusOrchestrator();

const result = await orchestrator.analyze({
  stockSymbol: 'THYAO',
  stockName: 'Türk Hava Yolları',
  timeframes: {
    H4: { trend: 75, momentum: 65, volume: 60, volatility: 45, indicators: [...] },
    D1: { trend: 80, momentum: 70, volume: 70, volatility: 50, indicators: [...] },
    W1: { trend: 70, momentum: 60, volume: 65, volatility: 55, indicators: [...] },
    MN1: { trend: 65, momentum: 55, volume: 60, volatility: 60, indicators: [...] },
  },
});

// result.consensusSummary: { overallScore: 72.5, dominantDirection: 'bullish', ... }
// result.conflicts: [{ type: 'WEAK_CONFIRMATION', severity: 'medium', ... }]
// result.dominantTrend: { direction: 'bullish', strength: 78, ... }
// result.earlyAlignment: { isAligning: true, leadingTimeframe: 'D1', ... }
// result.explanation: 'Dört zaman dilimi analizinde...'
```

## Batch Analysis

```typescript
const results = await orchestrator.analyzeBatch([
  {
    stockSymbol: 'THYAO',
    stockName: 'Türk Hava Yolları',
    timeframes: { /* ... */ },
  },
  {
    stockSymbol: 'GARAN',
    stockName: 'Garanti Bankası',
    timeframes: { /* ... */ },
  },
]);
// results sorted by consensusSummary.overallScore descending
```

## Evidence Matrix

Each analysis generates an evidence matrix showing:
- Factor name and weight
- Per-timeframe scores
- Contribution to overall consensus
- Positive and negative impact descriptions
- Confidence level

## Turkish Explanations

All explanations are generated in professional Turkish including:
- **Consensus Summary**: Overall agreement level and direction
- **Timeframe Analysis**: Per-timeframe breakdown with scores
- **Conflict Warnings**: Detected conflicts with severity
- **Early Alignment Insights**: Emerging opportunity detection
- **Risk Assessment**: Risk factors and mitigation
- **Action Suggestions**: Recommended actions based on analysis

## Configuration

```typescript
import { getDefaultConsensusConfig } from './common/multi-timeframe-consensus';

const config = getDefaultConsensusConfig({
  timeframeWeights: { H4: 0.15, D1: 0.30, W1: 0.30, MN1: 0.25 },
  consensusThreshold: 60,
  strongConsensusThreshold: 75,
  conflictThreshold: 40,
  earlyAlignment: { sensitivity: 0.7, falseConfirmationThreshold: 0.3 },
});
```

## Integration

The `MultiTimeframeConsensusModule` is registered as a global module in `AppModule` and available for injection throughout the application. All services are independently testable and composable. The engine integrates with the Elite Score Engine for multi-timeframe consensus scoring and with the Explainability Engine for Turkish explanations.
