# Enterprise Monte Carlo Risk Laboratory

> Sprint 5, Prompt 23 — Quantifying uncertainty, tail risk, and capital preservation.

## Overview

The Monte Carlo Risk Laboratory simulates thousands of possible future market scenarios to evaluate portfolio resilience, stock robustness, and strategy reliability. It is a complete enterprise risk laboratory — not just a simulator.

## Architecture

```
MonteCarloRequest
    ↓
MonteCarloSimulator — 8 simulation methods
    ├→ GBM / Bootstrap / Regime / Student-t / Fat Tail / Jump Diffusion / Custom
    ↓
RiskModelEngine — VaR, CVaR, drawdown, tail risk
    ↓
ScenarioGenerator — 9 market scenarios with impact scoring
    ↓
PortfolioAnalyzer — diversification, correlation, concentration
    ↓
MonteCarloStatistics — probability metrics, skewness, kurtosis
    ↓
ReportGenerator — 7 report types
    ↓
MonteCarloResult
```

## Simulation Methods

| Method | Description |
|--------|-------------|
| Historical Bootstrap | Sample from historical returns |
| Geometric Brownian Motion | Classic GBM with drift and volatility |
| Block Bootstrap | Preserve autocorrelation with block sampling |
| Regime Switching | Multi-regime model with state transitions |
| Student-t Distribution | Fat tails via Student-t sampling |
| Fat Tail Simulation | Jump-augmented fat tail model |
| Jump Diffusion | Merton jump-diffusion process |
| Custom Probability | User-defined distribution |

## Risk Metrics

| Metric | Description |
|--------|-------------|
| VaR (90/95/99%) | Value at Risk at multiple confidence levels |
| CVaR (95/99%) | Conditional VaR (Expected Shortfall) |
| Maximum Drawdown | Worst peak-to-trough decline |
| Expected Drawdown | Average drawdown across simulations |
| Tail Risk | Mean loss in worst 5% of outcomes |
| Probability of Loss | % of simulations with negative return |
| Probability of Preservation | % maintaining initial capital |
| Risk of Ruin | Probability of catastrophic loss |
| Ulcer Index | Drawdown stress measure |

## Market Scenarios

- Bull Market
- Bear Market
- Sideways Market
- High Inflation
- High Interest Rate
- Low Liquidity
- Flash Crash
- Black Swan
- Recovery Phase

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/monte-carlo/run` | Run Monte Carlo simulation |
| GET | `/monte-carlo/list` | List all simulations |
| GET | `/monte-carlo/summary` | Summary statistics |
| POST | `/monte-carlo/report` | Generate report |
| GET | `/monte-carlo/scenarios` | List available scenarios |
| POST | `/monte-carlo/benchmark` | Run performance benchmark |
| GET | `/monte-carlo/cache/stats` | Cache statistics |
| POST | `/monte-carlo/cache/clear` | Clear cache |
| GET | `/monte-carlo/health` | Health check |

## Reports

- **Executive Summary**: Key risk metrics and probability scores at a glance
- **Simulation Summary**: Full distribution statistics with VaR/CVaR table
- **Worst Case**: Bottom 10 simulations with drawdown analysis
- **Best Case**: Top 10 simulations with upside probability
- **Expected Case**: Mean/median/skewness/kurtosis with confidence intervals
- **Tail Risk**: VaR, CVaR, tail probabilities, risk of ruin, ulcer index
- **Capital Preservation**: Probability of maintaining/growing initial capital

## Performance

- Supports 100,000+ simulations
- Deterministic seeding for reproducibility
- Parallel-safe architecture

## Tests

```bash
python -m pytest modules/monte_carlo_engine/tests -v
```

161 tests covering types, simulation (all 8 methods), risk models, scenario generation, portfolio analysis, statistics, validation, reports, registry, cache, benchmark, schemas, service, and API.
