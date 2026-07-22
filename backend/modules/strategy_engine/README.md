# Strategy Engine

Enterprise-grade Strategy Engine for BIST Elite AI. Orchestrates all analysis engines into executable investment strategies with a rule-based evaluation framework.

## Architecture

```
backend/modules/strategy_engine/
├── api/                    # FastAPI router (9 endpoints)
│   └── router.py
├── builders/               # Fluent strategy builder
│   └── strategy_builder.py
├── cache/                  # Result caching (MD5 TTL + LRU)
│   └── strategy_cache.py
├── core/                   # Types, base class
│   ├── base.py             # BaseStrategy ABC
│   └── types.py            # Enums + dataclasses
├── executors/              # Strategy execution engine
│   └── strategy_executor.py
├── registry/               # Strategy discovery & registration
│   └── strategy_registry.py
├── rules/                  # Rule framework (9 rule types)
│   ├── rule_engine.py      # Rule evaluation (AND/OR/NOT/XOR + nested)
│   ├── financial_rules.py  # PE, PB, ROE, ROA, D/E, dividend, growth
│   ├── technical_rules.py  # RSI, MACD, SMA, Bollinger, ATR, ADX
│   ├── volume_rules.py     # OBV, CMF, MFI, relative volume, VWAP
│   ├── pattern_rules.py    # Classical, candlestick, SMC, Wyckoff
│   ├── smc_rules.py        # Order blocks, FVG, liquidity, BOS
│   ├── risk_rules.py       # Drawdown, volatility, Sharpe, Sortino, VaR
│   ├── market_rules.py     # Sector, market cap, SMA, relative strength
│   ├── time_rules.py       # Trading hours, holding period
│   └── custom_rules.py     # User-defined metric comparisons
├── schemas/                # Pydantic v2 request/response models
│   └── strategy_schemas.py
├── services/               # Service layer
│   └── strategy_service.py
├── signals/                # Signal generation & ranking
│   └── signal_generator.py
├── templates/              # 11 built-in strategy templates
│   └── builtin_templates.py
└── validators/             # Input & definition validation
    └── strategy_validator.py
```

## Built-in Strategies

| Strategy | Type | Description |
|---|---|---|
| Early Opportunity | early_opportunity | Detects undervalued stocks before market pricing adjusts |
| Value Investing | value | Fundamental value with strong balance sheets |
| Growth Investing | growth | High-growth companies with earnings momentum |
| Momentum Investing | momentum | Strong price momentum with trend confirmation |
| Breakout | breakout | Breakout from consolidation with volume confirmation |
| Swing Trading | swing | Short-term reversals at support/resistance |
| Trend Following | trend_following | Follows established trends with MA confirmation |
| Smart Money | smart_money | Institutional order flow via SMC concepts |
| Dividend Growth | dividend_growth | Consistent growing dividends with strong fundamentals |
| Low Risk | low_risk | Conservative capital preservation with strict risk controls |
| High Conviction | high_conviction | Multi-factor alignment for highest-conviction signals |

## Rule Types

- **Financial**: PE, PB, ROE, ROA, Debt/Equity, Dividend Yield, Earnings Growth, Revenue Growth, Current Ratio, Net Margin, P/S, PEG, Free Cash Flow
- **Technical**: RSI, MACD, SMA crossover, Bollinger bounce, ATR breakout, ADX, Stochastic, CCI, Williams %R, Momentum
- **Volume**: Volume spike, OBV trend, CMF, MFI, Relative Volume, VWAP, NVI
- **Pattern**: Classical patterns, Candlestick patterns, Hammer, Engulfing, Morning Star, Double Bottom/Top, etc.
- **Smart Money**: Order Block, Breaker Block, FVG, Liquidity Sweep, BOS, CHoC, Discount Zone, Mitigation
- **Risk**: Max Drawdown, Volatility, Sharpe Ratio, Beta, VaR, Sortino Ratio
- **Market**: Sector outperformance, Market Cap, SMA position, Relative Strength, Volume
- **Time**: Trading hours, Holding period, Month-end avoidance
- **Custom**: Any metric with comparison operators

## Rule Operators

- `AND` - All rules in group must pass
- `OR` - At least one rule must pass
- `XOR` - Exactly one rule must pass
- `NOT` - Negate group result
- **Nested Groups** - Unlimited nesting depth

## Rule Parameters

Every rule supports:
- `weight` (float) - Importance weight for scoring
- `priority` (int) - Execution priority
- `tolerance` (float) - Equality tolerance
- `confidence` (float) - Base confidence when rule passes [0-1]
- `timeframe` (str) - Multi-timeframe support (5m, 15m, 1h, 4h, 1d, 1w, 1m)

## Strategy Builder (Fluent API)

```python
from modules.strategy_engine.builders.strategy_builder import StrategyBuilder
from modules.strategy_engine.core.types import StrategyType, Timeframe

strategy = (
    StrategyBuilder()
    .set_name("My Custom Strategy")
    .set_type(StrategyType.CUSTOM)
    .set_description("A custom multi-factor strategy")
    .set_min_confidence(0.6)
    .set_max_results(20)
    .set_timeframes([Timeframe.DAILY, Timeframe.WEEKLY])
    .set_tags(["custom", "multi-factor"])
    .add_rule_group(group)
    .build()
)
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /strategy/list | List all registered strategies |
| GET | /strategy/templates | List built-in strategy templates |
| GET | /strategy/history | Get execution history |
| POST | /strategy/run | Execute a strategy against symbols |
| POST | /strategy/create | Create a new custom strategy |
| POST | /strategy/update | Update an existing strategy |
| DELETE | /strategy/{name} | Delete a custom strategy |
| POST | /strategy/validate | Validate a strategy definition |
| POST | /strategy/benchmark | Benchmark strategy execution speed |

## Execution Output

```json
{
  "strategy_name": "Value Investing",
  "symbol": "THYAO",
  "signal": "BUY",
  "strategy_score": 0.75,
  "opportunity_score": 0.65,
  "confidence": 0.80,
  "risk": 0.20,
  "triggered_rules": [...],
  "failed_rules": [...],
  "warnings": [...],
  "explanations": [...]
}
```

## Tests

210 tests across 12 test files covering types, rules, executor, signals, builders, templates, validators, cache, registry, schemas, service, and API.

Run: `pytest tests/strategy_engine/ -v`
