# Elite Score Engine

The flagship scoring algorithm of the BIST Elite AI platform. Identifies stocks with the highest probability of becoming future outperformers before they are fully priced by the market.

**Always uses the Unified Scoring Engine. Never calculates scores independently.**

## Architecture

```
elite_score_engine/
├── core/               # Types, enums, dataclasses (17 dimensions, 7 categories)
├── weights/            # Profiles, horizon, regime, sector adjustments
├── profiles/           # Profile manager (3 defaults + custom)
├── calculators/        # Elite calculator, trend tracker, bonus/penalty engine
├── ranking/            # Daily/Weekly/Monthly rankings, sector rankings
├── validators/         # Input/output validation
├── registry/           # Calculator registry (singleton)
├── cache/              # MD5 TTL + LRU cache
├── benchmark/          # Performance benchmarking
├── services/           # Service layer orchestration
├── schemas/            # 17 Pydantic v2 models
├── api/                # 13 FastAPI endpoints
└── tests/              # 280 tests
```

## Elite Categories

| Range | Category | Description |
|-------|----------|-------------|
| 0-20 | Avoid | Weak fundamentals and technicals |
| 21-40 | Weak | Below average, requires caution |
| 41-60 | Watch | Neutral, worth monitoring |
| 61-75 | Good | Above average with positive signals |
| 76-89 | Strong | High quality with multiple confirmations |
| 90-95 | Elite | Institutional-grade signals |
| 96-100 | Exceptional | Rare, extreme conviction signals |

## Elite Labels

| Label | Condition |
|-------|-----------|
| High Conviction | Score ≥ 90 + ≥ 2 bonuses |
| Breakout Candidate | Score ≥ 76 + Early Breakout bonus |
| Undervalued | Score ≥ 61 + Low Valuation bonus |
| Early Opportunity | Score ≥ 61 (no special bonus) |
| Watchlist | 30-60, few penalties |
| High Risk | Score < 30 or ≥ 3 penalties |

## 17 Scoring Dimensions

Financial Quality, Valuation, Growth, Profitability, Technical Structure, Trend Quality, Momentum, Volume, Liquidity, Smart Money, Pattern Quality, Risk, Sector Strength, Market Regime, Timing, Historical Similarity, Confidence

## 3 Weight Profiles

| Profile | Focus |
|---------|-------|
| Conservative | Financial quality, risk control, low valuation |
| Balanced | Even distribution across all 17 dimensions |
| Aggressive | Momentum, technical signals, smart money |

## Dynamic Adjustments

- **5 Investment Horizons**: Weekly → 12 Months (each with independent multipliers)
- **5 Market Regimes**: Bull/Bear/Sideways/High Vol/Low Vol
- **12 Sector Profiles**: Banks, Holdings, Industrials, Technology, Energy, Retail, etc.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/elite-score/calculate` | Calculate elite score for one stock |
| POST | `/api/v1/elite-score/list` | Calculate for multiple stocks |
| GET | `/api/v1/elite-score/top` | Get top N elite scores |
| GET | `/api/v1/elite-score/details` | Detailed breakdown for symbol |
| GET | `/api/v1/elite-score/history` | Score history |
| GET | `/api/v1/elite-score/ranking` | Full ranking |
| GET | `/api/v1/elite-score/profiles` | Available profiles |
| GET | `/api/v1/elite-score/weights` | Weight configuration |
| POST | `/api/v1/elite-score/validate` | Validate inputs |
| GET | `/api/v1/elite-score/cache/stats` | Cache statistics |
| POST | `/api/v1/elite-score/cache/clear` | Clear cache |
| POST | `/api/v1/elite-score/benchmark` | Run benchmark |

## Usage

```python
from modules.elite_score_engine.services.service import EliteScoreService
from modules.elite_score_engine.core.types import EliteCalculationRequest, InvestmentHorizon, MarketRegime

service = EliteScoreService()

result = service.calculate(EliteCalculationRequest(
    symbol="TUPRS",
    scores={"financial": 70.0, "momentum": 65.0, "technical": 60.0},
    profile_name="balanced",
    horizon=InvestmentHorizon.ONE_MONTH,
    regime=MarketRegime.SIDEWAYS,
))
# result.elite_score = 72.5
# result.elite_category = EliteCategory.GOOD
# result.label = EliteLabel.EARLY_OPPORTUNITY
```

## Tests

```
pytest modules/elite_score_engine/tests -v
```
