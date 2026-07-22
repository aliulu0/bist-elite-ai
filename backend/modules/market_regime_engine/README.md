# Enterprise Market Regime Engine

Version: 2.0.0
Module: `backend/modules/market_regime_engine/`
Tests: 237 passed

## Overview

The Market Regime Engine automatically identifies the current market regime and makes it a first-class citizen throughout the platform. Every scoring engine, decision engine, risk engine, and strategy engine adapts according to the detected regime.

## Architecture

```
market_regime_engine/
    core/                   # Types, enums, dataclasses, helpers
    classification/         # Multi-signal regime classification
    detectors/              # 9 regime detection signal analyzers
    history/                # Regime history tracking and transitions
    validators/             # Request and result validation
    reports/                # 6 report types + full report
    registry/               # Singleton component registry
    cache/                  # TTL + LRU result caching
    benchmark/              # Performance benchmarking
    schemas/                # Pydantic v2 models
    services/               # Business logic orchestrator
    api/                    # REST API endpoints
    tests/                  # 237 tests
```

## Market Regimes

| Regime | Score Range | Strategy Profile |
|--------|-------------|-----------------|
| Strong Bull | 0.85 - 1.00 | Aggressive Growth |
| Bull | 0.70 - 0.84 | Moderate Growth |
| Weak Bull | 0.55 - 0.69 | Balanced |
| Sideways | 0.42 - 0.54 | Market Neutral |
| Weak Bear | 0.30 - 0.41 | Defensive |
| Bear | 0.15 - 0.29 | Very Defensive |
| Strong Bear | 0.00 - 0.14 | Very Defensive |
| Recovery | Special | Momentum |
| Distribution | Special | Defensive |
| Accumulation | Special | Mean Reversion |
| High Volatility | Special | Market Neutral |
| Low Volatility | Special | Moderate Growth |

## Detection Signals

| Signal | Weight | Description |
|--------|--------|-------------|
| Moving Average Structure | 1.5 | MA alignment (price > MA20 > MA50 > MA200) |
| Breadth Indicators | 1.3 | AD ratio, % above MA50, new highs/lows |
| Volatility | 1.2 | VIX-based, ATR percentage |
| Momentum | 1.4 | RSI, MACD histogram, ROC, Stochastic |
| Trend Strength | 1.3 | ADX, +DI/-DI directional analysis |
| Volume Expansion | 1.0 | Relative volume, OBV trend, CMF |
| Sector Rotation | 1.1 | Leading vs weak sector count |
| Liquidity | 0.8 | Bid-ask spread, market depth, turnover |
| Market Participation | 1.2 | AD%, % above 200MA, new highs, up volume |

## Regime Transitions

| From | To | Type |
|------|-----|------|
| Bull | Sideways | Distribution |
| Sideways | Bear | Breakdown |
| Bear | Recovery | Bottom formation |
| Recovery | Bull | Uptrend resumption |
| Accumulation | Breakout | New uptrend |
| Distribution | Downtrend | New downtrend |

## Sector Analysis

| Strength | Criteria |
|----------|----------|
| Leading | Performance > 5% AND Momentum > 10% |
| Weak | Performance < -5% AND Momentum < -10% |
| Neutral | Performance between -2% and 2% |
| Rotating | Other cases |

## Investment Horizons

| Horizon | Lookback | Description |
|---------|----------|-------------|
| Weekly | 5 days | Short-term regime |
| 1 Month | 21 days | Medium-term regime |
| 3 Months | 63 days | Standard regime |
| 6 Months | 126 days | Long-term regime |
| 12 Months | 252 days | Secular regime |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /market-regime/analyze | Run regime analysis |
| GET | /market-regime/current | Get current regime |
| GET | /market-regime/history | Get regime history |
| GET | /market-regime/sectors | Get sector analysis |
| GET | /market-regime/transitions | Get transition probabilities |
| GET | /market-regime/report/{type} | Get regime report |
| GET | /market-regime/cache/stats | Get cache statistics |
| POST | /market-regime/cache/clear | Clear cache |

## Usage Example

```python
from modules.market_regime_engine.services.service import MarketRegimeService
from modules.market_regime_engine.core.types import (
    RegimeAnalysisRequest, DetectionSignal, InvestmentHorizon
)

svc = MarketRegimeService()
result = svc.analyze(RegimeAnalysisRequest(
    reference_date="2024-01-01",
    horizon=InvestmentHorizon.MONTH_3,
    signals=list(DetectionSignal),
    market_data={
        "price": 105.0, "ma20": 100.0, "ma50": 95.0, "ma200": 90.0,
        "rsi": 60.0, "adx": 30.0, "vix": 18.0,
        "advance_decline_ratio": 1.3, "pct_above_ma50": 65.0,
    },
))

print(f"Regime: {result.classification.regime.value}")
print(f"Confidence: {result.classification.confidence}")
print(f"Strategy: {result.strategy_profile.value}")
```

## Risk Levels

| Regime | Risk Level | Position Sizing |
|--------|-----------|----------------|
| Strong Bull | 0.20 | Increase |
| Bull | 0.30 | Standard |
| Weak Bull | 0.40 | Standard |
| Sideways | 0.50 | Standard |
| Weak Bear | 0.60 | Reduce |
| Bear | 0.80 | Reduce |
| Strong Bear | 0.95 | Reduce |
| High Volatility | 0.80 | Reduce |
| Low Volatility | 0.30 | Standard |

## Dependencies

- Financial Engine
- Indicator Engine
- Momentum Engine
- Trend Engine
- Volume Engine
- Strategy Engine
- Scoring Engine
