# Moving Average Engine

Enterprise-grade moving average calculation engine for BIST Elite AI.

## Features

- **6 MA Types**: SMA, EMA, WMA, HMA, SMMA, VWMA
- **Slope Analysis**: First/second derivatives, angle, acceleration detection
- **Distance Calculator**: Price-to-MA distance, MA-to-MA distance
- **Cross Detection**: Golden/death crosses with strength, confirmation, false-cross filtering
- **Proximity Engine**: Crossover estimation and probability scoring
- **Smart Signals**: Early bullish/bearish, trend exhaustion, pullback, continuation
- **Trend Analysis**: Direction, strength, age, stability scoring
- **Scoring Engine**: 5-component composite score (trend, momentum, cross, acceleration, MA)
- **Timeframe Management**: 7 timeframes (5m monthly), higher/lower/alignment
- **Input Validation**: Period/price validation, missing data interpolation, benchmarking

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/moving-average/types` | Available MA types and default periods |
| POST | `/moving-average/calculate` | Calculate single MA with optional indicators |
| POST | `/moving-average/calculate-multiple` | Calculate multiple periods at once |
| POST | `/moving-average/crossovers` | Detect crosses between fast/slow MAs |
| GET | `/moving-average/timeframes` | Timeframe hierarchy and alignment |
| POST | `/moving-average/validate` | Validate inputs before calculation |

## Architecture

```
modules/moving_average/
  core/           # Engine, registry, types
  plugins/        # 6 MA calculation plugins (SMA, EMA, WMA, HMA, SMMA, VWMA)
  calculators/    # Slope and distance calculators
  signals/        # Cross detection, proximity, smart signals
  trend/          # Trend analysis
  scoring/        # Composite scoring engine
  timeframes/     # Timeframe management
  validators/     # Input validation and data handling
  schemas/        # Pydantic request/response models
  services/       # Business logic orchestration
  api/            # FastAPI router
```

## Usage

```python
from modules.moving_average.services.ma_service import MAService
from modules.moving_average.schemas.ma_schemas import PriceBarSchema

service = MAService()

# Calculate SMA with all indicators
result = service.calculate(
    ma_type="sma",
    period=20,
    prices=[PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000)],
    include_slope=True,
    include_trend=True,
    include_scores=True,
)

# Detect crossover
crossover = service.calculate_crossovers("sma", fast_period=5, slow_period=20, prices=bars)

# Validate inputs
validation = service.validate("sma", period=20, prices=bars)
```

## Tests

```bash
python -m pytest tests/moving_average/ -v
```

182 tests covering all engine components, plugins, calculators, signals, scoring, timeframes, validators, schemas, service layer, and API endpoints.
