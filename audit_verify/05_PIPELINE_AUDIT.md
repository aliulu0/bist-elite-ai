# BIST ELITE AI — END-TO-END PIPELINE AUDIT

**Audit Date:** 2026-08-08  
**Auditor:** Principal AI Developer (R2-FINAL-AUDIT)

---

## PIPELINE OVERVIEW

```
PROVIDERS → MARKET DATA ORCHESTRATOR → HISTORICAL DATA → INDICATORS
                                                        ↓
                                              MARKET STRUCTURE
                                                        ↓
                    ┌─────────────────┬────────────────┴────────────────┬─────────────────┐
                    ↓                 ↓                                 ↓                 ↓
              PREDICTION          SMART MONEY                       CATALYST        VERIFICATION AI
                    ↓                 ↓                                 ↓                 ↓
              BACKTEST          ENTRY ZONE                         RESEARCH HUB    (calibration)
                    ↓                 ↓                                 ↓                 ↓
              PREDICTION SCORE ←─────────────────────────────────────────────────────┘
                    ↓
           EARLY OPPORTUNITY ENGINE (scans ALL BIST)
                    ↓
         EARLY OPPORTUNITY INTELLIGENCE (enriches)
                    ↓
              SELF-LEARNING (modifiers)
                    ↓
              DASHBOARD / API / PORTFOLIO
```

---

## STAGE-BY-STAGE TRACE

### STAGE 1: DATA PROVIDERS → MARKET DATA ORCHESTRATOR

**Entry Point:** Any engine calls `MarketDataOrchestrator.fetchCompany()`, `fetchHistoricalData()`, etc.

**Flow:**
```
1. Client calls Orchestrator method
2. Orchestrator checks CacheService (namespace: market-data)
3. If cache miss → executeWithFallback()
4. Iterate providers by priority (1→8):
   a. Skip if disabled
   b. Skip if circuit breaker OPEN
   c. Call provider adapter method
   d. On success → cache result → return
   e. On failure → log → try next provider
5. If all fail → return null
```

**Break Points:**
- **PROVIDER API KEYS MISSING** — Steps 4c fails for 7/8 providers
- **Only Yahoo Finance works** — No API key required
- **Circuit Breaker** — Tracks failures, opens after threshold

**Evidence:** `apps/api/src/modules/market-data/orchestrator/market-data-orchestrator.ts:100-180`

---

### STAGE 2: HISTORICAL DATA → INDICATORS

**Entry Point:** `PredictionService.refreshPrediction()` calls `marketDataService.fetchData()` → `HistoricalDataService` → Prisma `HistoricalPrice` table

**Flow:**
```
1. HistoricalDataService.fetch(symbol, timeframe, limit)
2. Query Prisma: HistoricalPrice where stockId, timeframe, date range
3. Return MarketDataPoint[] (OHLCV)
4. PredictionService.toOHLCV() converts to internal format
5. IndicatorEngine.calculateAll(ohlcv, timeframe)
6. Returns IndicatorResult[] (20+ indicators)
```

**Break Points:**
- **Prisma Query** — Requires populated `HistoricalPrice` table
- **No Data** — If table empty, indicators return empty → prediction returns empty
- **Timeframe Mapping** — `toIndicatorTimeframe()` maps prediction timeframes to indicator timeframes

**Evidence:** `apps/api/src/modules/prediction/prediction.service.ts:150-200`, `apps/api/src/modules/indicators/indicator-engine.service.ts`

---

### STAGE 3: INDICATORS → MARKET STRUCTURE

**Entry Point:** `PredictionService.refreshPrediction()` calls `marketStructureEngine.analyze(ohlcv, timeframe)`

**Flow:**
```
1. MarketStructureEngine.analyze(ohlcv, timeframe)
2. Detects: Support/Resistance, Trends, Patterns, Volume zones
3. Returns MarketStructureResult
4. Used by: PredictionEngine, EntryZoneEngine
```

**Break Points:**
- **No explicit cache** — Recalculates every call
- **Depends on indicator quality** — Garbage in, garbage out

**Evidence:** `apps/api/src/modules/market-structure/market-structure.engine.ts`

---

### STAGE 4: PARALLEL ENGINE CALLS (PredictionService.refreshPrediction)

**Critical Section:** Lines 180-220 in `prediction.service.ts`

```typescript
const [smartMoney, catalyst, verification] = await Promise.all([
  this.smartMoneyService.getSmartMoney(normalized, dataTimeframe).catch(() => null),
  this.catalystService.getCatalyst(normalized).catch(() => null),
  this.verificationAI.getVerification(normalized).catch(() => null),
]);
```

**Each Sub-Flow:**

#### 4a. SMART MONEY
```
SmartMoneyService.getSmartMoney(symbol, timeframe)
  → SmartMoneyEngine.analyze(symbol, timeframe)
  → Uses: Volume profile, OBV, institutional patterns
  → Returns SmartMoneyResult (score, accumulation, distribution)
```

#### 4b. CATALYST
```
CatalystService.getCatalyst(symbol)
  → CatalystEngine.analyze(symbol)
  → Uses: News providers (SerpAPI, Google News), KAP disclosures
  → Returns CatalystResult (score, events, sentiment)
  → **BLOCKED without SerpAPI/KAP keys**
```

#### 4c. VERIFICATION AI
```
VerificationAIService.getVerification(symbol)
  → VerificationRuleEngine.evaluate(symbol)
  → Rules: Financial health, KAP disclosures, news sentiment, insider transactions
  → Returns VerificationResult (TRUE/FALSE/UNVERIFIED, score)
  → **PARTIALLY BLOCKED without KAP/News keys**
```

---

### STAGE 5: BACKTEST CALIBRATION

**Entry Point:** `PredictionService.runCalibrationBacktest()`

**Flow:**
```
1. CoreBacktestEngine.run(symbol, strategy, ohlcv, timeframe)
2. Simulates trades on historical data
3. Returns BacktestResult (winRate, Sharpe, drawdown, trades)
4. Used by: PredictionScoreEngine (calibration), SelfLearningService (win rate)
```

**Break Points:**
- **Strategy Selection** — `buildStrategy()` from config
- **Look-ahead Bias** — Must verify no future data leakage
- **Data Quality** — Depends on historical data completeness

**Evidence:** `apps/api/src/modules/backtest/backtest.engine.ts`, `apps/api/src/modules/prediction/prediction.service.ts:250-300`

---

### STAGE 6: ENTRY ZONE

**Entry Point:** `PredictionService.refreshPrediction()` calls `entryZoneEngine.evaluate()`

**Flow:**
```
1. EntryZoneEngine.evaluate(context)
2. Context: price, indicators, structure, smartMoney
3. Calculates: Entry zone (min/max), Stop, Target1/2, Risk/Reward, Holding Period
4. Returns EntryZoneResult
```

**Evidence:** `apps/api/src/modules/entry/entry-zone.engine.ts`

---

### STAGE 7: PREDICTION ENGINE (Core)

**Entry Point:** `PredictionEngine.evaluate(features)`

**Flow:**
```
1. Features: indicators, structure, smartMoney, catalyst, verification, backtest, entryZone
2. Ensemble of models (technical, fundamental, sentiment, macro)
3. Timeframe-specific models (1h, 2h, 4h, 1d, 1w, 1m, 3m, 6m)
4. Outputs: Bullish%, Bearish%, Confidence, Expected Return, Risk, Trend, Momentum, Scenarios
```

**Evidence:** `apps/api/src/modules/prediction/prediction.engine.ts`

---

### STAGE 8: PREDICTION SCORE ENGINE

**Entry Point:** `PredictionScoreEngine.calculateScore(prediction, backtest)`

**Flow:**
```
1. Takes raw prediction + backtest calibration
2. Applies confidence adjustments
3. Returns calibrated PredictionResult
5. Stored in PredictionRegistry + Cache
```

**Evidence:** `apps/api/src/modules/prediction/prediction-score.engine.ts`

---

### STAGE 9: EARLY OPPORTUNITY ENGINE (Scan All BIST)

**Entry Point:** `EarlyOpportunityService.scanAll()` → `scanAllDetailed()` → `buildAndScore()`

**Flow:**
```
1. SymbolRegistry.getActiveSymbols() → ALL BIST symbols
2. For each symbol (concurrency 12):
   a. collectPredictions() → PredictionService.getPrediction() for 8 timeframes
   b. AIResearchHub.getConsensus() → Research consensus
   c. EliteScoreRegistry.get() → Elite score
   d. OpportunityRegistry.get() → Opportunity score
   e. DecisionRegistry.get() → Decision score
   f. Engine.evaluate(input) → EarlyOpportunityResult (score 0-100)
3. Sort by score, return TOP 10
```

**Break Points:**
- **Symbol Registry** — Must have ALL BIST symbols loaded
- **Prediction Cache** — Cold start scans all symbols, triggers prediction for each
- **Concurrency** — 12 parallel, may hit rate limits

**Evidence:** `apps/api/src/modules/ai-early-opportunity/early-opportunity.service.ts:100-200`

---

### STAGE 10: EARLY OPPORTUNITY INTELLIGENCE (Enrichment)

**Entry Point:** `EarlyOpportunityIntelligenceService.getEarlyOpportunity(ticker)`

**Flow:**
```
1. EarlyOpportunityService.scanTickerDetailed(ticker) → gets base result
2. MarketDataOrchestrator.fetchCompany(ticker) → market cap
3. MultiTimeframeService.analyze(ticker) → MTF analysis (9 alignments)
4. IntelligenceEngine.buildIntelligenceResult() → FULL BUNDLE:
   - Early Opportunity Score
   - Elite Score
   - Multi-Timeframe (score, strength, trendStage, holdingType)
   - Smart Money
   - Catalyst
   - Verification
   - Research Consensus
   - Entry Zone, Stop, Targets
   - Expected Return, Holding Period
   - Turkish Explanation
```

**Evidence:** `apps/api/src/modules/ai-early-opportunity/early-opportunity.intelligence.service.ts`, `early-opportunity.intelligence-engine.ts`

---

### STAGE 11: SELF-LEARNING

**Entry Point:** `SelfLearningService.runLearningCycle()` (nightly + on scan)

**Flow:**
```
1. For each ticker with cached prediction:
   a. BacktestService.getReport(ticker, '1d', 'indicator') → winRate
   b. Compare predicted vs actual (from market data)
   c. Calculate modifier (0.85-1.15) based on accuracy
   d. Store in SelfLearningRegistry
2. Modifiers applied in EarlyOpportunityIntelligenceEngine.rankByAdjusted()
```

**Break Points:**
- **NO DB PERSISTENCE** — Modifiers lost on restart
- **Win Rate Source** — BacktestService.getReport() uses 'indicator' strategy
- **Accuracy Calculation** — Simplified; may not capture directional accuracy

**Evidence:** `apps/api/src/modules/ai-early-opportunity/self-learning/self-learning.service.ts`

---

### STAGE 12: DASHBOARD CONSUMPTION

**Dashboard Sections → API Calls:**

| Section | API Calls | Data Source |
|---------|-----------|-------------|
| Top 10 Early Opportunities | `GET /early-opportunities` | EarlyOpportunityService.scanAll() |
| Market Overview | `GET /market/overview` | MarketOverviewController |
| AI Filter Panel | `GET /early-opportunities?filters` | EarlyOpportunityService.scanAll(filters) |
| Watchlist | `GET /watchlist` | WatchlistController |
| Quick Search | `GET /search/:ticker` | SearchController |
| Timeframe Panel | `GET /multi-timeframe/:ticker` | MultiTimeframeController |
| Top Lists | `GET /top-lists` | TopListsController |
| Dashboard Performance | `GET /dashboard/performance` | DashboardPerformanceController |

**All consume real engine outputs** — No mock data in production code.

---

### STAGE 13: PORTFOLIO INTELLIGENCE (R2-030)

**Entry Point:** `PortfolioIntelligenceService.getAnalysis()`

**Flow:**
```
1. Registry.getAllPositions() → stored positions
2. For each position (enrichPositions):
   a. EarlyOpportunityIntelligenceService.getEarlyOpportunity(ticker) → FULL BUNDLE
   b. MarketDataOrchestrator.fetchLatestPrice(ticker) → authoritative close
   c. SymbolRegistry.getSymbol(ticker) → sector, company name
3. Engine.analyzePortfolio(enriched) → Unified analysis
4. Cache result (30s TTL)
```

**Key:** Reuses EarlyOpportunityIntelligence (which bundles MTF) — **NO DUPLICATE MTF CALL**

**Evidence:** `apps/api/src/modules/portfolio-intelligence/portfolio-intelligence.service.ts:145-180`

---

## PIPELINE BREAKAGE MAP

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PROVIDERS (7/8 BLOCKED)                 │
│  Fintables, Finnhub, Alpha Vantage, KAP, TCMB, MKK, SerpAPI    │
│                           ↓ FAIL                                 │
│  Yahoo Finance (only working provider)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              MARKET DATA ORCHESTRATOR                           │
│  Cache → Fallback chain → Only Yahoo succeeds                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              HISTORICAL DATA → INDICATORS                       │
│  Prisma HistoricalPrice → 20+ Indicators → OK                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              MARKET STRUCTURE                                   │
│  Support/Resistance, Trends → OK                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PARALLEL ENGINES (Smart Money, Catalyst, Verification)        │
│                                                                 │
│  Smart Money: Volume/OBV patterns → OK (derived)                │
│  Catalyst: News/KAP → BLOCKED (no SerpAPI/KAP keys)             │
│  Verification: Rules/KAP/News → PARTIAL (no KAP/News keys)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  BACKTEST CALIBRATION                                           │
│  Historical simulation → OK (if data exists)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  ENTRY ZONE → PREDICTION ENGINE                                 │
│  Entry/Stop/Targets → Ensemble model → OK                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  EARLY OPPORTUNITY SCAN (ALL BIST)                             │
│  12 concurrent → Predictions for each → OK                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  EARLY OPPORTUNITY INTELLIGENCE                                │
│  Enrichment (MTF, Market Cap, Explanation) → OK                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  SELF-LEARNING                                                  │
│  Win rate from backtest → Modifiers (IN-MEMORY ONLY)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  DASHBOARD / PORTFOLIO INTELLIGENCE                            │
│  Consume real engine outputs → OK                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## WHERE THE CHAIN BREAKS

| Break Point | Severity | Impact |
|-------------|----------|--------|
| **7/8 Providers missing API keys** | **P0 — BLOCKER** | No fundamentals, no KAP disclosures, no macro, no news, no ownership data |
| **Self-Learning no DB persistence** | **P1 — CRITICAL** | Modifiers lost on restart; learning resets |
| **Catalyst/Verification limited** | **P1 — CRITICAL** | Catalyst scores default/empty; Verification rules can't check KAP |
| **Research Hub limited** | **P1 — CRITICAL** | No news/search without SerpAPI |
| **Historical Data completeness unknown** | **P2 — IMPORTANT** | If Prisma tables empty, entire pipeline fails |
| **No rate limiting on Alpha Vantage** | **P2 — IMPORTANT** | Will hit 5/min limit in production |

---

## EVIDENCE

- `apps/api/src/modules/market-data/orchestrator/market-data-orchestrator.ts`
- `apps/api/src/modules/prediction/prediction.service.ts`
- `apps/api/src/modules/ai-early-opportunity/early-opportunity.service.ts`
- `apps/api/src/modules/ai-early-opportunity/early-opportunity.intelligence.service.ts`
- `apps/api/src/modules/ai-early-opportunity/self-learning/self-learning.service.ts`
- `apps/api/src/modules/portfolio-intelligence/portfolio-intelligence.service.ts`
- Dashboard hooks: `apps/web/src/hooks/use-dashboard.ts`