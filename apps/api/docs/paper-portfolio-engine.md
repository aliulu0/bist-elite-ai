# Paper Portfolio Engine

Virtual trading simulation engine for backtesting and paper trading Borsa İstanbul signals without real capital.

## Architecture

```
PaperPortfolioOrchestratorService (main entry point)
├── PaperRiskManagerService (risk checks & portfolio risk evaluation)
├── PaperTradeExecutorService (order execution with slippage & costs)
├── PositionManagerService (position lifecycle management)
├── PaperPerformanceTrackerService (returns, metrics, snapshots)
└── PaperReportGeneratorService (Turkish report generation)
```

## Services

### PositionManagerService
- `openPosition()` — create position from order
- `closePosition()` — close position, calculate realized PnL
- `partialClose()` — partial close with remaining position
- `updateCurrentPrice()` — update mark-to-market price
- `getOpenPositions()` / `getClosedPositions()`

### PaperTradeExecutorService
- `executeBuy()` / `executeSell()` — create filled orders with slippage and transaction costs
- `validateBuyOrder()` / `validateSellOrder()` — pre-trade validation
- `calculateSlippage()` / `calculateTransactionCost()`

### PaperRiskManagerService
- Position size limits, sector exposure limits, cash allocation bounds
- Drawdown monitoring, max position count
- Stop loss / take profit triggers
- Portfolio-level risk evaluation with 5 risk factor types

### PaperPerformanceTrackerService
- Total, realized, unrealized returns
- Daily returns, annualized return, Sharpe ratio
- Max drawdown, volatility, win rate, profit factor
- Portfolio snapshots

### PaperReportGeneratorService
- Summary report (getiri, risk, işlem analizi)
- Position detail report (açık/kapanmış pozisyonlar)
- Risk analysis report (sektör maruziyeti, risk faktörleri)

## Configuration

```typescript
const config: PaperPortfolioConfig = {
  transactionCostPercent: 0.001,    // %0.1
  slippagePercent: 0.0005,          // %0.05
  maxPositionSizePercent: 0.20,     // %20 max single position
  maxPositions: 20,
  minPositionSize: 1000,
  maxSectorExposurePercent: 0.40,   // %40 max sector
  maxCashAllocationPercent: 0.95,
  minCashAllocationPercent: 0.05,
  defaultStopLossPercent: 0.08,     // %8 stop loss
  defaultTakeProfitRatio: 2.0,      // 2x risk/reward
  maxDrawdownLimit: 0.20,           // %20 max drawdown
};
```

## Usage

```typescript
const orchestrator = new PaperPortfolioOrchestratorService(
  riskManager, performanceTracker, reportGenerator,
  tradeExecutor, positionManager, config,
);

// Execute a buy signal
const result = orchestrator.executeSignal({
  portfolioId: 'default',
  stockSymbol: 'THYAO',
  stockName: 'Türk Hava Yolları',
  action: 'BUY',
  quantity: 100,
  currentPrice: 280.50,
  eliteScore: 78,
  consensusScore: 82,
  confidenceScore: 0.85,
  strategyUsed: 'elite-score',
  marketRegime: MarketRegime.BULL,
  timeframeConsensus: 'strong',
});

// Get reports
const summary = orchestrator.getSummary();
const performance = orchestrator.getPerformanceReport();
const risk = orchestrator.getRiskAssessment();
const fullReport = orchestrator.getFullReport();
```

## Tests

90 unit tests across 9 test suites covering:
- Type definitions and defaults
- Position lifecycle (open, close, partial)
- Trade execution (buy, sell, slippage, costs, validation)
- Risk management (limits, drawdown, stop loss, portfolio risk)
- Performance tracking (returns, metrics, snapshots)
- Report generation (summary, positions, risk)
- Orchestrator integration (signals, close, partial, reports)
- Module DI registration
