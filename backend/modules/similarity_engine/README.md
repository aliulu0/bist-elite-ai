# Enterprise Historical Similarity Engine

Version: 1.9.0
Module: `backend/modules/similarity_engine/`
Tests: 225 passed

## Overview

The Historical Similarity Engine identifies stocks and market conditions that are statistically similar to the current stock under analysis. The objective is not only to find similar prices — it is to find similar investment opportunities. Every similarity result is explainable.

## Architecture

```
similarity_engine/
    core/                   # Types, enums, dataclasses, distance functions
    feature_store/          # Feature vector storage and indexing
    similarity_models/      # 6 similarity computation methods
    ranking/                # Multi-criteria ranking engine
    timeline/               # Historical timeline and outcome analysis
    validators/             # Request and result validation
    reports/                # 6 report types + full report
    registry/               # Singleton component registry
    cache/                  # TTL + LRU result caching
    benchmark/              # Performance benchmarking
    schemas/                # Pydantic v2 models
    services/               # Business logic orchestrator
    api/                    # REST API endpoints
    tests/                  # 225 tests
```

## Similarity Methods

| Method | Description |
|--------|-------------|
| Weighted Feature | Normalized feature comparison with configurable weights |
| Cosine | Cosine similarity between feature vectors |
| Euclidean | Weighted Euclidean distance, normalized to [0,1] |
| Manhattan | Weighted Manhattan distance, normalized to [0,1] |
| Dynamic Time Warping | DTW for non-aligned feature sequences |
| Hybrid | Weighted combination of Cosine + Euclidean + Manhattan |

## Feature Categories

| Category | Features |
|----------|----------|
| Financial | PE Ratio, PB Ratio, Debt Ratio, Current Ratio, ROE, ROA |
| Growth | Revenue Growth, Earnings Growth, Dividend Growth |
| Profitability | ROE, ROA, Profit Margin, Gross Margin |
| Valuation | PE, PB, PS, EV/EBITDA, PEG Ratio |
| Momentum | RSI, MACD, Stochastic, CCI, Williams %R |
| Trend | MA, EMA, ADX, Aroon, Ichimoku Cloud |
| Volume | OBV, CMF, Volume SMA, Relative Volume, MFI |
| Pattern | Pattern Confidence, Breakout Status, Support/Resistance |

## Similarity Labels

| Label | Score Range |
|-------|-------------|
| Very Weak | 0.0 - 0.19 |
| Weak | 0.20 - 0.39 |
| Moderate | 0.40 - 0.59 |
| Strong | 0.60 - 0.79 |
| Very Strong | 0.80 - 0.89 |
| Exceptional | 0.90 - 1.00 |

## Pattern Memory

Stores historical cases classified as:
- **Successful**: Average return > 2%
- **Failed**: Average return < -2%
- **Neutral**: Average return between -2% and 2%

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /similarity/analyze | Run similarity analysis |
| GET | /similarity/list | List all similarity results |
| GET | /similarity/top | Get top similar stocks for symbol |
| GET | /similarity/details | Get detailed analysis for symbol |
| GET | /similarity/history | Get analysis history |
| GET | /similarity/report/{symbol} | Get similarity report |
| GET | /similarity/cache/stats | Get cache statistics |
| POST | /similarity/cache/clear | Clear similarity cache |

## Usage Example

```python
from modules.similarity_engine.services.service import SimilarityEngineService
from modules.similarity_engine.core.types import SimilarityRequest, SimilarityMethod

svc = SimilarityEngineService()
analysis = svc.analyze(SimilarityRequest(
    symbol="THYAO",
    reference_date="2024-01-01",
    top_n=5,
    methods=[SimilarityMethod.WEIGHTED_FEATURE, SimilarityMethod.COSINE],
    min_similarity=0.3,
))

for r in analysis.top_similar_stocks:
    print(f"{r.target_symbol}: {r.similarity_score:.4f} ({r.similarity_label.value})")
```

## Validation Periods

| Period | Trading Days |
|--------|-------------|
| 1 Week | 5 |
| 1 Month | 21 |
| 3 Months | 63 |
| 6 Months | 126 |
| 12 Months | 252 |

## Report Types

- **Executive Summary**: Top similar stocks, confidence score, regime distribution
- **Top Similar Stocks**: Ranked list with contributing features
- **Performance Comparison**: Period returns, drawdowns, win rates
- **Similarity Heatmap**: Symbol × Date similarity matrix
- **Feature Comparison**: Average/min/max feature distances
- **Risk Comparison**: Drawdown, win rate, regime, pattern outcome

## Dependencies

- Financial Engine
- Indicator Engine
- Momentum Engine
- Trend Engine
- Volume Engine
- Pattern Engine
- Strategy Engine
- Elite Score Engine
- Confidence Engine
- Decision Engine
