# Explainability Engine

Enterprise-grade AI explanation system that explains every score, recommendation, and decision across all BIST Elite AI platform engines.

## Architecture

```
explainability_engine/
├── core/               # Types, enums, dataclasses, base ABC
├── evidence_mapper/    # Maps metrics → evidence objects
├── normalizer/         # Score normalization & conflict detection
├── builders/           # 9 explanation builders + orchestrator
├── templates/          # 88 templates (4 levels × 11 types × 2 languages)
├── localization/       # EN/TR translations (35+ keys)
├── validators/         # Input/output validation
├── cache/              # MD5 TTL + LRU cache
├── registry/           # Builder registry (singleton)
├── benchmark/          # Performance benchmarking
├── services/           # Service layer orchestration
├── schemas/            # 19 Pydantic v2 models
├── api/                # 10 FastAPI endpoints
└── tests/              # 231 tests
```

## Explanation Types (11)

| Type | Description |
|------|-------------|
| `fundamental` | PE/PB/PEG valuation, ROE/ROA, growth, financial health |
| `technical` | SMA crossover, RSI, MACD, ADX trend analysis |
| `volume` | Volume analysis, CMF, MFI, OBV trends |
| `pattern` | Classical/candlestick pattern detection |
| `smart_money` | OB, Breaker, FVG, BOS, CHoC detection |
| `opportunity` | Early opportunity stage/score explanation |
| `risk` | Volatility, drawdown, beta, VaR risk analysis |
| `historical_similarity` | Pattern matching with historical outcomes |
| `elite_score` | Comprehensive all-engine explanation |
| `market_regime` | Bull/bear/sideways regime explanation |
| `confidence` | Cross-engine conflict/confidence analysis |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/explainability/generate` | Generate single-type explanation |
| POST | `/api/v1/explainability/comprehensive` | Generate all-types comprehensive explanation |
| GET | `/api/v1/explainability/summary` | Quick summary with scores |
| GET | `/api/v1/explainability/history` | Explanation generation history |
| POST | `/api/v1/explainability/validate` | Validate explanation inputs |
| GET | `/api/v1/explainability/cache/stats` | Cache hit/miss statistics |
| POST | `/api/v1/explainability/cache/clear` | Clear explanation cache |
| POST | `/api/v1/explainability/benchmark` | Run performance benchmark |
| GET | `/api/v1/explainability/templates` | List all available templates |
| GET | `/api/v1/explainability/localization/keys` | List localization keys |

## Usage

```python
from modules.explainability_engine.services.service import ExplanationService
from modules.explainability_engine.schemas.schemas import GenerateExplanationRequest

service = ExplanationService()

# Single explanation
result = service.generate(GenerateExplanationRequest(
    symbol="TUPRS",
    metrics={"pe_ratio": 15.0, "rsi": 45.0, "volume_ratio": 1.2},
    explanation_type="fundamental",
    level="detailed",
    language="en",
))

# Comprehensive explanation (all types)
result = service.generate_comprehensive(GenerateComprehensiveRequest(
    symbol="TUPRS",
    metrics={"pe_ratio": 15.0, "rsi": 45.0, "volume_ratio": 1.2, "volatility": 25.0},
))

# Turkish language
result = service.generate(GenerateExplanationRequest(
    symbol="TUPRS",
    metrics={"pe_ratio": 15.0},
    explanation_type="fundamental",
    language="tr",
))
```

## Bilingual Support (EN/TR)

All explanations are available in English and Turkish. The localization service provides 35+ translation keys covering all explanation categories.

## Tests

```
pytest modules/explainability_engine/tests -v
```
