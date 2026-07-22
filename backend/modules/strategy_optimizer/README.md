# Enterprise Strategy Optimizer

Version: 1.8.0
Module: `backend/modules/strategy_optimizer/`
Tests: 228 passed

## Overview

The Strategy Optimizer automatically evaluates, compares, and optimizes rule-based investment strategies using historical validation. It improves robustness without overfitting and never modifies production strategies directly.

Every optimization candidate is validated through:
- Backtest Engine
- Walk Forward Engine
- Monte Carlo Risk Lab

## Architecture

```
strategy_optimizer/
    core/                   # Types, enums, dataclasses, helpers
    optimizer/              # Main optimization pipeline
    parameter_engine/       # Parameter search space management
    fitness/                # Multi-objective fitness calculation
    profiles/               # Horizon-specific optimization profiles
    validators/             # Request and result validation
    registry/               # Singleton component registry
    cache/                  # TTL + LRU result caching
    benchmark/              # Performance benchmarking
    schemas/                # Pydantic v2 models
    services/               # Business logic orchestrator
    api/                    # REST API endpoints
    tests/                  # 228 tests
```

## Optimization Types

| Type | Description |
|------|-------------|
| Rule Threshold | Optimize elite score, confidence, and risk thresholds |
| Weight | Optimize weights across all scoring categories |
| Bonus | Optimize bonus multipliers for smart money, patterns, financials |
| Penalty | Optimize penalty factors for risk and confidence |
| Filter | Optimize filter thresholds for scoring and volume |
| Ranking | Optimize ranking parameters for composite scoring |

## Investment Horizons

| Horizon | Lookback | Min Trades | Rebalance |
|---------|----------|------------|-----------|
| Weekly | 260 days | 30 | 5 days |
| 1 Month | 260 days | 20 | 21 days |
| 3 Months | 260 days | 15 | 63 days |
| 6 Months | 260 days | 10 | 126 days |
| 12 Months | 260 days | 8 | 252 days |

## Optimization Objectives

- Maximize Return
- Maximize Sharpe Ratio
- Minimize Drawdown
- Maximize Win Rate
- Increase Consistency
- Reduce False Positives
- Reduce False Negatives
- Improve Robustness

## Rejection Rules

Candidates are rejected if they:
- Show overfitting (low Monte Carlo score)
- Have excessive drawdown (>30%)
- Have low Sharpe ratio (<0.5)
- Show low generalization (Walk Forward score <0.5)
- Have degraded win rate
- Show reduced robustness

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /optimizer/run | Run optimization |
| GET | /optimizer/list | List all optimization runs |
| GET | /optimizer/history/{run_id} | Get specific run details |
| GET | /optimizer/report/{run_id} | Get optimization report |
| GET | /optimizer/cache/stats | Get cache statistics |
| POST | /optimizer/cache/clear | Clear optimization cache |

## Usage Example

```python
from modules.strategy_optimizer.services.service import StrategyOptimizerService
from modules.strategy_optimizer.core.types import (
    OptimizationRequest, OptimizationType, InvestmentHorizon, OptimizationObjective
)

svc = StrategyOptimizerService()
result = svc.run_optimization(OptimizationRequest(
    symbol="THYAO",
    optimization_type=OptimizationType.RULE_THRESHOLD,
    horizon=InvestmentHorizon.MONTH_3,
    objective=OptimizationObjective.MAXIMIZE_SHARPE,
    max_iterations=100,
    max_candidates=50,
))

print(f"Best fitness: {result.run.best_fitness}")
print(f"Improvement: {result.run.improvement_pct}%")
print(f"Optimized params: {result.optimized_parameters}")
```

## Parameter Categories

- Elite Score Threshold
- Opportunity Score Threshold
- Confidence Threshold
- Risk Threshold
- RSI Levels (oversold/overbought)
- MACD Rules (fast/slow/signal)
- Moving Average Rules (short/long)
- Volume Rules
- Smart Money Rules
- Pattern Confidence
- Financial Ratios (P/E, Debt)

## Dependencies

- Strategy Engine
- Scoring Engine
- Explainability Engine
- Backtest Engine
- Walk Forward Engine
- Monte Carlo Engine
