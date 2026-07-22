# Enterprise Multi-Factor Analysis Engine

Version: 2.1.0
Module: `backend/modules/multi_factor_engine/`
Tests: 340 passed

## Overview

The Multi-Factor Analysis Engine evaluates every stock using multiple independent investment factors. Each factor is scored independently (0-100), grouped into 12 factor categories, and combined into a comprehensive factor profile with dynamic weight adaptation.

## Architecture

```
multi_factor_engine/
    core/                   # Types, enums, factor definitions, dataclasses
    factors/                # 12 factor group calculators
    ranking/                # Factor ranking engine
    validators/             # Request/result validation
    profiles/               # Factor profile generation
    registry/               # Singleton component registry
    cache/                  # TTL + LRU result caching
    benchmark/              # Performance benchmarking
    schemas/                # Pydantic v2 models
    services/               # Business logic orchestrator
    api/                    # REST API endpoints
    tests/                  # 340 tests
```

## Factor Groups

| Group | Weight | Factors |
|-------|--------|---------|
| Value | 1.2 | PD/DD, P/CF, F/PE, PEG, EV, Sector Relative |
| Growth | 1.1 | Revenue, Net Profit, EBITDA, EPS, Cash Flow Growth |
| Quality | 1.0 | ROE, ROA, Gross/Operating/Net Margin, Piotroski, Altman Z |
| Momentum | 1.0 | RSI, MACD, ADX, ROC, Relative Strength |
| Trend | 0.9 | SMA, EMA, Golden Cross, SuperTrend, Ichimoku |
| Risk | 0.8 | Volatility, Beta, Max Drawdown, Liquidity Risk |
| Smart Money | 0.9 | OBV, CMF, Relative Volume, Volume Spike, Institutional |
| Profitability | 1.0 | Gross Profit Margin, Operating Profitability, Net Margin, ROE, ROA |
| Efficiency | 0.7 | Asset/Inventory/Receivable Turnover |
| Financial Strength | 0.8 | Current Ratio, D/E, Interest Coverage, FCF Yield |
| Technical Strength | 1.0 | RSI, ADX, SMA, EMA, ATR, Bollinger, VWAP |
| Liquidity | 0.7 | Depth of Market, Bid-Ask Spread, Relative Volume, Liquidity Risk |

## Dynamic Weights

Weights adapt based on:

**Investment Horizon:**
- Weekly → Momentum ×1.5, Trend ×1.3, Value ×0.5
- Month 3 → Balanced (all ×1.0-1.1)
- Month 12 → Value ×1.3, Growth ×1.3, Momentum ×0.6

**Market Regime:**
- Strong Bull → Momentum ×1.3, Growth ×1.2, Risk ×0.7
- Bear → Quality ×1.3, Financial Strength ×1.2, Momentum ×0.6
- High Volatility → Risk ×1.4, Liquidity ×1.3, Momentum ×0.7

## Score Strength

| Range | Label |
|-------|-------|
| 80-100 | Very Strong |
| 60-79 | Strong |
| 40-59 | Neutral |
| 20-39 | Weak |
| 0-19 | Very Weak |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /factors/analyze | Analyze factors for a stock |
| GET | /factors/list | List all factor groups and factors |
| GET | /factors/details/{group} | Get details for a factor group |
| GET | /factors/history/{symbol} | Get analysis history |
| GET | /factors/cache/stats | Get cache statistics |
| POST | /factors/cache/clear | Clear cache |
| GET | /factors/report/{type} | Generate report (full/summary/breakdown/ranking/comparison/regime) |

## Usage Example

```python
from modules.multi_factor_engine.services.service import MultiFactorService
from modules.multi_factor_engine.core.types import (
    FactorAnalysisRequest, InvestmentHorizon, MarketRegime
)

svc = MultiFactorService()
result = svc.analyze(FactorAnalysisRequest(
    symbol="THYAO",
    reference_date="2024-01-01",
    horizon=InvestmentHorizon.MONTH_3,
    regime=MarketRegime.BULL,
    market_data={"price": 105.0, "bid_ask_spread": 0.005},
    financial_data={"roe": 18.0, "forward_pe": 12.0, "revenue_growth": 15.0},
    indicator_data={"rsi": 55.0, "adx": 28.0, "ma20": 100.0, "ma50": 95.0},
))

print(f"Overall: {result.profile.overall_score:.1f}")
print(f"Strengths: {result.profile.strengths}")
print(f"Weaknesses: {result.profile.weaknesses}")
```

## Radar Profile

The profile generates radar chart data:
```json
{
    "value": 72.5,
    "growth": 68.3,
    "quality": 75.1,
    "momentum": 61.2,
    "trend": 58.7,
    "risk": 55.0,
    "smart_money": 63.4,
    "profitability": 71.8,
    "efficiency": 52.3,
    "financial_strength": 65.0,
    "technical_strength": 59.2,
    "liquidity": 54.1
}
```

## Dependencies

- Financial Engine
- Indicator Engine
- Trend Engine
- Volume Engine
- Risk Engine
- Similarity Engine
- Market Regime Engine
