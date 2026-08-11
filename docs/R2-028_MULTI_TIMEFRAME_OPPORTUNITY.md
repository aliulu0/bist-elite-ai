# R2-028 — Multi-Timeframe Opportunity Intelligence

## Overview

The Multi-Timeframe Opportunity Intelligence module provides a unified opportunity score by analyzing prediction results across all timeframes (1h, 2h, 4h, 1d, 1w, 1M, 3M, 6M). This engine determines whether a stock is becoming an **EARLY OPPORTUNITY** by combining signals from multiple timeframes into a single coherent assessment.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MultiTimeframeOpportunityEngine                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: MultiTimeframeOpportunityInput                                      │
│  - ticker, company, sector, marketCap                                       │
│  - predictions: PredictionResult[] (all timeframes)                         │
│  - consensus, eliteScore, opportunity, decision                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  CALCULATIONS (reusing existing engines only):                              │
│  1. Timeframe Agreement — weighted consensus across all timeframes         │
│  2. Trend Alignment — bullish/bearish/sideways consistency                 │
│  3. Momentum Alignment — momentum direction agreement                      │
│  4. Risk Alignment — risk level consistency                                │
│  5. Confidence Alignment — confidence score agreement                      │
│  6. Smart Money Alignment — accumulation pattern across timeframes         │
│  7. Catalyst Alignment — catalyst score consistency                        │
│  8. Macro Alignment — macro regime consistency                             │
│  9. Market Structure Alignment — support/resistance/breakout alignment     │
├─────────────────────────────────────────────────────────────────────────────┤
│  OUTPUT: MultiTimeframeOpportunityResult                                    │
│  - multiTimeframeScore: 0-100                                              │
│  - strength: Weak | Medium | Strong | Very Strong                          │
│  - trendStage: Early | Growing | Breakout | Extended | Late                │
│  - holdingType: Intraday | Swing | Position | Investment                   │
│  - bestTimeframe, worstTimeframe                                           │
│  - mostBullishTimeframe, highestConfidenceTimeframe                        │
│  - riskSummary, expectedReturn                                             │
│  - entryZone, stop, target1, target2                                       │
│  - reasons: string[]                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Files Created

```
apps/api/src/modules/ai-early-opportunity/multi-timeframe/
├── multi-timeframe.types.ts        # Input/Output interfaces
├── multi-timeframe.engine.ts       # Core calculation engine
├── multi-timeframe.service.ts      # Service layer
├── multi-timeframe.controller.ts   # REST endpoints
├── multi-timeframe.module.ts       # NestJS module
├── multi-timeframe.dto.ts          # API DTO
└── index.ts                        # Barrel export
```

## Reused Engines

| Engine | Reused For |
|--------|------------|
| Prediction Engine | All timeframe predictions |
| Early Opportunity Engine | Base opportunity scoring |
| Smart Money Engine | Smart money alignment |
| Catalyst Engine | Catalyst alignment |
| Verification AI | Verification status |
| Research Hub | Consensus alignment |
| Market Structure | Support/resistance alignment |
| Entry Engine | Entry/exit zones |
| Backtest Engine | Historical validation |
| Elite Score | Strategy scoring |
| Opportunity Engine | Opportunity detection |
| Decision Engine | Decision alignment |
| Market Data | Price/volume data |
| Historical Data | Historical context |
| Indicator Engine | Technical indicators |

**No duplicated calculations** — all calculations delegate to existing engines.

## API Endpoints

### GET `/multi-timeframe/:ticker`
Returns the multi-timeframe opportunity analysis for a single ticker.

**Response:**
```json
{
  "ticker": "THYAO",
  "company": "Türk Hava Yolları",
  "sector": "Ulaştırma",
  "marketCap": 185000000000,
  "multiTimeframeScore": 94,
  "strength": "Very Strong",
  "trendStage": "Early",
  "holdingType": "Intraday",
  "bestTimeframe": "1h",
  "worstTimeframe": "6m",
  "mostBullishTimeframe": "1h",
  "highestConfidenceTimeframe": "1d",
  "riskRewardRatio": 2.4,
  "reasons": ["Yüksek yaşıl olasılık (multi-timeframe)", "..."],
  "riskSummary": "Düşük risk - çok-zamanlı uyum",
  "expectedReturn": 6.4
}
```

### GET `/multi-timeframe/:ticker/explain`
Returns a deterministic Turkish explanation of why this ticker was selected.

**Response:**
```json
{
  "ticker": "THYAO",
  "explanation": "THYAO: Çok-zamanlı skor 94 (Very Strong). 1h, 2h, 4h, 1d timeframe'leri alignment gösteriyor. Trend: Early, Beklenen getiri: 6.4%. Giriş: 12.4-12.8, Stop: 11.9."
}
```

## Integration

The Early Opportunity Intelligence Engine (`early-opportunity.intelligence-engine.ts`) consumes the MTF module:

```typescript
// In getEarlyOpportunity()
const multiTimeframe = await this.multiTimeframeService.analyze(ticker);
return this.intelligenceEngine.buildIntelligenceResult(
  detailed.input,
  detailed.result,
  marketCap,
  multiTimeframe  // NEW: MTF data enriches intelligence result
);
```

The `EarlyOpportunityIntelligenceResult` type now includes:
```typescript
multiTimeframe: MultiTimeframeOpportunityResult | null;
```

## Deterministic Turkish Explanations

All explanations are fully deterministic — no GPT, no randomness. The engine constructs narratives using template strings with calculated values.

Example output:
> "THYAO: Çok-zamanlı skor 94 (Very Strong). 1h, 2h, 4h, 1d timeframe'leri alignment gösteriyor. Trend: Early, Beklenen getiri: 6.4%. Giriş: 12.4-12.8, Stop: 11.9."

## Test Results

- **All 68 early-opportunity tests pass**
- **Full TypeScript typecheck: clean**
- **Full test suite: green**

## Known Issues

None.

## Next Sprint

- R2-029: Production deployment & monitoring
- Frontend integration for MTF dashboard
- Real-time data pipeline for MTF inputs