# Pattern Recognition Engine

Enterprise-grade chart pattern detection module for BIST Elite AI.

## Overview

Detects 60+ trading patterns across 5 categories with confidence scoring, trade setup generation, and real-time analysis.

## Pattern Categories

### Classical (18 patterns)
Cup & Handle, Double/Triple Bottom/Top, Ascending/Descending/Symmetrical Triangle, Bull/Bear Flag, Pennant, Rectangle, Channel Up/Down, Falling/Rising Wedge, Diamond, Megaphone

### Candlestick (18 patterns)
Hammer, Inverted Hammer, Doji, Dragonfly/Gravestone Doji, Morning/Evening Star, Bullish/Bearish Engulfing, Harami, Piercing Pattern, Dark Cloud Cover, Three White Soldiers/Black Crows, Shooting Star, Hanging Man, Tweezer Top/Bottom

### Smart Money Concepts (13 patterns)
Break of Structure (BOS), Change of Character (CHoC), Order Block, Breaker Block, Mitigation Block, Fair Value Gap, Liquidity Grab/Sweep, Equal Highs/Lows, Premium/Discount Zone, Inducement

### Wyckoff (10 patterns)
Accumulation, Distribution, Spring, Upthrust, Automatic Rally, Secondary Test, Sign of Strength/Weakness, Last Point of Support/Supply

### Elliott Wave (stub)
Stub implementation with feature flag (`enable_elliott=True`). Full wave counting not yet available.

## Architecture

```
pattern_engine/
  core/          types.py (enums, dataclasses), base.py (BasePatternPlugin ABC)
  analysis/      SwingDetector, SupportResistance, TrendLineCalculator, BodyCalculator
  classical/     18 classical pattern plugins
  candlestick/   18 candlestick pattern plugins
  smc/           13 SMC pattern plugins
  wyckoff/       10 Wyckoff pattern plugins
  elliott/       1 stub plugin
  registry/      PatternRegistry (plugin registration, detect_all)
  cache/         PatternCache (MD5 TTL cache)
  validators/    PatternValidator (price/category/param validation)
  similarity/    PatternSimilarityEngine (cosine similarity)
  schemas/       Pydantic v2 request/response models
  services/      PatternService (orchestration layer)
  api/           FastAPI router (11 endpoints)
  tests/         336 tests
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/patterns/detect` | Detect all patterns for a symbol |
| POST | `/api/v1/patterns/classical` | Classical pattern detection only |
| POST | `/api/v1/patterns/candlestick` | Candlestick pattern detection only |
| POST | `/api/v1/patterns/smc` | SMC pattern detection only |
| POST | `/api/v1/patterns/wyckoff` | Wyckoff pattern detection only |
| GET | `/api/v1/patterns/list` | List all registered pattern plugins |
| GET | `/api/v1/patterns/plugin/{name}` | Get plugin parameters |
| POST | `/api/v1/patterns/validate` | Validate price data |
| POST | `/api/v1/patterns/history` | Historical pattern analysis |

## Usage

```python
from modules.pattern_engine.services.pattern_service import PatternService
from modules.pattern_engine.core.types import PriceBar

service = PatternService()
bars = [PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100)]

analysis = service.detect(bars, category="classical")
print(f"Found {analysis.total_patterns} patterns")
print(f"Dominant direction: {analysis.dominant_direction.value}")
```
