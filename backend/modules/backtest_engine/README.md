# Enterprise Backtest Engine

> Sprint 5, Prompt 21 — The validation layer of the BIST Elite AI platform.

## Overview

The Enterprise Backtest Engine validates every strategy, score, and recommendation using historical market data. No scoring model is accepted without backtesting.

## Architecture

```
BacktestRequest
    ↓
DatasetManager — load historical price data
    ↓
Signal Generator — SMA/RSI/momentum/volume signals
    ↓
PortfolioSimulator — multi-position management
    ├→ TradeSimulator — individual trade execution
    └→ Equity Curve — track portfolio value over time
    ↓
PerformanceCalculator — 13 metrics
    ↓
BenchmarkComparator — vs BIST100 / Buy & Hold
    ↓
ReportGenerator — executive/risk/performance/trade-list
    ↓
BacktestResult
```

## Supported Backtest Types

- Single Strategy Backtest
- Portfolio Backtest
- Multi Strategy Backtest
- Rolling Backtest
- Incremental Backtest
- Event Driven Backtest

## Performance Metrics

| Metric | Description |
|--------|-------------|
| Total Return | Total portfolio return |
| Annualized Return | CAGR |
| Maximum Drawdown | Worst peak-to-trough decline |
| Sharpe Ratio | Risk-adjusted return |
| Sortino Ratio | Downside risk-adjusted return |
| Calmar Ratio | Return / Max Drawdown |
| Win Rate | % of winning trades |
| Profit Factor | Gross profit / Gross loss |
| Expectancy | Expected value per trade |
| Recovery Factor | Return / Max Drawdown |
| Ulcer Index | Drawdown stress measure |

## Trade Analysis

- Entry/Exit dates and prices
- Holding period
- Maximum Favorable Excursion (MFE)
- Maximum Adverse Excursion (MAE)
- Exit reasons: Signal, Stop Loss, Take Profit, Trailing Stop, Time Exit, End of Data

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/backtest/run` | Run a backtest |
| GET | `/backtest/list` | List all backtests |
| GET | `/backtest/history/{symbol}` | History for a symbol |
| GET | `/backtest/summary` | Summary statistics |
| POST | `/backtest/compare` | Compare multiple symbols |
| POST | `/backtest/report` | Generate report |
| POST | `/backtest/benchmark` | Run performance benchmark |
| GET | `/backtest/cache/stats` | Cache statistics |
| POST | `/backtest/cache/clear` | Clear cache |
| GET | `/backtest/health` | Health check |

## Reports

- **Executive Summary**: Key metrics at a glance
- **Trade List**: All trades with quality classification
- **Performance Report**: Detailed metrics breakdown
- **Risk Report**: Drawdown analysis, exit reason distribution
- **Benchmark Comparison**: Strategy vs benchmark metrics

## Tests

```bash
python -m pytest modules/backtest_engine/tests -v
```

179 tests covering types, datasets, simulators, performance, reports, registry, cache, benchmark, validator, schemas, engine, service, and API.
