# Enterprise Walk Forward Analysis Engine

> Sprint 5, Prompt 22 — The validation layer for strategy generalization.

## Overview

The Walk Forward Analysis Engine validates whether strategies remain robust when applied to unseen future market data. It prevents overfitting, ensures generalization, and measures real-world robustness.

## Architecture

```
WalkForwardRequest
    ↓
WindowManager — generate train/test windows
    ├→ Rolling / Expanding / Anchored / Sliding / Hybrid
    ↓
ParameterOptimizer — grid search on training data
    ↓
Strategy Evaluation — train performance
    ↓
Out-of-Sample Validation — test on unseen data
    ↓
WalkForwardStatistics
    ├→ Generalization Score
    ├→ Overfitting Score
    ├→ Robustness Score
    └→ Consistency Score
    ↓
ReportGenerator — executive/optimization/training/validation/failure/generalization
    ↓
WalkForwardResult
```

## Window Modes

| Mode | Description |
|------|-------------|
| Rolling | Fixed-size training window that slides forward |
| Expanding | Training window grows with each step |
| Anchored | Training window always starts from the beginning |
| Sliding | Similar to rolling with smaller step size |
| Hybrid | Combines rolling and expanding approaches |

## Train/Test Splits

- 70 / 30
- 75 / 25
- 80 / 20
- 85 / 15
- Custom (configurable)

## Performance Metrics

| Metric | Description |
|--------|-------------|
| Generalization Score | How well strategy transfers to unseen data |
| Overfitting Score | Degree of curve-fitting detected |
| Robustness Score | Overall strategy robustness composite |
| Consistency Score | Consistency of out-of-sample performance |
| Parameter Sensitivity | Sensitivity to parameter changes |
| Performance Degradation | Train-to-test performance drop |
| Regime Dependency | Strategy dependence on market regime |
| Historical Drift | Performance drift over time |

## Overfitting Detection

| Severity | Threshold | Recommendation |
|----------|-----------|----------------|
| None | < 0.2 | Proceed with deployment |
| Low | 0.2 - 0.4 | Reduce parameter complexity |
| Moderate | 0.4 - 0.6 | Additional validation needed |
| High | 0.6 - 0.8 | Strategy redesign required |
| Critical | > 0.8 | Unreliable for live trading |

## Market Regime Validation

- Bull Market
- Bear Market
- Sideways Market
- High Volatility
- Low Volatility

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/walk-forward/run` | Run walk-forward analysis |
| GET | `/walk-forward/list` | List all analyses |
| GET | `/walk-forward/history/{symbol}` | History for a symbol |
| GET | `/walk-forward/summary` | Summary statistics |
| POST | `/walk-forward/report` | Generate report |
| POST | `/walk-forward/benchmark` | Run performance benchmark |
| GET | `/walk-forward/cache/stats` | Cache statistics |
| POST | `/walk-forward/cache/clear` | Clear cache |
| GET | `/walk-forward/health` | Health check |

## Reports

- **Executive Summary**: Key scores and recommended parameters at a glance
- **Optimization History**: Parameter search results across windows
- **Training Results**: In-sample performance metrics
- **Validation Results**: Out-of-sample performance metrics
- **Failure Analysis**: Window failures and negative returns
- **Generalization Report**: Full generalization/overfitting analysis with regime breakdown

## Tests

```bash
python -m pytest modules/walk_forward_engine/tests -v
```

172 tests covering types, windows, optimization, validation, statistics, reports, registry, cache, benchmark, schemas, service, and API.
