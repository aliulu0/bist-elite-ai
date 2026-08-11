# R2-009B Real Data Integration

## Architecture

The AI Scoring Engine now integrates all production services for real data scoring. The architecture follows the strict rule of a single scoring engine (`ScoreEngine`) used by all strategies, with strategies only defining weight profiles.

## Data Flow

```
Raw Data Sources
  ↓
┌─────────────────────────────────────────────────────────┐
│  ScoreEngine.score(input)                               │
│  ├─ ScoreRegistry.getWeightProfile(strategyId)          │
│  ├─ ScorePipeline.run(pipelineInput, weights)           │
│  │   ├─ ScoreCalculator.calculateAll(input)             │
│  │   │   ├─ calculateTechnical(input)    ← Indicators  │
│  │   │   ├─ calculateFundamental(input) ← Aggregation  │
│  │   │   ├─ calculateVerification(input) ← Verification │
│  │   │   ├─ calculateCatalyst(input)     ← Catalyst    │
│  │   │   ├─ calculateLiquidity(input)    ← MarketData  │
│  │   │   ├─ calculateRisk(input)         ← Financials  │
│  │   │   ├─ calculateVolume(input)       ← MarketData  │
│  │   │   ├─ calculateMomentum(input)     ← Indicators  │
│  │   │   ├─ calculateTrend(input)       ← Indicators  │
│  │   │   └─ calculateQuality(input)      ← Aggregation │
│  │   └─ computeAIResult(scores, weights, input)        │
│  │       ├─ Weighted Score (AI Score)                  │
│  │       └─ Dynamic AI Confidence                      │
│  └─ return ScoreEngineOutput                           │
└─────────────────────────────────────────────────────────┘
```

## Score Mapping

### Technical Score → IndicatorsModule
- Uses `IndicatorEngine` (RSI, MACD, SMA, EMA, Bollinger, ADX, ATR, OBV, MFI, ROC, CCI, Williams %R, Stochastic, Ichimoku, etc.)
- Primary: SMA20/SMA50 deviation, RSI, MACD crossover, Bollinger position
- Fallback: Historical price SMA calculation

### Fundamental Score → AggregationModule
- Uses `AggregationEngine.aggregateFinancials(symbol)`
- Uses `AggregationEngine.aggregateBalanceSheet(symbol)`
- Uses `AggregationEngine.aggregateIncomeStatement(symbol)`
- Fields: P/E, P/B, Debt/Equity, Revenue Growth, Net Margin, ROE, EBITDA, Free Cash Flow, Revenue

### Verification Score → ResearchModule
- Uses `VerificationEngine.verify(evidence)`
- Uses `ResearchRepository` for evidence retrieval
- Fields: sourceCount, verifiedCount, likelyCount, confidence

### Catalyst Score → ResearchModule
- Uses `CatalystDetectionService.verify(verificationResult)`
- 23 catalyst patterns (new investment, government tender, export contract, etc.)
- Fields: count, bullishCount, bearishCount, neutralCount, strongestType, strongestDirection

### Liquidity Score → MarketDataModule
- Uses `MarketDataOrchestrator` for company data (marketCap)
- Uses `MarketDataService.fetchLatest()` for volume
- Uses `MarketDataCacheService` for caching

### Risk Score → AggregationModule + IndicatorsModule
- Uses financials (Debt/Equity, P/E) from AggregationEngine
- Uses ATR indicator from IndicatorEngine for volatility
- Uses historical price returns for standard deviation

### Volume Score → MarketDataModule + IndicatorsModule
- Uses `MarketDataService.fetchLatest()` for current volume
- Uses `IndicatorEngine` OBV (On-Balance Volume) for volume trend
- Uses historical price volume for average comparison

### Momentum Score → IndicatorsModule
- Uses `IndicatorEngine` ROC (Rate of Change)
- Uses `IndicatorEngine` MACD (Moving Average Convergence Divergence)
- Fallback: Historical price change calculation

### Trend Score → IndicatorsModule
- Uses `IndicatorEngine` SMA, EMA, Ichimoku
- Uses ADX from IndicatorEngine for trend strength
- Fallback: Historical price SMA comparison

### Quality Score → AggregationModule
- Uses `AggregationEngine.aggregateFinancials(symbol)`
- Fields: ROE, Net Margin, Revenue Growth, P/B, Dividend Yield, EBITDA, Free Cash Flow

## Provider Usage (Zero Duplication)

| Provider | Used By | Cache |
|----------|---------|-------|
| YahooFinanceProvider | Price, Volume, Company data | MarketDataCacheService |
| FintablesUnifiedAdapter | Company profile, Financials | MarketDataCacheService |
| FinnhubAdapter | Company data | MarketDataCacheService |
| SerpApiAdapter | News/catalyst evidence | MarketDataCacheService |
| KAPAdapter | Sector, company data | MarketDataCacheService |
| TCMBAdapter | Interest rates | MarketDataCacheService |
| HistoricalDataPipeline | OHLCV historical data | MarketDataCacheService |
| AggregationEngine | Financial statements | MarketDataCacheService |
| VerificationEngine | Evidence verification | ResearchRepository |
| CatalystDetectionService | Catalyst detection | ResearchRepository |
| IndicatorEngine | Technical indicators | In-memory (no duplicate calc) |

## AI Confidence Formula (Dynamic)

```
AI Confidence = dataCompleteness × providerCoverage × verificationConfidence × catalystConfidence × freshnessFactor × (1 - conflictPenalty)
```

### Components

1. **Data Completeness** = `availableDimensions / 10`
   - How many of the 10 score dimensions have non-null values

2. **Provider Coverage** = `activeProviders / 8`
   - Based on `ProviderCoverage` object (yahoo, fintables, finnhub, serpApi, kap, tcmb, mkk, alphaVantage)
   - Defaults to 0.8 if not provided

3. **Verification Confidence** = `verificationData.confidence` or 0.7
   - From VerificationEngine's confidence score

4. **Catalyst Confidence** = `0.5 + catalystCount × 0.1` (capped at 1.0)
   - Higher when more catalysts found

5. **Freshness Factor** (based on `freshnessMs`):
   - < 1 hour: 1.0
   - < 24 hours: 0.95
   - < 7 days: 0.85
   - < 30 days: 0.7
   - > 30 days: 0.5

6. **Conflict Penalty** = `nullDimensionRatio × 0.3`
   - Penalty for missing dimensions (up to 30%)

### Example
- 8/10 dimensions available → 0.8
- 6/8 providers active → 0.75
- Verification confidence 0.85 → 0.85
- 3 catalysts → 0.8
- Data < 1 hour → 1.0
- 2 null dimensions → penalty 0.06
- **Confidence = 0.8 × 0.75 × 0.85 × 0.8 × 1.0 × (1 - 0.06) = 0.387 → 39**

## Cache Strategy

- `MarketDataCacheService` handles all provider caching (company, financials, latest price)
- `MarketDataOrchestrator.executeWithFallback()` uses cache internally
- `HistoricalDataPipeline` caches processed OHLCV datasets
- `IndicatorEngine` does NOT duplicate calculations — each indicator is computed once per data input
- `ResearchRepository` caches verification evidence and catalyst data
- No duplicate provider requests within a single scoring run

## Historical Timeframes

The system supports all provider-supported timeframes:
- `4h`, `1d`, `1w`, `1m`, `3m`, `6m` (SUPPORTED_TIMEFRAMES)
- `1y`, `5y`, `max` (provider-supported, auto-detected)

The `HistoricalDataPipeline` processes any timeframe without hardcoding.

## Performance

- 643 active symbols processed asynchronously via `ScoreEngine.scoreBatch()`
- `Promise.all()` for parallel scoring
- Cache reuse prevents duplicate provider requests
- Indicator calculations are computed once per symbol per timeframe

## Turkish UI Labels

| English | Turkish |
|---------|---------|
| Technical Score | Teknik Puan |
| Fundamental Score | Temel Puan |
| Verification Score | Doğrulama Puanı |
| Catalyst Score | Katalizör Puanı |
| Liquidity Score | Likidite Puanı |
| Risk Score | Risk Puanı |
| Volume Score | Hacim Puanı |
| Momentum Score | Momentum Puanı |
| Trend Score | Trend Puanı |
| Quality Score | Kalite Puanı |
| AI Score | Yapay Zeka Puanı |
| AI Confidence | Yapay Zeka Güveni |
| Weighted Score | Ağırlıklı Skor |
| Provider Coverage | Sağlayıcı Kapsamı |
| Freshness | Taze Veri |
| Data Completeness | Veri Tamamlığı |
| Conflict Penalty | Çelişki Cezası |

## Known Issues

- Historical price data requires HistoricalDataModule to be properly configured with provider APIs
- Financial statement data requires AggregationModule to have active providers (Fintables, Yahoo, etc.)
- Verification and Catalyst data require ResearchModule to be connected to SerpAPI/AgentReach
- AI Confidence defaults to conservative values when provider coverage/freshness data is unavailable
- Some BIST instruments may have limited provider coverage (especially small-cap stocks)

## Next Recommended Sprint

R2-010 — Scanner Integration:
1. Connect ScoreEngine to ScannerService for real-time scoring during scans
2. Add scoring to `/scanner/:strategy` endpoint response
3. Add `/scoring/score/:ticker` endpoint for single-stock scoring
4. Add `/scoring/batch` endpoint for bulk scoring of all 643 active symbols
5. Add scoring to ScannerResult DTO