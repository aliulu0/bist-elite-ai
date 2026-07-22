# Sprint 9 Prompt 51 — Paper Portfolio Engine

## 1. Overview

Production-ready virtual portfolio engine that simulates investment decisions using the platform's generated signals without executing real trades. Tracks positions, calculates P&L, measures performance metrics, and generates comprehensive Turkish reports.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────┐
│              PaperPortfolioOrchestrator                    │
│  createPortfolio / executeSignal / closePosition /        │
│  getPortfolio / getPerformance / generateReport           │
├────────────┬──────────────┬──────────────┬───────────────┤
│ Position   │ PaperTrade   │ Performance  │ PaperRisk     │
│ Manager    │ Executor     │ Tracker      │ Manager       │
├────────────┴──────────────┴──────────────┴───────────────┤
│                   ReportGenerator                         │
├──────────────────────────────────────────────────────────┤
│              In-Memory State Store                        │
│  Map<portfolioId, PortfolioState>                        │
└──────────────────────────────────────────────────────────┘
         │                │                │
    Elite Score      Consensus        Notification
       Engine           Engine           Engine
```

---

## 3. File Structure

```
apps/api/src/common/paper-portfolio/
├── types.ts                                      # Enums, interfaces, config
├── types.spec.ts                                 # Config factory tests
├── turkish-terms.ts                              # Turkish translations
├── position-manager.service.ts                   # Position lifecycle
├── position-manager.service.spec.ts              # 8 tests
├── paper-trade-executor.service.ts               # Simulated execution
├── paper-trade-executor.service.spec.ts          # 8 tests
├── paper-performance-tracker.service.ts          # P&L & metrics
├── paper-performance-tracker.service.spec.ts     # 10 tests
├── paper-risk-manager.service.ts                 # Risk checks
├── paper-risk-manager.service.spec.ts            # 7 tests
├── paper-report-generator.service.ts             # Turkish reports
├── paper-report-generator.service.spec.ts        # 6 tests
├── paper-portfolio-orchestrator.service.ts       # Main orchestrator
├── paper-portfolio-orchestrator.service.spec.ts  # 12 tests
├── paper-portfolio.module.ts                     # NestJS module
├── paper-portfolio.module.spec.ts                # Module metadata tests
└── index.ts                                      # Public exports
```

Total: 10 source files, 8 test files, ~59 tests

---

## 4. Types (`types.ts`)

### Enums

```typescript
export enum PaperPortfolioType {
  DEFAULT = 'DEFAULT',
  GROWTH = 'GROWTH',
  CONSERVATIVE = 'CONSERVATIVE',
  BALANCED = 'BALANCED',
  CUSTOM = 'CUSTOM',
}

export enum PositionStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum MarketRegime {
  BULL = 'BULL',
  BEAR = 'BEAR',
  SIDEWAYS = 'SIDEWAYS',
  HIGH_VOLATILITY = 'HIGH_VOLATILITY',
  LOW_VOLATILITY = 'LOW_VOLATILITY',
}
```

### Core Interfaces

```typescript
// --- Portfolio State (in-memory) ---
export interface PortfolioState {
  id: string;
  name: string;
  type: PaperPortfolioType;
  initialCapital: number;
  cashBalance: number;
  positions: Map<string, PositionState>;
  orders: Order[];
  createdAt: string;
  updatedAt: string;
}

export interface PositionState {
  id: string;
  stockSymbol: string;
  stockName: string;
  status: PositionStatus;
  side: 'BUY' | 'SELL';
  quantity: number;
  avgCost: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  entryTime: string;
  exitTime?: string;
  exitPrice?: number;
  holdingPeriodDays: number;
  notes: string[];
  // Signal tracking
  entryEliteScore: number;
  entryConfidence: number;
  entryConsensusScore: number;
  strategyUsed: string;
  marketRegime: MarketRegime;
  timeframeConsensus: string;
}

export interface Order {
  id: string;
  stockSymbol: string;
  stockName: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: OrderStatus;
  executionPrice?: number;
  executionTime?: string;
  slippage: number;
  transactionCost: number;
  signalSource: string;
  eliteScore: number;
  consensusScore: number;
  confidenceScore: number;
  notes: string;
  createdAt: string;
}

// --- Input/Output ---
export interface CreatePortfolioInput {
  name: string;
  type: PaperPortfolioType;
  initialCapital: number;
  config?: Partial<PaperPortfolioConfig>;
}

export interface ExecuteSignalInput {
  portfolioId: string;
  stockSymbol: string;
  stockName: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  currentPrice: number;
  eliteScore: number;
  consensusScore: number;
  confidenceScore: number;
  strategyUsed: string;
  marketRegime: MarketRegime;
  timeframeConsensus: string;
  notes?: string;
}

export interface ClosePositionInput {
  portfolioId: string;
  stockSymbol: string;
  exitPrice: number;
  exitTime?: string;
  notes?: string;
}

export interface PartialCloseInput {
  portfolioId: string;
  stockSymbol: string;
  quantity: number;
  exitPrice: number;
  exitTime?: string;
  notes?: string;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  type: PaperPortfolioType;
  totalValue: number;
  cashBalance: number;
  investedValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  openPositionsCount: number;
  closedPositionsCount: number;
  unrealizedPnl: number;
  realizedPnl: number;
  positionCount: number;
  lastUpdated: string;
}

export interface PositionDetail {
  stockSymbol: string;
  stockName: string;
  status: PositionStatus;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  holdingPeriodDays: number;
  entryEliteScore: number;
  entryConfidence: number;
  strategyUsed: string;
}

export interface PerformanceReport {
  portfolioId: string;
  portfolioName: string;
  period: string;
  // Returns
  totalReturn: number;
  realizedReturn: number;
  unrealizedReturn: number;
  dailyReturns: DailyReturn[];
  monthlyReturn: number;
  annualizedReturn: number;
  // Risk
  maxDrawdown: number;
  currentDrawdown: number;
  portfolioVolatility: number;
  sharpeRatio: number;
  // Win/Loss
  winRate: number;
  lossRate: number;
  profitFactor: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  // Holding
  avgHoldingPeriod: number;
  // Exposure
  sectorExposure: Record<string, number>;
  cashAllocation: number;
  concentrationRisk: number;
  // Generated
  generatedAt: string;
  disclaimer: string;
}

export interface DailyReturn {
  date: string;
  returnPercent: number;
  portfolioValue: number;
}

// --- Config ---
export interface PaperPortfolioConfig {
  enabled: boolean;
  transactionCostPercent: number;    // e.g., 0.001 = 0.1%
  slippagePercent: number;           // e.g., 0.0005 = 0.05%
  maxPositionSizePercent: number;    // e.g., 0.20 = 20% of portfolio
  maxPositions: number;
  minPositionSize: number;           // minimum TL value
  maxSectorExposurePercent: number;  // e.g., 0.40 = 40%
  maxCashAllocationPercent: number;  // max cash to keep
  minCashAllocationPercent: number;  // min cash to keep
  defaultCurrency: string;
  enableStopLoss: boolean;
  defaultStopLossPercent: number;
  enableTakeProfit: boolean;
  defaultTakeProfitRatio: number;
  maxDrawdownLimit: number;          // e.g., 0.20 = 20%
  enableCaching: boolean;
  cacheTtlMs: number;
}

export const PAPER_PORTFOLIO_DEFAULTS: PaperPortfolioConfig = {
  enabled: true,
  transactionCostPercent: 0.001,
  slippagePercent: 0.0005,
  maxPositionSizePercent: 0.20,
  maxPositions: 20,
  minPositionSize: 1000,
  maxSectorExposurePercent: 0.40,
  maxCashAllocationPercent: 0.95,
  minCashAllocationPercent: 0.05,
  defaultCurrency: 'TRY',
  enableStopLoss: true,
  defaultStopLossPercent: 0.08,
  enableTakeProfit: true,
  defaultTakeProfitRatio: 2.0,
  maxDrawdownLimit: 0.20,
  enableCaching: true,
  cacheTtlMs: 30000,
};
```

---

## 5. Service Designs

### 5.1 PositionManagerService

**Responsibility**: Track position lifecycle (open, update, close, partial close).

```
Methods:
- openPosition(order, config) -> PositionState
- closePosition(position, exitPrice, exitTime) -> PositionState
- partialClose(position, quantity, exitPrice) -> [PositionState, PositionState]
- updateCurrentPrice(position, currentPrice) -> PositionState
- getOpenPositions(portfolio) -> PositionState[]
- getClosedPositions(portfolio) -> PositionState[]
- getPosition(portfolio, stockSymbol) -> PositionState | undefined
- calculateUnrealizedPnl(position, currentPrice) -> number
- calculateHoldingPeriod(entryTime) -> number
```

### 5.2 PaperTradeExecutorService

**Responsibility**: Simulate trade execution with slippage and transaction costs.

```
Methods:
- executeBuy(order, currentPrice, config) -> Order
- executeSell(order, currentPrice, config) -> Order
- calculateSlippage(price, side, config) -> number
- calculateTransactionCost(amount, config) -> number
- validateBuyOrder(portfolio, quantity, price, config) -> {valid, reason}
- validateSellOrder(portfolio, position, quantity) -> {valid, reason}
- rejectOrder(order, reason) -> Order
```

### 5.3 PaperPerformanceTrackerService

**Responsibility**: Calculate all performance and risk metrics.

```
Methods:
- calculatePerformance(portfolio, snapshots) -> PerformanceReport
- calculateTotalReturn(portfolio) -> number
- calculateRealizedReturn(portfolio) -> number
- calculateUnrealizedReturn(portfolio) -> number
- calculateDailyReturns(snapshots) -> DailyReturn[]
- calculateMaxDrawdown(snapshots) -> number
- calculateSharpeRatio(dailyReturns) -> number
- calculateWinRate(positions) -> number
- calculateProfitFactor(positions) -> number
- calculateSectorExposure(positions, totalValue) -> Record<string, number>
- calculateConcentrationRisk(positions, totalValue) -> number
- calculateVolatility(dailyReturns) -> number
- generateSnapshot(portfolio) -> PortfolioSnapshot
```

### 5.4 PaperRiskManagerService

**Responsibility**: Pre-trade risk checks and portfolio risk monitoring.

```
Methods:
- checkPositionLimit(portfolio, stockSymbol, quantity, price, config) -> {allowed, reason}
- checkSectorExposure(portfolio, sector, amount, config) -> {allowed, reason}
- checkCashAllocation(portfolio, amount, config) -> {allowed, reason}
- checkDrawdownLimit(portfolio, config) -> {withinLimit, currentDrawdown}
- checkMaxPositions(portfolio, config) -> {allowed, reason}
- checkMinPositionSize(quantity, price, config) -> {allowed, reason}
- evaluatePortfolioRisk(portfolio) -> RiskAssessment
- shouldStopLoss(position, currentPrice, config) -> boolean
- shouldTakeProfit(position, currentPrice, config) -> boolean
```

### 5.5 PaperReportGeneratorService

**Responsibility**: Generate Turkish reports and structured data.

```
Methods:
- generatePortfolioSummary(portfolio, positions) -> PortfolioSummary
- generatePositionDetails(portfolio) -> PositionDetail[]
- generatePerformanceReport(portfolio, performance) -> PerformanceReport
- generateTurkishSummary(portfolio, performance) -> string
- generateRiskReport(portfolio, riskAssessment) -> string
- generateRecommendationSuccessReport(portfolio) -> string
```

### 5.6 PaperPortfolioOrchestrator

**Responsibility**: Main entry point, orchestrates all sub-services.

```
Methods:
- createPortfolio(input) -> PortfolioState
- executeSignal(input) -> {portfolio, order, position}
- closePosition(input) -> {portfolio, position, realizedPnl}
- partialClose(input) -> {portfolio, positions}
- updatePrices(portfolioId, prices) -> PortfolioState
- getPortfolio(portfolioId) -> PortfolioSummary
- getOpenPositions(portfolioId) -> PositionDetail[]
- getClosedPositions(portfolioId) -> PositionDetail[]
- getPerformance(portfolioId, period?) -> PerformanceReport
- generateReport(portfolioId) -> string  (Turkish)
- generateRiskReport(portfolioId) -> string
- listPortfolios() -> PortfolioSummary[]
- deletePortfolio(portfolioId) -> boolean
```

---

## 6. Module Registration

```typescript
// paper-portfolio.module.ts
@Global()
@Module({
  providers: [
    PositionManagerService,
    PaperTradeExecutorService,
    PaperPerformanceTrackerService,
    PaperRiskManagerService,
    PaperReportGeneratorService,
    PaperPortfolioOrchestrator,
  ],
  exports: [
    PositionManagerService,
    PaperTradeExecutorService,
    PaperPerformanceTrackerService,
    PaperRiskManagerService,
    PaperReportGeneratorService,
    PaperPortfolioOrchestrator,
  ],
})
export class PaperPortfolioModule {}
```

**AppModule integration**: Add `PaperPortfolioModule` to `AppModule.imports` array.

---

## 7. In-Memory State Design

```typescript
// PaperPortfolioOrchestrator private state
private portfolios: Map<string, PortfolioState> = new Map();
private snapshots: Map<string, PortfolioSnapshot[]> = new Map();
```

No Prisma dependency. All state is in-memory, matching the existing service patterns (EliteScore, Consensus, Calibration all use in-memory computation).

---

## 8. Integration Points

| Engine | Integration |
|--------|------------|
| Elite Score Engine | Receives `EliteScoreOutput` as signal input for BUY/SELL decisions |
| Consensus Engine | Receives `ConsensusEngineOutput` for timeframe consensus tracking |
| Explainability Engine | Records explanation factors for each trade decision |
| Strategy Validation Engine | Provides `TradeRecord[]` for backtesting validation |
| Adaptive Calibration | Provides `ScoringSnapshot[]` for calibration analysis |
| Notification Engine | Can emit PORTFOLIO_UPDATE events on position changes |

---

## 9. Test Plan (~59 tests)

| Test File | Tests | Coverage |
|-----------|-------|----------|
| types.spec.ts | 3 | Config factory, defaults |
| position-manager.service.spec.ts | 8 | Open, close, partial close, update price, unrealized P&L, holding period |
| paper-trade-executor.service.spec.ts | 8 | Buy/sell execution, slippage, costs, validation, rejection |
| paper-performance-tracker.service.spec.ts | 10 | Returns, drawdown, Sharpe, win rate, profit factor, sector exposure, volatility |
| paper-risk-manager.service.spec.ts | 7 | Position limits, sector exposure, cash allocation, drawdown, stop loss, take profit |
| paper-report-generator.service.spec.ts | 6 | Summary, positions, performance, Turkish report, risk report |
| paper-portfolio-orchestrator.service.spec.ts | 12 | Create, execute, close, partial close, update prices, get portfolio, performance, reports, delete |
| paper-portfolio.module.spec.ts | 3 | Module metadata, provider count, exports |

---

## 10. Implementation Order

1. `types.ts` + `types.spec.ts` — Foundation types and config
2. `turkish-terms.ts` — Turkish translations
3. `position-manager.service.ts` + tests — Position lifecycle
4. `paper-trade-executor.service.ts` + tests — Trade simulation
5. `paper-risk-manager.service.ts` + tests — Risk checks
6. `paper-performance-tracker.service.ts` + tests — P&L metrics
7. `paper-report-generator.service.ts` + tests — Reports
8. `paper-portfolio-orchestrator.service.ts` + tests — Main orchestrator
9. `paper-portfolio.module.ts` + `index.ts` — Module registration
10. `app.module.ts` — Import new module
11. Run all tests — Verify 700+ tests pass
12. Update CHANGELOG — v2.1.0
13. Create docs — paper-portfolio-engine.md

---

## 11. CHANGELOG Entry (v2.1.0)

```markdown
## [2.1.0] - 2026-07-21

### Added (Paper Portfolio Engine - Prompt 51)
- `PositionManagerService` — position lifecycle management (open, close, partial close, update)
- `PaperTradeExecutorService` — simulated trade execution with slippage and transaction costs
- `PaperPerformanceTrackerService` — P&L tracking, returns, drawdown, Sharpe, win rate, profit factor
- `PaperRiskManagerService` — pre-trade risk checks (position limits, sector exposure, cash allocation, drawdown)
- `PaperReportGeneratorService` — Turkish reports, portfolio summary, position details, risk reports
- `PaperPortfolioOrchestrator` — main orchestrator with create/execute/close/report operations
- `PaperPortfolioModule` — global NestJS module exporting all portfolio services
- 5 portfolio types: DEFAULT, GROWTH, CONSERVATIVE, BALANCED, CUSTOM
- Configurable transaction costs, slippage, position limits, risk parameters
- Integration with Elite Score, Consensus, Explainability, Strategy Validation, Adaptive Calibration engines
- 59 unit tests across 8 test suites
- Documentation: docs/paper-portfolio-engine.md

### Changed
- `AppModule` now imports `PaperPortfolioModule`
- Total API tests: 705 tests / 63 suites ALL GREEN
```

---

## 12. Manual Verification Steps

1. Create a portfolio with 1,000,000 TRY initial capital
2. Execute a BUY signal for THYAO at 100 TRY with elite score 75
3. Verify position is opened with correct quantity and costs
4. Update price to 110 TRY, verify unrealized P&L
5. Close position at 110 TRY, verify realized P&L
6. Generate performance report, verify metrics
7. Generate Turkish summary report
8. Test risk limits (position size, sector exposure)
9. Test partial close
10. Test stop loss and take profit triggers

---

## 13. Rollback Plan

1. Remove `PaperPortfolioModule` import from `app.module.ts`
2. Delete `apps/api/src/common/paper-portfolio/` directory
3. Run tests to verify all existing tests still pass (646 tests)
4. No database changes (in-memory only), so no migration rollback needed

---

## 14. Next Sprint Prerequisites

- Paper Portfolio Engine must be complete and tested
- All existing engines (Elite Score, Consensus, Explainability, Strategy Validation, Adaptive Calibration) must remain functional
- Notification Engine integration ready for portfolio events
- Cache namespace `paperPortfolio` available
