# Explainability Engine

## Overview

The Explainability Engine transforms technical, financial, and scoring outputs into clear, professional Turkish explanations for Borsa İstanbul investors. Every score, signal, and recommendation is backed by evidence and includes positive/negative factor analysis.

## Architecture

```
ExplainabilityService (orchestrator)
├── ConfidenceCalculator    — multi-factor confidence scoring
├── RiskAnalyzer            — 7-type risk analysis
├── MultiTimeframeAnalyzer  — 4-timeframe agreement/conflict
└── MarketInterpreter       — Turkish explanation generation
```

## Configuration

All settings are configurable via `getExplainabilityConfig()`:

```typescript
{
  enabled: true,
  defaultTimeframes: [Timeframe.M4, Timeframe.D1, Timeframe.W1, Timeframe.M1],
  indicatorWeights: {
    RSI: 0.15, MACD: 0.15, EMA: 0.12, SMA: 0.10,
    BollingerBands: 0.10, ATR: 0.08, ADX: 0.10,
    VWAP: 0.08, Stochastic: 0.07, Ichimoku: 0.05,
  },
  riskWeights: { trend_risk: 0.20, volatility_risk: 0.18, ... },
  confidenceThresholds: { high: 0.75, medium: 0.50, low: 0.25 },
  maxEvidenceItems: 20,
  enableCaching: true,
  cacheTtlMs: 300_000,
}
```

## Usage

### Generate Full Explanation

```typescript
const explanation = explainabilityService.generateExplanation({
  stockSymbol: 'THYAO',
  stockName: 'Türk Hava Yolları',
  currentPrice: 285.50,
  technicalScore: { momentum: 72, trend: 68, volatility: 45, volume: 55, composite: 65 },
  financialScore: { growth: 60, profitability: 70, composite: 64 },
  eliteScore: { technical: 65, financial: 64, confidence: 0.72, composite: 68, rank: 15 },
  confidenceScore: { dataQuality: 0.85, modelConsistency: 0.78, regimeStability: 0.65, composite: 0.72 },
  indicators: [...],
  decisionSignal: { action: 'BUY', strength: 'STRONG', entryPrice: 285, targetPrice: 320, stopLossPrice: 270 },
  timeframeData: { M4: { trend: 'uptrend' }, D1: { trend: 'uptrend' }, ... },
});
```

### Generate Text Summary

```typescript
const summary = explainabilityService.generateExplanationSummary(input);
// Returns full Turkish text with sections: Technical Analysis, Trend, Momentum, Volume, Risk, etc.
```

### Get Specific Factors

```typescript
const positives = explainabilityService.getPositiveFactorsSummary(input);
const negatives = explainabilityService.getNegativeFactorsSummary(input);
const risks = explainabilityService.getRiskSummary(input);
```

## Explanation Structure

Every `ExplanationOutput` contains:

| Field | Description |
|-------|-------------|
| `generalSummary` | Overall stock status in Turkish |
| `technicalAnalysis` | Technical indicator summary |
| `trendAnalysis` | Trend direction, strength, supporting indicators |
| `momentumAnalysis` | RSI/MACD based momentum state |
| `volumeAnalysis` | Volume interpretation |
| `supportResistance` | Key price levels |
| `riskAnalysis` | 7 risk factors with severity |
| `positiveFactors` | Strengths with evidence |
| `negativeFactors` | Weaknesses with evidence |
| `eliteScoreExplanation` | Composite score breakdown |
| `confidenceExplanation` | 5-factor confidence analysis |
| `multiTimeframeSummary` | 4H/1D/1W/1M agreement analysis |
| `suggestedObservation` | Actionable observation |
| `finalEvaluation` | Final assessment |
| `disclaimer` | Legal disclaimer |
| `evidenceTrail` | All supporting indicator evidence |

## Multi-Timeframe Analysis

Analyzes agreement across 4 timeframes:
- **4 Saatlik** (4 Hours) — short-term view
- **Günlük** (Daily) — medium-term view
- **Haftalık** (Weekly) — medium-long term view
- **Aylık** (Monthly) — long-term view

Detects conflicts between timeframes and determines the dominant trend with weighted scoring.

## Confidence Calculation

5-factor weighted confidence:
- Indicator Agreement (30%)
- Strategy Agreement (25%)
- Historical Similarity (20%)
- Signal Quality (15%)
- Market Conditions (10%)

## Risk Analysis

7 risk types analyzed:
1. **Trend Risk** — reversal potential
2. **Volatility Risk** — price fluctuation level
3. **Liquidity Risk** — trading volume adequacy
4. **False Breakout Risk** — fake breakout potential
5. **False Signal Risk** — indicator disagreement
6. **Timeframe Conflict** — cross-timeframe disagreement
7. **Market Uncertainty** — external factor impact

## Turkish Language

All explanations are generated in professional Turkish using financial terminology familiar to Borsa İstanbul investors. Technical indicator names (RSI, MACD, EMA, etc.) are preserved in their international form. Only market interpretation is translated.

## Files

| File | Purpose |
|------|---------|
| `types.ts` | All types, enums, config |
| `turkish-terms.ts` | Turkish translations and descriptions |
| `confidence.service.ts` | Confidence calculation |
| `risk.service.ts` | Risk analysis |
| `multi-timeframe.service.ts` | Multi-timeframe analysis |
| `market-interpreter.service.ts` | Turkish explanation generation |
| `explainability.service.ts` | Main orchestrator |
| `explainability.module.ts` | NestJS module |
| `index.ts` | Barrel exports |
| `__tests__/*.spec.ts` | 135 unit tests |
