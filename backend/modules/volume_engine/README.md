# Volume & Smart Money Engine

**Version: 0.7.0**

Enterprise-grade volume analysis and smart money detection engine for BIST Elite AI.

## Features

### 12 Volume Indicators
- **OBV** - On Balance Volume
- **CMF** - Chaikin Money Flow
- **MFI** - Money Flow Index
- **VWAP** - Volume Weighted Average Price
- **RVOL** - Relative Volume
- **ADL** - Accumulation Distribution Line
- **Chaikin** - Chaikin Oscillator
- **Volume Oscillator** - Fast/Slow volume SMA comparison
- **EoM** - Ease of Movement
- **Force Index** - Force Index
- **NVI** - Negative Volume Index
- **PVI** - Positive Volume Index

### Smart Money Detection
- Institutional accumulation/distribution
- Hidden buying/selling
- Silent accumulation
- Volume spike detection
- Volume absorption

### Liquidity Analysis
- Liquidity scoring
- Turnover analysis
- Spread analysis
- Trade activity measurement
- Market participation

## Usage

```python
from modules.volume_engine.services.volume_service import VolumeService
from modules.volume_engine.schemas.volume_schemas import PriceBarSchema

service = VolumeService()

# Calculate an indicator
result = service.calculate("obv", [
    PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=100, volume=1000),
    # ... more bars
])
print(result.current_value, result.trend)

# Get signals
signals = service.get_signals("cmf", prices)

# Smart money detection
sm = service.detect_smart_money("obv", prices)
print(sm.detection_type, sm.confidence)

# Liquidity analysis
liq = service.analyze_liquidity(prices)
print(liq.liquidity_score, liq.market_participation)

# Institutional score
score = service.get_institutional_score(prices)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/volume/indicators` | List all available indicators |
| POST | `/volume/calculate` | Calculate any indicator |
| POST | `/volume/obv` | Calculate OBV |
| POST | `/volume/cmf` | Calculate CMF |
| POST | `/volume/mfi` | Calculate MFI |
| POST | `/volume/vwap` | Calculate VWAP |
| POST | `/volume/rvol` | Calculate RVOL |
| POST | `/volume/liquidity` | Liquidity analysis |
| POST | `/volume/smart-money` | Smart money detection |
| GET | `/volume/signals/{indicator}` | Get signals |
| GET | `/volume/cache-stats` | Cache statistics |
| POST | `/volume/benchmark` | Performance benchmark |

## Architecture

```
modules/volume_engine/
├── core/           # Engine, types, base plugin, registry
├── plugins/        # 12 indicator plugins
├── calculators/    # VolumeCalculator (SMA, EMA, VWAP, etc.)
├── signals/        # Signal engine + scoring engine
├── smart_money/    # Smart money detector
├── liquidity/      # Liquidity engine
├── cache/          # TTL cache with MD5 keys
├── validators/     # Input validation + benchmarking
├── schemas/        # Pydantic request/response models
├── services/       # Service layer orchestration
└── api/            # FastAPI router
```
