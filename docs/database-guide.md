# Database Architecture Guide

## Overview

BIST Elite AI uses PostgreSQL with Prisma ORM for type-safe database access.

## Schema Architecture

### Domain Organization

The database is organized into 6 domains with 28 tables:

```
┌─────────────────────────────────────────────────────────────┐
│                    MARKET DATA DOMAIN                       │
│  Company, Stock, HistoricalPrice, IntradayPrice,           │
│  CorporateAction, TradingSession                            │
├─────────────────────────────────────────────────────────────┤
│                    ANALYSIS DOMAIN                          │
│  IndicatorSnapshot, FinancialStatement, FinancialRatio     │
├─────────────────────────────────────────────────────────────┤
│                    SCORING DOMAIN                           │
│  TechnicalScore, FinancialScore, EliteScore,               │
│  ConfidenceScore, DecisionSignal                            │
├─────────────────────────────────────────────────────────────┤
│                    BACKTESTING DOMAIN                       │
│  BacktestResult, WalkForwardResult, MonteCarloResult       │
├─────────────────────────────────────────────────────────────┤
│                    PORTFOLIO DOMAIN                         │
│  Portfolio, PortfolioPosition, PortfolioSnapshot,          │
│  RiskProfile                                               │
├─────────────────────────────────────────────────────────────┤
│                    SYSTEM DOMAIN                            │
│  MarketRegime, SystemSetting, ApplicationLog, User,        │
│  Watchlist, WatchlistItem, NotificationQueue,              │
│  TelegramMessage                                           │
└─────────────────────────────────────────────────────────────┘
```

### Table Relationships

```
Company ──┬── Stock ──┬── HistoricalPrice
          │           ├── IntradayPrice
          │           ├── IndicatorSnapshot
          │           ├── TechnicalScore
          │           ├── FinancialScore
          │           ├── EliteScore
          │           ├── ConfidenceScore
          │           ├── DecisionSignal
          │           ├── BacktestResult ──┬── WalkForwardResult
          │           │                    └── MonteCarloResult
          │           ├── PortfolioPosition
          │           └── WatchlistItem
          ├── CorporateAction
          ├── FinancialStatement
          └── FinancialRatio

Portfolio ──┬── PortfolioPosition
            ├── PortfolioSnapshot
            └── RiskProfile

User ──┬── Watchlist ── WatchlistItem
       ├── NotificationQueue
       └── TelegramMessage
```

## Key Design Decisions

### Decimal Precision

| Field Type | Precision | Example |
|------------|-----------|---------|
| Prices | Decimal(18, 4) | 123.4567 |
| Scores | Decimal(5, 2) | 85.50 |
| Ratios | Decimal(10, 4) | 1.2345 |
| Percentages | Decimal(8, 4) | 12.3456 |
| Weights | Decimal(5, 4) | 0.1234 |

### Timeframe Support

All analysis tables support multiple timeframes:
- `M4` - 4 Hour
- `D1` - 1 Day (default)
- `W1` - 1 Week
- `M1` - 1 Month

### Auditing

Every table includes:
- `createdAt` - Record creation timestamp
- `updatedAt` - Last modification timestamp
- `createdBy` - User who created the record (optional)
- `updatedBy` - User who last updated the record (optional)

### Soft Delete

Soft delete is NOT used in this schema. For data retention:
- Historical data is preserved indefinitely
- Users can be deactivated (`isActive = false`)
- Companies can be deactivated (`isActive = false`)

## Indexes

### Primary Indexes

Every table has a UUID primary key.

### Performance Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| Stock | `symbol` | Fast lookup by symbol |
| Stock | `ticker_exchange` | Unique constraint |
| HistoricalPrice | `stockId_date_timeframe` | Unique constraint |
| HistoricalPrice | `stockId_date` | Query by stock and date range |
| EliteScore | `composite` | Rank by score |
| BacktestResult | `sharpeRatio` | Rank by performance |
| MarketRegime | `date_timeframe` | Unique constraint |

## Migrations

### Creating Migrations

```bash
# Development
cd packages/database
npx prisma migrate dev --name description

# Production
npx prisma migrate deploy
```

### Rollback

Prisma does not support automatic rollbacks. To rollback:
1. Create a new migration with reverse changes
2. Apply manually

### Migration Naming

Use descriptive names:
- `add-user-avatar-field`
- `create-portfolio-table`
- `update-score-precision`

## Seeding

### Running Seeds

```bash
cd packages/database
npx prisma db seed
```

### Seed Data

| Seed | Description |
|------|-------------|
| System Settings | 24 default settings |
| Market Data | 30 BIST companies |
| Risk Profiles | 4 risk levels |

### Adding Custom Seeds

1. Create file in `prisma/seeds/`
2. Export async function
3. Import in `seed.ts`

## Repository Pattern

### Base Repository

```typescript
abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  findById(id: string): Promise<T | null>;
  findMany(where, options): Promise<PaginatedResult<T>>;
  create(data): Promise<T>;
  update(id, data): Promise<T>;
  delete(id): Promise<T>;
  count(where?): Promise<number>;
  exists(where): Promise<boolean>;
}
```

### Specialized Repositories

| Repository | Key Methods |
|------------|-------------|
| `CompanyRepository` | `findBySymbol`, `findBySector`, `findWithStocks` |
| `StockRepository` | `findByTicker`, `searchBySymbol`, `findWithLatestPrice` |
| `HistoricalPriceRepository` | `findByStockAndDateRange`, `upsertPrice`, `bulkUpsert` |
| `EliteScoreRepository` | `findTopScores`, `findOpportunities`, `findScoreHistory` |
| `BacktestResultRepository` | `findBestByStrategy`, `findWithWalkForward` |
| `MarketRegimeRepository` | `findLatest`, `findRegimeHistory`, `findHighConfidence` |
| `PortfolioRepository` | `findDefault`, `findWithPositions`, `findComplete` |
| `UserRepository` | `findByEmail`, `findWithWatchlists`, `updateLastLogin` |

## Performance Considerations

### Connection Pooling

Prisma uses connection pooling. Configure in `DATABASE_URL`:
```
postgresql://...?connection_limit=10&pool_timeout=20
```

### Bulk Operations

Use `createMany` for bulk inserts:
```typescript
await prisma.historicalPrice.createMany({
  data: prices,
  skipDuplicates: true,
});
```

### Query Optimization

1. Use `select` to fetch only needed fields
2. Use `include` sparingly (avoid N+1)
3. Use pagination for large datasets
4. Index frequently queried fields

## Backup Strategy

### Daily Backups

```bash
pg_dump -U postgres bist_elite_ai > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
psql -U postgres bist_elite_ai < backup_20240101.sql
```
