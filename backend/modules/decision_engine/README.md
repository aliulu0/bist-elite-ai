# Enterprise Decision Engine (EDE)

> Sprint 4, Prompt 20 — The final intelligence layer of the BIST Elite AI platform.

## Overview

The Enterprise Decision Engine combines outputs from **all input engines** into one final investment decision. No investment recommendation bypasses this engine. Every decision is explainable, evidence-based, and includes uncertainty quantification.

## Architecture

```
Engine Outputs (12 sources)
    ↓
EngineOutputCollector — gather & organize
    ↓
OutputValidator — validate consistency
    ↓
ConflictDetector — detect contradictions
    ↓
DecisionRuleEngine — apply bonus/penalty rules
    ↓
ConfidenceCalculator — compute decision confidence
    ↓
RecommendationGenerator — entry/exit guidance + horizon recs
    ↓
PackageBuilder — assemble RecommendationPackage
    ↓
DecisionResult
```

## Decision Types

| Score Range | Decision |
|-------------|----------|
| 90-100 | Strong Buy |
| 80-89 | Buy |
| 70-79 | Early Accumulation |
| 60-69 | Accumulate |
| 50-59 | Watch |
| 40-49 | Wait For Confirmation |
| 30-39 | Neutral |
| 20-29 | Reduce |
| 10-19 | Take Profit |
| 5-9 | Avoid |
| 0-4 | Distribution Risk |

## 13 Decision Dimensions

Financial Quality, Valuation, Growth, Technical Trend, Momentum, Smart Money, Pattern Quality, Risk, Sector Strength, Market Regime, Liquidity, Confidence, Historical Similarity

## Input Engines

- Unified Scoring Engine
- Elite Score Engine
- Confidence Engine
- Early Opportunity Engine
- Evidence Engine
- Explainability Engine
- Risk Engine
- Financial Engine
- Pattern Engine
- Strategy Engine
- Similarity Engine
- Market Regime Engine

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/decision/generate` | Generate decision for a symbol |
| GET | `/decision/list` | List all decisions |
| GET | `/decision/top?count=10` | Top decisions by score |
| GET | `/decision/details/{symbol}` | Full recommendation package |
| GET | `/decision/history/{symbol}` | Decision history for symbol |
| POST | `/decision/report` | Generate report (executive/detailed/evidence/risk/timeline) |
| POST | `/decision/benchmark` | Run performance benchmark |
| GET | `/decision/cache/stats` | Cache statistics |
| POST | `/decision/cache/clear` | Clear cache |
| GET | `/decision/health` | Health check |

## Decision Profiles

- **Conservative**: Risk tolerance 30%, prioritizes financial quality and risk management
- **Balanced**: Risk tolerance 50%, even distribution across dimensions
- **Aggressive**: Risk tolerance 75%, prioritizes momentum, growth, and opportunity detection

## Key Features

- **Conflict Detection**: Identifies contradictions between dimensions (e.g., high confidence + weak technical trend)
- **Entry/Exit Guidance**: Immediate entry, wait pullback, wait breakout, scale in, no entry
- **Horizon Recommendations**: Separate recommendations for Weekly, 1M, 3M, 6M, 12M horizons
- **Portfolio Impact**: Position sizing, sector concentration, diversification effect, overlap detection
- **Report Generation**: Executive, detailed, evidence, risk analysis, timeline reports
- **Caching**: MD5 TTL + LRU cache for fast repeated queries

## Tests

```bash
python -m pytest modules/decision_engine/tests -v
```

226 tests covering types, pipeline, recommendations, profiles, registry, cache, benchmark, schemas, service, and API.
