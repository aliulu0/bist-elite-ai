# Enterprise Position Sizing & Risk Allocation Engine

Version: 2.3.0
Module: `backend/modules/position_sizing_engine/`
Tests: 274 passed

## Overview

The Position Sizing & Risk Allocation Engine calculates optimal position sizes for each selected stock in a portfolio. It is advisory only and never executes trades.

## Architecture

```
position_sizing_engine/
    core/               # Types, enums, dataclasses, helpers
    allocation/         # Position sizing calculator
    risk/               # Risk allocation rules
    profiles/           # Risk profile definitions
    validators/         # Request/result validation
    reports/            # 6 report types
    cache/              # TTL + LRU caching
    schemas/            # Pydantic v2 models
    services/           # Business logic orchestrator
    api/                # REST API endpoints
    tests/              # 274 tests
```

## Pipeline

```
Position Inputs → Calculate Size → Risk Allocate → Portfolio Exposure → Report
```

1. **Calculate**: Compute raw position size from elite score, confidence, risk
2. **Adjust**: Apply risk, regime, liquidity, volatility adjustments
3. **Allocate**: Enforce sector limits, correlation limits, concentration limits
4. **Grade**: Assign position grade (A+ to D)
5. **Stop Loss/Take Profit**: Generate protective levels
6. **Report**: Generate 6 report types

## Risk Profiles

| Profile | Max Position | Min Position | Max Sector | Cash Reserve | Risk/Trade |
|---------|-------------|-------------|-----------|-------------|-----------|
| Conservative | 8% | 1% | 20% | 15% | 1.0% |
| Balanced | 12% | 2% | 25% | 10% | 2.0% |
| Aggressive | 20% | 3% | 35% | 5% | 3.0% |
| Custom | Configurable | Configurable | Configurable | Configurable | Configurable |

## Position Grades

| Grade | Score Range | Description |
|-------|-----------|-------------|
| A+ | ≥ 90 | Exceptional opportunity |
| A | ≥ 75 | Strong opportunity |
| B | ≥ 55 | Good opportunity |
| C | ≥ 35 | Moderate opportunity |
| D | < 35 | Weak opportunity |

## Stop Loss Types

| Type | Description |
|------|-------------|
| Suggested | Fixed percentage based on risk |
| ATR-Based | Multiple of Average True Range |
| Volatility | Multiple of volatility |
| Trailing | Follows price (optional) |

## Position Sizing Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Elite Score | 30% | Opportunity quality |
| Confidence | 25% | Signal confidence |
| Risk | 20% | Inverse risk adjustment |
| Liquidity | 15% | Trading liquidity |
| Agreement | 10% | Multi-factor agreement |

## Risk Rules

- **Sector Exposure**: Max 25% per sector (configurable)
- **Correlation Limit**: Reduce positions with correlation > 0.7
- **Bear Market**: Reduce exposure by 30% in bear regimes
- **High Volatility**: Increase cash reserve by 50%
- **Concentration**: HHI-based concentration monitoring

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /position/calculate | Calculate position sizing |
| GET | /position/current | Get current result |
| GET | /position/report/{type} | Get report |
| GET | /position/exposure | Get portfolio exposure |
| GET | /position/cache/stats | Get cache statistics |
| POST | /position/cache/clear | Clear cache |

## Usage Example

```python
from modules.position_sizing_engine.services.service import PositionSizingService
from modules.position_sizing_engine.core.types import (
    PositionSizingRequest, PositionInput, InvestmentHorizon, RiskProfile
)

svc = PositionSizingService()
result = svc.calculate(PositionSizingRequest(
    reference_date="2024-01-01",
    horizon=InvestmentHorizon.MONTH_3,
    risk_profile=RiskProfile.BALANCED,
    total_capital=1000000,
    positions=[
        PositionInput(symbol="THYAO", sector="aviation", elite_score=85,
                      confidence=75, risk=30, liquidity=70, price=100),
    ],
))

for pos in result.positions:
    print(f"{pos.symbol}: {pos.recommended_pct:.1f}% ({pos.position_grade})")
```

## Explanations

Each position includes human-readable explanations:
- Why this allocation amount
- Why this risk level
- Why this stop-loss level
- Why this target price

## Dependencies

- Portfolio Construction Engine
- Elite Score Engine
- Confidence Engine
- Decision Engine
- Risk Engine
- Market Regime Engine
- Multi-Factor Engine
