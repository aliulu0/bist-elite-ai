# BIST Elite AI - Data Engine

## Overview

The Data Engine is the core data collection and processing module of BIST Elite AI. It handles fetching, validating, cleaning, storing, and updating all financial data used in the application.

## Architecture

```
modules/data_engine/
├── api/                    # FastAPI endpoints
│   └── router.py          # API routes
├── providers/              # Data source adapters
│   ├── base_providers.py   # All providers
│   ├── price_provider.py   # Price data
│   ├── financial_provider.py # Financial data
│   ├── news_provider.py    # News data
│   └── technical_provider.py # Technical calculations
├── repositories/           # Database access layer
│   ├── base_repositories.py
│   ├── company_repository.py
│   ├── price_repository.py
│   ├── financial_repository.py
│   ├── technical_repository.py
│   ├── sector_repository.py
│   └── news_repository.py
├── services/               # Business logic
│   ├── company_service.py
│   ├── price_service.py
│   ├── financial_service.py
│   ├── technical_service.py
│   ├── sector_service.py
│   ├── news_service.py
│   ├── update_service.py   # Main orchestrator
│   └── validation_service.py
├── validators/             # Data validation
│   └── validation_service.py
├── utils/                  # Utilities
│   ├── cache.py           # In-memory cache
│   ├── logger.py          # Structured logging
│   ├── progress.py        # Progress tracking
│   ├── retry.py           # Retry logic
│   └── http_client.py     # HTTP client
└── models/                 # Data models
```

## Services

### CompanyService
Manages company data synchronization.

```python
service = CompanyService(db)
companies = service.get_all()
result = await service.sync_companies()
```

### PriceService
Handles OHLCV price data updates.

```python
service = PriceService(db)
result = await service.update_prices_for_company("GARAN", company_id)
result = await service.update_all_prices(companies)
```

### FinancialService
Manages financial reports and ratios.

```python
service = FinancialService(db)
result = await service.update_financials_for_company("GARAN", company_id)
result = await service.update_all_financials(companies)
```

### TechnicalService
Calculates technical indicators from price data.

```python
service = TechnicalService(db)
result = await service.update_technicals_for_company("GARAN", company_id)
indicators = service.calculate_indicators(price_df)
```

### SectorService
Updates sector strength scores.

```python
service = SectorService(db)
result = await service.update_sector_strength()
sectors = service.get_all_sectors()
```

### UpdateService
Main orchestrator for the update pipeline.

```python
service = UpdateService(db)
result = await service.update_all()  # Full pipeline
result = await service.update_prices()  # Just prices
progress = service.get_progress()  # Current progress
```

## Providers

Providers are independent data source adapters. Each provider implements:

- `fetch_companies()` - Get company list
- `fetch_prices()` - Get price data
- `fetch_financial_reports()` - Get financial data
- `health_check()` - Check provider status

### Adding New Providers

1. Create a new provider class:

```python
class NewDataProvider(BaseProvider):
    def __init__(self):
        super().__init__("new_provider")

    async def fetch_companies(self) -> pd.DataFrame:
        # Implement data fetching
        pass

    async def health_check(self) -> bool:
        return True
```

2. Register in `providers/__init__.py`

## Update Pipeline

When user clicks "Verileri Güncelle":

```
Step 1: Download company list
    ↓
Step 2: Update prices for all companies
    ↓
Step 3: Update financial reports
    ↓
Step 4: Calculate technical indicators
    ↓
Step 5: Update sector statistics
    ↓
Step 6: Generate logs
    ↓
Step 7: Return update summary
```

## Caching

The Data Engine uses an in-memory cache to prevent duplicate updates:

```python
from modules.data_engine.utils import cache

# Check cache
if cache.has("price_update:GARAN"):
    return "Already updated"

# Set cache
cache.set("price_update:GARAN", True, ttl=3600)

# Get or compute
data = cache.get_or_set("key", lambda: expensive_computation())
```

## Logging

All operations are logged with structured output:

```python
from modules.data_engine.utils import logger

logger.update_start("FULL UPDATE")
logger.info("Processing GARAN...")
logger.warning("Missing data for AKBNK")
logger.error("Failed to fetch THYAO data")
logger.update_complete("FULL UPDATE", duration=45.2, success_count=14, failed_count=1)
```

## Validation

Before saving data, the validation service checks:

- Missing values
- Duplicate rows
- Wrong dates
- Negative prices
- Invalid volume
- Duplicate companies
- Corrupted data

```python
from modules.data_engine.services import ValidationService

service = ValidationService()
result = service.validate_prices(df)
if not result.is_valid:
    print(result.errors)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/data-engine/status` | Current update progress |
| GET | `/api/v1/data-engine/last-update` | Last update info |
| POST | `/api/v1/data-engine/update/companies` | Sync companies |
| POST | `/api/v1/data-engine/update/prices` | Update prices |
| POST | `/api/v1/data-engine/update/financials` | Update financials |
| POST | `/api/v1/data-engine/update/technicals` | Update technicals |
| POST | `/api/v1/data-engine/update/all` | Full update |
| GET | `/api/v1/data-engine/companies` | List companies |
| GET | `/api/v1/data-engine/companies/{code}` | Get company |
| GET | `/api/v1/data-engine/sectors` | List sectors |
| POST | `/api/v1/data-engine/news` | Fetch news |
| GET | `/api/v1/data-engine/health` | Health check |

## Progress Tracking

The update process reports real-time progress:

```json
{
  "stage": "processing",
  "progress_percent": 45.2,
  "total_companies": 15,
  "processed_companies": 7,
  "current_company": "GARAN",
  "duration": 12.5,
  "success_count": 6,
  "failed_count": 1,
  "updated_prices": 150,
  "updated_financials": 24,
  "errors": []
}
```

## Error Handling

- Retry failed requests (3 attempts with exponential backoff)
- Log all errors
- Continue update process even if one company fails
- Return detailed error report

## Testing

```bash
cd backend

# Run all tests
pytest tests/data_engine/ -v

# Run specific test
pytest tests/data_engine/test_validators.py -v

# Run with coverage
pytest tests/data_engine/ --cov=modules.data_engine
```

## Configuration

Environment variables:

```env
DATABASE_URL=sqlite:///./bist_elite_ai.db
APP_DEBUG=true
```

## Performance

- Batch database operations
- In-memory caching (1 hour TTL)
- Async HTTP requests
- Parallel processing ready
