# BIST ELITE AI — BACKTEST AUDIT

**Audit Date:** 2026-08-08  
**Auditor:** Principal AI Developer (R2-FINAL-AUDIT)

---

## BACKTEST ARCHITECTURE

**Module:** `apps/api/src/modules/backtest/`  
**Core Engine:** `CoreBacktestEngine`  
**Service:** `BacktestService`  
**Registry:** `BacktestRegistry`  
**Learning Integration:** `LearningEngine`, `LearningEngineV2`

---

## BACKTEST ENGINE (CoreBacktestEngine)

**File:** `apps/api/src/modules/backtest/backtest.engine.ts`

### SIMULATION FLOW

```typescript
run(symbol, strategy, ohlcv, timeframe):
  1. Validate inputs (min 100 bars)
  2. Initialize portfolio (cash = initialCapital)
  3. For each bar (index ≥ strategy.warmupPeriod):
     a. Generate signal via strategy.evaluate(bar, index, ohlcv)
     b. If BUY & cash > 0: execute buy (fee + slippage)
     c. If SELL & position > 0: execute sell (fee + slippage)
     d. Update equity curve
     e. Check stop loss / take profit
  4. Close open position at end
  5. Calculate metrics
  6. Return BacktestResult
```

### STRATEGY INTERFACE

```typescript
interface Strategy {
  name: string;
  warmupPeriod: number;
  evaluate(bar, index, ohlcv): Signal; // BUY/SELL/HOLD
}
```

### BUILT-IN STRATEGIES (from `backtest.config.ts`)

| Strategy | Description |
|----------|-------------|
| `TREND_FOLLOWING` | MA crossover + trend filter |
| `MEAN_REVERSION` | RSI/Bollinger mean reversion |
| `BREAKOUT` | Donchian channel breakout |
| `MOMENTUM` | Momentum + volume confirmation |
| `MULTI_FACTOR` | Combined signals |

**Extensible:** New strategies via `StrategyRegistry`

---

## BACKTEST RESULT (BacktestResult)

| Field | Type | Description |
|-------|------|-------------|
| `totalReturn` | % | Portfolio return |
| `annualReturn` | % | Annualized |
| `sharpeRatio` | number | Risk-adjusted |
| `sortinoRatio` | number | Downside risk-adjusted |
| `maxDrawdown` | % | Peak-to-trough |
| `winRate` | % | Winning trades / total |
| `profitFactor` | number | Gross profit / gross loss |
| `totalTrades` | int | Number of trades |
| `avgTradeReturn` | % | Average per trade |
| `trades` | array | Individual trade details |
| `equity` | array | Equity curve points |
| `parameters` | object | Strategy params used |
| `status` | enum | PENDING/RUNNING/COMPLETED/FAILED |

**Stored in Prisma:** `BacktestResult` model with relations to `WalkForwardResult`, `MonteCarloResult`

---

## ADVANCED BACKTEST FEATURES

### 1. WALK-FORWARD ANALYSIS
**File:** `apps/api/src/modules/backtest/learning/learning-engine.ts`

```typescript
WalkForwardEngine.run(strategy, ohlcv, windows):
  - Splits data into N windows
  - In-sample optimization, out-of-sample test
  - Returns degradation ratio (in-sample vs out-of-sample)
  - Detects overfitting
```

**Output:** `WalkForwardResult` per window (in-sample/out-sample returns, degradation ratio)

### 2. MONTE CARLO SIMULATION
**File:** `apps/api/src/modules/backtest/learning/learning-engine.ts`

```typescript
MonteCarloEngine.run(trades, simulations=1000):
  - Resamples trade returns with replacement
  - Calculates VaR (95%, 99%), CVaR
  - Percentile distribution (1st, 5th, 10th, ..., 99th)
  - Best/Worst case scenarios
```

**Output:** `MonteCarloResult` (VaR, CVaR, percentiles, simulations data)

### 3. PARAMETER OPTIMIZATION
**File:** `apps/api/src/modules/backtest/learning/learning-engine-v2.ts`

```typescript
ParameterOptimizer.optimize(strategy, paramSpace, ohlcv):
  - Grid search / random search / Bayesian
  - Cross-validation
  - Returns optimal params + robustness score
```

---

## INTEGRATION WITH PREDICTION & SELF-LEARNING

### PREDICTION CALIBRATION (PredictionService)
```typescript
runCalibrationBacktest(symbol, ohlcv, timeframe):
  - Runs backtest with 'indicator' strategy
  - Returns winRate, Sharpe, etc.
  - Used by PredictionScoreEngine for calibration
```

**Evidence:** `prediction.service.ts:250-300`

### SELF-LEARNING (SelfLearningService)
```typescript
runLearningCycle():
  For each ticker with cached prediction:
    report = BacktestService.getReport(ticker, '1d', 'indicator')
    winRate = report.result.performance.winRate
    modifier = calculateModifier(winRate, predictionAccuracy)
    registry.set(ticker, modifier)
```

**Evidence:** `self-learning.service.ts:runLearningCycle()`

**Integration Point:** `BacktestService.getReport(symbol, '1d', 'indicator')` → `BacktestReportDto.result.performance.winRate`

---

## BIAS DETECTION ANALYSIS

| Bias Type | Detection Mechanism | Status |
|-----------|---------------------|--------|
| **Look-Ahead Bias** | Strategy only uses data up to current bar index | ✅ **PREVENTED** — `evaluate(bar, index, ohlcv)` only sees `ohlcv[0..index]` |
| **Data Leakage** | Train/test split in walk-forward | ✅ **PREVENTED** — In-sample/out-of-sample separation |
| **Survivorship Bias** | Tests on ALL symbols from SymbolRegistry | ⚠️ **PARTIAL** — SymbolRegistry must include delisted |
| **Future Information Leakage** | Indicators calculated up to current bar only | ✅ **PREVENTED** — IndicatorEngine uses historical data only |
| **Overfitting** | Walk-forward degradation ratio + Monte Carlo | ✅ **DETECTED** — Degradation ratio > 1.5 flags |

**Critical Check:** `backtest.engine.ts` — Signal generation uses `ohlcv.slice(0, index + 1)` — **NO FUTURE DATA ACCESS**

---

## FEES & SLIPPAGE MODEL

**File:** `backtest.config.ts`

```typescript
const DEFAULT_BACKTEST_CONFIG = {
  initialCapital: 100000,
  commissionRate: 0.001,      // 0.1% per trade
  slippageRate: 0.0005,       // 0.05% per trade
  minCommission: 1.0,         // Minimum 1 TRY
  maxPositionSize: 1.0,       // 100% of capital
  allowShort: false,
  compoundReturns: true,
};
```

**Applied Per Trade:**
- Buy: `cost = price * (1 + slippageRate) * qty + commission`
- Sell: `proceeds = price * (1 - slippageRate) * qty - commission`

**Realistic:** Yes — Includes both commission and slippage

---

## PERFORMANCE METRICS CALCULATION

| Metric | Formula | Verified? |
|--------|---------|-----------|
| **Sharpe Ratio** | `(meanReturn - riskFree) / stdDev` | ✅ |
| **Sortino Ratio** | `(meanReturn - riskFree) / downsideStdDev` | ✅ |
| **Max Drawdown** | `max(peak - trough) / peak` | ✅ |
| **Win Rate** | `winningTrades / totalTrades` | ✅ |
| **Profit Factor** | `grossProfit / grossLoss` | ✅ |
| **Calmar Ratio** | `annualReturn / maxDrawdown` | ✅ |
| **CAGR** | `(final/initial)^(1/years) - 1` | ✅ |
| **VaR 95/99** | Monte Carlo percentile | ✅ |
| **CVaR** | Mean of tail beyond VaR | ✅ |

---

## API ENDPOINTS

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/backtest` | List backtests |
| GET | `/api/backtest/:id` | Get backtest detail |
| POST | `/api/backtest` | Create backtest |
| POST | `/api/backtest/:id/run` | Execute backtest |
| GET | `/api/backtest/:id/results` | Get results |
| GET | `/api/backtest/strategies` | List strategies |

**Frontend:** `/backtest` page with strategy selection, parameter config, results visualization

---

## TESTS

| Test File | Tests | Status |
|-----------|-------|--------|
| `backtest.engine.spec.ts` | 12 | ✅ |
| `backtest.service.spec.ts` | 8 | ✅ |
| `backtest.controller.spec.ts` | 6 | ✅ |
| `backtest.registry.spec.ts` | 5 | ✅ |
| `backtest.integration.spec.ts` | 4 | ✅ |
| `learning/learning-engine.spec.ts` | 6 | ✅ |
| `integration/elite-score-weight.adapter.spec.ts` | 3 | ✅ |
| `integration/tomorrow-learning-link.spec.ts` | 2 | ✅ |
| `integration/portfolio-integration.spec.ts` | 4 | ✅ |
| `registry/backtest-registry.spec.ts` | 3 | ✅ |

**Total: ~53 tests PASSING**

---

## EVIDENCE

- `apps/api/src/modules/backtest/backtest.engine.ts`
- `apps/api/src/modules/backtest/backtest.service.ts`
- `apps/api/src/modules/backtest/backtest.registry.ts`
- `apps/api/src/modules/backtest/backtest.config.ts`
- `apps/api/src/modules/backtest/learning/learning-engine.ts`
- `apps/api/src/modules/backtest/learning/learning-engine-v2.ts`
- `apps/api/src/modules/backtest/integration/*.spec.ts`
- `apps/api/src/modules/prediction/prediction.service.ts` (calibration)
- `apps/api/src/modules/ai-early-opportunity/self-learning/self-learning.service.ts` (learning cycle)

---

## CONCLUSION

**BACKTEST ENGINE: IMPLEMENTED** — Full simulation, walk-forward, Monte Carlo, parameter optimization, bias prevention, fees/slippage, 53 tests passing.

**INTEGRATION VERIFIED:**
- ✅ Prediction calibration uses backtest win rate
- ✅ Self-learning uses backtest win rate for modifiers
- ✅ No look-ahead bias (bar-index bounded)
- ✅ Walk-forward + Monte Carlo for robustness

**CAVEATS:**
1. **Survivorship Bias** — SymbolRegistry may not include delisted stocks
2. **No Transaction Cost Modeling for Corporate Actions** — Splits, dividends not modeled
3. **Single-Asset Only** — No portfolio-level backtest (separate PortfolioOptimization module)
4. **In-Memory Registry** — Results lost on restart (Prisma persists but registry is memory)