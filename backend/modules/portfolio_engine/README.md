# Enterprise Portfolio Construction Engine

Version: 2.2.0
Module: `backend/modules/portfolio_engine/`
Tests: 252 passed

## Overview

The Portfolio Construction Engine transforms ranked stock candidates into a diversified and practical portfolio proposal. It is advisory only and never executes trades.

## Architecture

```
portfolio_engine/
    core/               # Types, enums, dataclasses, helpers
    ranking/            # Stock ranking by 6 criteria
    selection/          # Rule-based candidate selection
    diversification/    # Sector diversification + quality metrics
    validators/         # Request/result validation
    reports/            # 6 report types
    registry/           # Singleton component registry
    cache/              # TTL + LRU caching
    schemas/            # Pydantic v2 models
    services/           # Business logic orchestrator
    api/                # REST API endpoints
    tests/              # 252 tests
```

## Pipeline

```
Stock Candidates → Rank → Select → Diversify → Quality Metrics → Report
```

1. **Rank**: Sort candidates by composite score (elite ×0.30 + decision ×0.25 + confidence ×0.20 + (100-risk) ×0.15 + liquidity ×0.10)
2. **Select**: Apply threshold rules (elite ≥40, confidence ≥30, liquidity ≥20, risk ≤80, decision ≥35)
3. **Diversify**: Enforce max stocks per sector (default 2)
4. **Quality**: Compute averages, distributions, diversification score
5. **Report**: Generate 6 report types

## Portfolio Sizes

| Size | Stocks |
|------|--------|
| Small | 5 |
| Medium | 10 |
| Large | 15 |
| X-Large | 20 |

## Selection Rules

| Rule | Default Threshold | Description |
|------|------------------|-------------|
| Elite Score | ≥ 40 | Minimum elite opportunity score |
| Confidence | ≥ 30 | Minimum confidence level |
| Liquidity | ≥ 20 | Minimum liquidity score |
| Risk | ≤ 80 | Maximum acceptable risk |
| Decision Score | ≥ 35 | Minimum decision quality |

## Diversification

| Preset | Max Per Sector |
|--------|---------------|
| Conservative | 1 |
| Balanced | 2 (default) |
| Aggressive | 3 |
| Unconstrained | Unlimited |

## Portfolio Quality Metrics

- **Average Elite Score**: Mean of selected stocks' elite scores
- **Average Confidence**: Mean confidence level
- **Average Risk**: Mean risk score
- **Diversification Score**: Based on Herfindahl-Hirschman Index (HHI)
- **Concentration Risk**: Inverse of diversification
- **Sector Distribution**: Count per sector
- **Risk Distribution**: Count per risk level

## Composite Score Weights

| Factor | Weight |
|--------|--------|
| Elite Score | 30% |
| Decision Score | 25% |
| Confidence | 20% |
| (100 - Risk) | 15% |
| Liquidity | 10% |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /portfolio/generate | Generate portfolio proposal |
| GET | /portfolio/list | List all generated portfolios |
| GET | /portfolio/current | Get latest portfolio |
| GET | /portfolio/report/{type} | Get report (full/summary/selected/rejected/sector/risk) |
| GET | /portfolio/cache/stats | Get cache statistics |
| POST | /portfolio/cache/clear | Clear cache |

## Usage Example

```python
from modules.portfolio_engine.services.service import PortfolioService
from modules.portfolio_engine.core.types import (
    PortfolioRequest, StockCandidate, InvestmentHorizon
)

svc = PortfolioService()
result = svc.generate(PortfolioRequest(
    reference_date="2024-01-01",
    horizon=InvestmentHorizon.MONTH_3,
    portfolio_size=10,
    max_per_sector=2,
    candidates=[
        StockCandidate(symbol="THYAO", sector="aviation", elite_score=85, confidence=75, risk=30),
        StockCandidate(symbol="GARAN", sector="banking", elite_score=78, confidence=68, risk=40),
        # ... more candidates
    ],
))

print(f"Selected: {len(result.proposal.selected)} stocks")
print(f"Avg Elite Score: {result.proposal.quality_metrics.avg_elite_score:.1f}")
print(f"Sectors: {result.proposal.quality_metrics.sector_distribution}")
```

## Risk Levels

| Score Range | Level |
|-------------|-------|
| 0-20 | Very Low |
| 21-40 | Low |
| 41-60 | Moderate |
| 61-80 | High |
| 81-100 | Very High |

## Dependencies

- Decision Engine
- Elite Score Engine
- Confidence Engine
- Risk Engine
- Multi-Factor Engine
- Market Regime Engine
