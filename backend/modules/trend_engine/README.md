# Trend Engine

Enterprise-grade trend identification and analysis engine for BIST Elite AI.

## Features

- **8 Trend Indicators**: SuperTrend, Ichimoku Cloud, Donchian Channel, Parabolic SAR, Bollinger Bands, Keltner Channel, MA Envelope, Linear Regression Trend
- **Trend Analysis**: Primary/secondary/micro trend, phase (emerging→strengthening→mature→exhausting→reversing), strength, age, stability
- **Breakout Detection**: Resistance breakout, support breakdown, fake breakout/false breakdown detection with confirmation
- **Pullback Detection**: Healthy/weak/deep pullback classification with trend resumption analysis
- **Trend Scoring**: 5-component composite score (trend, breakout, continuation, reversal, confidence)
- **Signal Engine**: Indicator-specific signal generators (SuperTrend flip, Ichimoku cloud, Bollinger bands, etc.)
- **Caching**: MD5-based TTL cache with max-size LRU eviction and statistics
- **Input Validation**: Price/period validation, NaN handling, missing data fill, benchmarking

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/trend/indicators` | Available indicator types and defaults |
| POST | `/trend/calculate` | Calculate single indicator with optional analysis |
| GET | `/trend/supertrend` | SuperTrend (redirects to POST) |
| GET | `/trend/ichimoku` | Ichimoku Cloud (redirects to POST) |
| GET | `/trend/bollinger` | Bollinger Bands (redirects to POST) |
| GET | `/trend/donchian` | Donchian Channel (redirects to POST) |
| GET | `/trend/parabolic` | Parabolic SAR (redirects to POST) |
| GET | `/trend/signals/{indicator}` | Signals for indicator (redirects to POST) |
| GET | `/trend/breakout` | Breakout analysis (redirects to POST) |
| GET | `/trend/cache-stats` | Cache hit rate and eviction statistics |
| POST | `/trend/benchmark` | Performance benchmark calculation |

## Architecture

```
modules/trend_engine/
  core/           # Engine, registry, types, base plugin
  plugins/        # 8 trend indicator plugins
  calculators/    # Trend, breakout, pullback calculators
  signals/        # Trend signals, breakout/pullback engines, scoring
  cache/          # TTL cache with MD5 keys and stats
  validators/     # Input validation and data safety
  schemas/        # Pydantic request/response models
  services/       # Service layer orchestration
  api/            # FastAPI router
```

## Quick Start

```python
from modules.trend_engine.core.engine import TrendEngine
from modules.trend_engine.core.registry import get_registry

engine = TrendEngine()
for plugin in get_registry().values():
    engine.register_plugin(plugin)

# Calculate indicator
result = engine.calculate("supertrend", prices, period=10)

# Analyze trend
trend = engine.analyze_trend(prices, result)
print(f"Primary: {trend.primary_trend}, Phase: {trend.phase}")

# Generate signals
signals = engine.get_plugin("supertrend").signals(result)
```

## Indicator Details

| Indicator | Key Outputs |
|-----------|-------------|
| **SuperTrend** | Trend direction, stop level, flip detection |
| **Ichimoku** | Tenkan/Kijun/Senkou spans, cloud thickness/direction |
| **Donchian** | Upper/middle/lower channel, breakout/breakdown |
| **Parabolic SAR** | Trend, stop level, acceleration factor |
| **Bollinger** | Bands, bandwidth, squeeze detection |
| **Keltner** | Upper/middle/lower, squeeze detection |
| **MA Envelope** | Upper/lower envelopes, deviation |
| **Linear Regression** | Trend line, R², slope |

## Tests

```bash
python -m pytest backend/tests/trend_engine/ -v
# 180 tests: engine, plugins, calculators, signals, cache, schemas, service, API
```
