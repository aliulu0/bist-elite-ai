# Momentum Engine

Enterprise-grade momentum indicator calculation engine for BIST Elite AI.

## Features

- **10 Momentum Indicators**: RSI, Stochastic RSI, MACD, ADX, CCI, ROC, Momentum, Williams %R, TSI, Awesome Oscillator
- **Smoothing Calculators**: EMA, SMA, WMA, Wilder smoothing
- **Slope Analysis**: First/second derivatives, angle in degrees
- **Divergence Detection**: 4 divergence types (regular bull/bear, hidden bull/bear) with swing point detection
- **Signal Engine**: RSI/StochRSI/MACD/ADX/generic signal generators + aggregate scoring
- **Scoring Engine**: 5-component momentum score (momentum, trend, signal, strength, confidence + composite)
- **Caching**: MD5-based TTL cache with max-size eviction and statistics
- **Input Validation**: Price/period validation, NaN handling, missing data fill, division safety, benchmarking

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/momentum/indicators` | Available indicator types and defaults |
| POST | `/momentum/calculate` | Calculate single indicator with optional signals |
| POST | `/momentum/rsi` | Calculate RSI with overbought/oversold |
| POST | `/momentum/stoch-rsi` | Calculate Stochastic RSI with K/D lines |
| POST | `/momentum/macd` | Calculate MACD with line/signal/histogram |
| POST | `/momentum/adx` | Calculate ADX with +DI/-DI |
| POST | `/momentum/signals` | Generate trading signals for any indicator |
| POST | `/momentum/divergence` | Detect price-indicator divergence |
| GET | `/momentum/cache-stats` | Cache hit rate and eviction statistics |
| POST | `/momentum/benchmark` | Performance benchmark calculation |

## Architecture

```
modules/momentum_engine/
  core/           # Engine, registry, types, base plugin
  plugins/        # 10 indicator plugins (RSI, MACD, ADX, CCI, etc.)
  calculators/    # Smoothing, slope, divergence calculators
  signals/        # Signal engine, divergence engine, scoring engine
  cache/          # TTL cache with MD5 keys and stats
  validators/     # Input validation and data safety
  schemas/        # Pydantic request/response models
  services/       # Service layer orchestration
  api/            # FastAPI router
```

## Quick Start

```python
from modules.momentum_engine.core.engine import MomentumEngine
from modules.momentum_engine.core.registry import get_registry

engine = MomentumEngine()
for plugin in get_registry().values():
    engine.register_plugin(plugin)

result = engine.calculate("rsi", prices, period=14)
signals = engine.generate_signals("rsi", prices, period=14)
```

## Tests

```bash
python -m pytest backend/tests/momentum_engine/ -v
# 139 tests: engine, plugins, calculators, signals, cache, schemas, service, API
```
