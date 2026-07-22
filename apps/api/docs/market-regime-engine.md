# Market Regime Engine

> Enterprise-grade market regime detection and classification for Borsa Istanbul.

## Overview

The Market Regime Engine classifies current market conditions across 13 regimes, detects transitions between regimes, provides contextual information for other analysis engines, and generates Turkish-language reports.

## Architecture

```
MarketRegimeModule (@Global)
│
├── MarketRegimeOrchestratorService (Main Facade)
├── RegimeDetectorService (Core Classification)
├── RegimeTransitionService (Transition Detection)
├── RegimeHistoricalService (Historical Analysis)
├── RegimeContextService (Context Provider)
└── RegimeReportGeneratorService (Turkish Reports)
```

## Market Regimes

| Regime | Turkish | Description |
|--------|---------|-------------|
| STRONG_BULL | Guclu Yukselis | Strong uptrend with high momentum and volume |
| BULL | Yukselis | General uptrend |
| WEAK_BULL | Zayif Yukselis | Slight upward bias |
| SIDEWAYS | Yatay Piyasa | No clear direction |
| WEAK_BEAR | Zayif Dusus | Slight downward bias |
| BEAR | Dusus | General downtrend |
| STRONG_BEAR | Guclu Dusus | Strong downtrend with panic selling |
| HIGH_VOLATILITY | Yuksek Volatilite | Large price swings |
| LOW_VOLATILITY | Dusuk Volatilite | Calm market conditions |
| RECOVERY | Toparlanma | Bouncing from lows |
| CORRECTION | Duzeltme | Pullback from highs |
| DISTRIBUTION | Dagitim | Smart money selling |
| ACCUMULATION | Birikim | Smart money buying |

## Usage

### Basic Detection

```typescript
import { MarketRegimeOrchestratorService, RegimeInput, RegimeTimeframe } from './common/market-regime';

const orchestrator: MarketRegimeOrchestratorService;

// Single timeframe detection
const input: RegimeInput = {
  timeframe: RegimeTimeframe.D1,
  trendScore: 0.7,
  momentumScore: 0.6,
  volumeScore: 0.5,
  volatilityScore: 0.4,
  breadthScore: 0.6,
  priceChange: 0.02,
};
const classification = orchestrator.detectRegime(input);
console.log(classification.type); // e.g., BULL

// Multi-timeframe analysis
const multiTF = orchestrator.detectAllTimeframe({
  [RegimeTimeframe.M4]: m4Input,
  [RegimeTimeframe.D1]: d1Input,
  [RegimeTimeframe.W1]: w1Input,
  [RegimeTimeframe.M1]: m1Input,
});
console.log(multiTF.overall); // Dominant regime
console.log(multiTF.hasConflict); // Timeframe disagreement
```

### Context for Other Engines

```typescript
// Get context for Elite Score adjustments
const eliteCtx = orchestrator.getRegimeContext(MarketRegimeType.BULL, 0.8, 10, 0.2);
eliteCtx.recommendedAdjustments.forEach(adj => {
  console.log(`${adj.parameter}: ${adj.currentValue} -> ${adj.recommendedValue}`);
});
```

### Reports

```typescript
const summaryReport = orchestrator.generateReport('summary', multiTimeframeRegime);
const confidenceReport = orchestrator.generateReport('confidence', classification);
const transitionReport = orchestrator.generateReport('transition', transitions);
const historicalReport = orchestrator.generateReport('historical', historicalData);
const riskReport = orchestrator.generateReport('risk', context);
```

## Configuration

Default configuration in `MARKET_REGIME_CONFIG_DEFAULTS`:

```typescript
{
  enabled: true,
  regimeThresholds: {
    strongBull: 0.75,
    bull: 0.5,
    weakBull: 0.25,
    sidewaysUpper: 0.25,
    sidewaysLower: -0.25,
    weakBear: -0.25,
    bear: -0.5,
    strongBear: -0.75,
    highVolatility: 0.7,
    lowVolatility: 0.3,
  },
  weights: {
    trend: 0.35,
    momentum: 0.25,
    volume: 0.15,
    volatility: 0.15,
    breadth: 0.10,
  },
}
```

## Integration with Other Engines

| Engine | How Regime Context is Used |
|--------|--------------------------|
| Elite Score Engine | Adjust scoring weights based on regime |
| Explainability Engine | Enhance explanations with regime context |
| Consensus Engine | Adjust timeframe agreement thresholds |
| Recommendation Tracker | Track per-regime performance |
| Paper Portfolio | Adjust position sizing and cash allocation |
| Notification Engine | Set notification priority based on regime |

## Test Coverage

- 9 test suites, 127 tests
- All tests passing (0 failures)
