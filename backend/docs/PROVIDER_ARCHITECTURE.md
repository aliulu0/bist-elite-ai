# Provider Architecture - BIST Elite AI

## Overview

The Provider Architecture implements a robust, extensible data source management system
following the **Strategy** and **Factory** design patterns. The system ensures that
BIST Elite AI **never depends on a single data source** - if one provider fails,
the system automatically switches to another.

## Architecture Principles

```
Application Code
       |
       v
  Service Layer  (CompanyService, PriceService, ...)
       |
       v
  ProviderManager  (failover, priority, cooldown)
       |
       v
  AbstractProvider  (interface contract)
       |
  +----+----+----+
  |    |    |    |
  v    v    v    v
 KAP  Yahoo  Mock  ...  (concrete implementations)
```

### Key Principles

1. **No direct dependencies** - Services never import concrete providers directly
2. **Standardized output** - All providers return the same data models
3. **Automatic failover** - ProviderManager switches providers on failure
4. **Priority-based selection** - PRIMARY > SECONDARY > FALLBACK > MOCK
5. **Health monitoring** - Every provider tracks health and metrics
6. **Cooldown protection** - Failed providers enter cooldown before retry

## File Structure

```
providers/
├── __init__.py                    # Public API exports
├── base_providers.py              # Backward-compatible imports
├── base/
│   ├── __init__.py
│   ├── abstract_provider.py       # AbstractProvider + ProviderConfig
│   ├── provider_manager.py        # ProviderManager (failover)
│   ├── provider_registry.py       # Singleton registry
│   └── provider_factory.py        # Factory for creating providers
├── models/
│   ├── __init__.py
│   ├── enums.py                   # ProviderType, ProviderStatus, etc.
│   └── schemas.py                 # CompanyData, PriceData, etc.
└── implementations/
    ├── price/
    │   ├── mock_price_provider.py
    │   ├── yahoo_price_provider.py
    │   └── kap_price_provider.py
    ├── financial/
    │   ├── mock_financial_provider.py
    │   └── kap_financial_provider.py
    ├── news/
    │   ├── mock_news_provider.py
    │   └── kap_news_provider.py
    ├── sector/
    │   └── mock_sector_provider.py
    └── technical/
        └── local_technical_provider.py
```

## AbstractProvider Interface

Every provider implements this lifecycle:

```python
class AbstractProvider(ABC):
    async def connect(self) -> bool
    async def download(self, **kwargs) -> Any
    async def validate(self, raw_data) -> bool
    async def transform(self, raw_data) -> list[DataModel]
    async def save(self, data) -> dict
    async def health_check(self) -> ProviderHealth
```

### Execute Pipeline

The `execute()` method runs the full pipeline automatically:

```
connect() -> download() -> validate() -> transform()
```

If any step fails, the error is recorded and the next provider is tried.

## ProviderManager (Failover)

The ProviderManager manages all providers for a given type and handles automatic failover.

### How Failover Works

```
1. Providers are sorted by priority (PRIMARY first)
2. Skip disabled providers
3. Skip providers in cooldown (3+ consecutive failures)
4. Try each provider in order
5. On success: reset failure count
6. On failure: increment failure count
7. After 3 consecutive failures: enter 5-minute cooldown
8. If all providers fail: return error with all attempts
```

### Configuration

```python
COOLDOWN_SECONDS = 300.0      # 5 minutes
MAX_CONSECUTIVE_FAILURES = 3   # before cooldown
```

## ProviderRegistry (Singleton)

Central registry for all ProviderManagers. Ensures single source of truth.

```python
from modules.data_engine.providers.base.provider_registry import registry

# Get a manager
manager = registry.get_manager(ProviderType.PRICE)

# Register a provider
registry.register(my_provider)

# Get active provider
active = registry.get_active_provider(ProviderType.PRICE)

# Health check all
results = await registry.health_check_all()
```

## ProviderFactory

Creates and registers all default providers at application startup.

```python
from modules.data_engine.providers.base.provider_factory import ProviderFactory

# Initialize all providers (called in app lifespan)
ProviderFactory.create_default_providers(
    enable_yahoo=True,
    enable_kap=True,
    enable_mock=True,
)

# Create specific provider
provider = ProviderFactory.create_single(
    ProviderType.PRICE, "yahoo_finance", ProviderPriority.SECONDARY
)
```

## Data Models

All providers return standardized frozen dataclasses:

| Model | Fields |
|-------|--------|
| `CompanyData` | stock_code, company_name, sector, market, sub_sector, market_value, free_float, website, kap_url, active |
| `PriceData` | stock_code, date, open, high, low, close, volume, turnover |
| `FinancialData` | stock_code, period, year, quarter, revenue, gross_profit, ebitda, operating_profit, net_profit, equity, assets, liabilities, cash, net_debt, shares, eps |
| `NewsData` | title, content, source, published_at, company, category, url |
| `SectorData` | sector, date, strength_score, momentum, relative_strength, breadth, leading_stock, lagging_stock |

## Provider Implementations

### Currently Implemented

| Provider | Type | Source | Priority | Status |
|----------|------|--------|----------|--------|
| MockPriceProvider | Price | mock | FALLBACK | Working |
| YahooFinancePriceProvider | Price | yahoo_finance | SECONDARY | Working |
| KapPriceProvider | Price | kap | PRIMARY | Working |
| MockFinancialProvider | Financial | mock | FALLBACK | Working |
| KapFinancialProvider | Financial | kap | PRIMARY | Working |
| MockNewsProvider | News | mock | FALLBACK | Working |
| KapNewsProvider | News | kap | PRIMARY | Working |
| MockSectorProvider | Sector | mock | PRIMARY | Working |
| LocalTechnicalProvider | Technical | local | PRIMARY | Working |

### Future Providers (Ready for Implementation)

- **Finnhub** - Real-time US/BIST data
- **Polygon** - Historical data
- **Alpha Vantage** - Free tier API
- **Financial Modeling Prep (FMP)** - Financial statements
- **Matriks** - Turkish market data (requires subscription)
- **TradingView** - Technical indicators (requires subscription)
- **Fintables** - Turkish financial data (requires access)

To add a new provider:

1. Create a class extending `AbstractProvider`
2. Implement all 6 lifecycle methods
3. Register via `ProviderFactory.create_single()` or `registry.register()`

## Service Integration

Services use ProviderManager transparently:

```python
class CompanyService:
    def _get_manager(self):
        return registry.get_manager(ProviderType.PRICE)

    async def sync_companies(self) -> dict:
        manager = self._get_manager()
        result = await manager.execute(mode="companies")
        # result["success"], result["data"], result["provider"]
```

The application never knows which provider was used.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/providers/status` | All providers status |
| GET | `/api/v1/providers/health` | Health check all providers |
| GET | `/api/v1/providers/{type}` | Status for a provider type |
| GET | `/api/v1/providers/{type}/active` | Active provider for type |
| POST | `/api/v1/providers/{type}/failover/reset` | Reset failover state |
| POST | `/api/v1/providers/initialize` | Re-initialize providers |

## UML Diagram

See `docs/PROVIDER_ARCHITECTURE.puml` for the complete PlantUML class diagram.

## Adding a New Provider

```python
from modules.data_engine.providers.base.abstract_provider import AbstractProvider, ProviderConfig
from modules.data_engine.providers.models.enums import ProviderType, ProviderSource, ProviderPriority

class MyNewPriceProvider(AbstractProvider):
    def __init__(self):
        config = ProviderConfig(
            source=ProviderSource.YAHOO_FINANCE,  # or new enum value
            provider_type=ProviderType.PRICE,
            priority=ProviderPriority.SECONDARY,
            api_key="your-api-key",
        )
        super().__init__(config)

    async def connect(self) -> bool:
        # Establish connection
        return True

    async def download(self, **kwargs) -> dict:
        # Fetch from external API
        return {"type": "prices", "data": [...]}

    async def validate(self, raw_data) -> bool:
        # Validate data integrity
        return True

    async def transform(self, raw_data) -> list[PriceData]:
        # Convert to standardized models
        return [PriceData(...) for item in raw_data["data"]]

    async def save(self, data) -> dict:
        return {"saved": len(data)}

    async def health_check(self) -> ProviderHealth:
        return self._health

# Register it
from modules.data_engine.providers.base.provider_factory import ProviderFactory
ProviderFactory.create_single(ProviderType.PRICE, "my_source", ProviderPriority.SECONDARY)
```

## Testing

```bash
# Run all provider tests
pytest tests/data_engine/test_providers.py -v

# Run architecture tests
pytest tests/data_engine/test_provider_architecture.py -v
```

91 tests covering:
- All mock providers (connect, download, validate, transform, save, health_check)
- ProviderManager (register, unregister, execute, failover)
- ProviderRegistry (singleton, get_manager, register)
- ProviderFactory (create providers, default initialization)
- Data model validation
- Metrics and health tracking
