# Database ER Diagram

## Text-Based ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MARKET DATA DOMAIN                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────┐                           │
│  │       Company        │      │        Stock          │                           │
│  ├──────────────────────┤      ├──────────────────────┤                           │
│  │ id (PK)              │──┐   │ id (PK)              │                           │
│  │ symbol (UQ)          │  │   │ companyId (FK)       │                           │
│  │ name                 │  ├──>│ symbol (UQ)          │                           │
│  │ sector               │  │   │ ticker               │                           │
│  │ industry             │  │   │ exchange             │                           │
│  │ marketCap            │  │   │ currency             │                           │
│  │ marketSegment        │  │   │ lotSize              │                           │
│  │ isin (UQ)            │  │   │ tickSize             │                           │
│  │ isActive             │  │   │ isActive             │                           │
│  │ createdAt            │  │   │ createdAt            │                           │
│  │ updatedAt            │  │   │ updatedAt            │                           │
│  └──────────────────────┘  │   └──────────────────────┘                           │
│           │                │          │    │    │    │                              │
│           │                │          │    │    │    │                              │
│           v                │          v    v    v    v                              │
│  ┌──────────────────────┐  │   ┌──────────────────────────────────────────────┐   │
│  │   CorporateAction    │  │   │  HistoricalPrice │ IntradayPrice │ etc.     │   │
│  ├──────────────────────┤  │   └──────────────────────────────────────────────┘   │
│  │ id (PK)              │  │                                                       │
│  │ companyId (FK)       │  │                                                       │
│  │ type                 │  │                                                       │
│  │ exDate               │  │                                                       │
│  │ value                │  │                                                       │
│  │ ratio                │  │                                                       │
│  └──────────────────────┘  │                                                       │
│                            │                                                       │
├────────────────────────────┼───────────────────────────────────────────────────────┤
│                            │         ANALYSIS DOMAIN                               │
├────────────────────────────┼───────────────────────────────────────────────────────┤
│                            │                                                       │
│  ┌──────────────────────┐  │   ┌──────────────────────┐                           │
│  │ FinancialStatement   │  │   │   FinancialRatio     │                           │
│  ├──────────────────────┤  │   ├──────────────────────┤                           │
│  │ id (PK)              │  │   │ id (PK)              │                           │
│  │ companyId (FK)       │<─┘   │ companyId (FK)       │<── Company                │
│  │ period               │      │ period               │                           │
│  │ reportType           │      │ peRatio              │                           │
│  │ revenue              │      │ pbRatio              │                           │
│  │ netIncome            │      │ roe                  │                           │
│  │ ...                  │      │ roa                  │                           │
│  └──────────────────────┘      └──────────────────────┘                           │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                              SCORING DOMAIN                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────┐                           │
│  │   TechnicalScore     │      │   FinancialScore     │                           │
│  ├──────────────────────┤      ├──────────────────────┤                           │
│  │ id (PK)              │      │ id (PK)              │                           │
│  │ stockId (FK)         │<────>│ stockId (FK)         │                           │
│  │ timeframe            │      │ period               │                           │
│  │ momentum             │      │ growth               │                           │
│  │ trend                │      │ profitability        │                           │
│  │ composite            │      │ composite            │                           │
│  └──────────────────────┘      └──────────────────────┘                           │
│           │                              │                                         │
│           v                              v                                         │
│  ┌──────────────────────┐      ┌──────────────────────┐                           │
│  │     EliteScore       │      │  ConfidenceScore     │                           │
│  ├──────────────────────┤      ├──────────────────────┤                           │
│  │ id (PK)              │      │ id (PK)              │                           │
│  │ stockId (FK)         │      │ stockId (FK)         │                           │
│  │ technical            │      │ dataQuality          │                           │
│  │ financial            │      │ modelConsistency     │                           │
│  │ confidence           │      │ composite            │                           │
│  │ composite            │      └──────────────────────┘                           │
│  │ rank                 │                                                         │
│  └──────────────────────┘                                                         │
│           │                                                                        │
│           v                                                                        │
│  ┌──────────────────────┐                                                         │
│  │   DecisionSignal     │                                                         │
│  ├──────────────────────┤                                                         │
│  │ id (PK)              │                                                         │
│  │ stockId (FK)         │                                                         │
│  │ action               │                                                         │
│  │ strength             │                                                         │
│  │ entryPrice           │                                                         │
│  │ targetPrice          │                                                         │
│  │ stopLossPrice        │                                                         │
│  └──────────────────────┘                                                         │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                           BACKTESTING DOMAIN                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────┐                                                         │
│  │   BacktestResult     │                                                         │
│  ├──────────────────────┤                                                         │
│  │ id (PK)              │                                                         │
│  │ stockId (FK)         │                                                         │
│  │ strategyName         │                                                         │
│  │ timeframe            │                                                         │
│  │ status               │                                                         │
│  │ sharpeRatio          │                                                         │
│  │ totalReturn          │                                                         │
│  │ maxDrawdown          │                                                         │
│  └──────────────────────┘                                                         │
│           │          │                                                             │
│           v          v                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐                              │
│  │ WalkForwardResult    │  │  MonteCarloResult    │                              │
│  ├──────────────────────┤  ├──────────────────────┤                              │
│  │ id (PK)              │  │ id (PK)              │                              │
│  │ backtestId (FK)      │  │ backtestId (FK)      │                              │
│  │ windowIndex          │  │ simulations          │                              │
│  │ inSampleReturn       │  │ var95                │                              │
│  │ outSampleReturn      │  │ cvar95               │                              │
│  └──────────────────────┘  └──────────────────────┘                              │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                           PORTFOLIO DOMAIN                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────┐                                                         │
│  │      Portfolio       │                                                         │
│  ├──────────────────────┤                                                         │
│  │ id (PK)              │                                                         │
│  │ name                 │                                                         │
│  │ isDefault            │                                                         │
│  └──────────────────────┘                                                         │
│           │          │          │                                                  │
│           v          v          v                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ PortfolioPosition    │  │ PortfolioSnapshot    │  │    RiskProfile       │    │
│  ├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤    │
│  │ id (PK)              │  │ id (PK)              │  │ id (PK)              │    │
│  │ portfolioId (FK)     │  │ portfolioId (FK)     │  │ portfolioId (FK)     │    │
│  │ stockId (FK)         │  │ totalValue           │  │ riskLevel            │    │
│  │ quantity             │  │ dailyReturn          │  │ maxPositionSize      │    │
│  │ avgPrice             │  │ totalReturn          │  │ stopLossPercent      │    │
│  │ weight               │  │ sharpeRatio          │  │ takeProfitRatio      │    │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘    │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                            SYSTEM DOMAIN                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────┐                           │
│  │     MarketRegime     │      │    SystemSetting     │                           │
│  ├──────────────────────┤      ├──────────────────────┤                           │
│  │ id (PK)              │      │ id (PK)              │                           │
│  │ date                 │      │ key (UQ)             │                           │
│  │ timeframe            │      │ value                │                           │
│  │ regime               │      │ category             │                           │
│  │ confidence           │      └──────────────────────┘                           │
│  └──────────────────────┘                                                         │
│                                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────┐                           │
│  │       User           │      │   ApplicationLog     │                           │
│  ├──────────────────────┤      ├──────────────────────┤                           │
│  │ id (PK)              │      │ id (PK)              │                           │
│  │ email (UQ)           │      │ severity             │                           │
│  │ name                 │      │ source               │                           │
│  │ role                 │      │ message              │                           │
│  └──────────────────────┘      └──────────────────────┘                           │
│           │                                                                        │
│           v                                                                        │
│  ┌──────────────────────┐                                                         │
│  │     Watchlist        │                                                         │
│  ├──────────────────────┤                                                         │
│  │ id (PK)              │                                                         │
│  │ userId (FK)          │                                                         │
│  │ name                 │                                                         │
│  └──────────────────────┘                                                         │
│           │                                                                        │
│           v                                                                        │
│  ┌──────────────────────┐                                                         │
│  │   WatchlistItem      │                                                         │
│  ├──────────────────────┤                                                         │
│  │ id (PK)              │                                                         │
│  │ watchlistId (FK)     │                                                         │
│  │ stockId (FK)         │                                                         │
│  └──────────────────────┘                                                         │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Legend

| Symbol | Meaning |
|--------|---------|
| (PK) | Primary Key |
| (FK) | Foreign Key |
| (UQ) | Unique Constraint |
| ──> | One-to-Many Relationship |
| <──> | Many-to-Many Relationship |

## Statistics

- **Total Tables**: 28
- **Total Enums**: 12
- **Total Indexes**: 85+
- **Total Foreign Keys**: 20
