# BIST Elite AI - Database Documentation

## Overview

This document describes the database schema for the BIST Elite AI platform. The database is designed with PostgreSQL compatibility in mind while using SQLite for development.

## Design Principles

- **UUID Primary Keys**: All tables use UUID v4 as primary keys for distributed system compatibility
- **Timestamps**: Every table includes `created_at` and `updated_at` fields
- **Soft Delete**: Appropriate tables include `is_deleted` and `deleted_at` fields
- **Foreign Keys**: All relationships use foreign keys with CASCADE or SET NULL
- **Indexes**: Every frequently queried field has an index
- **Constraints**: Unique constraints prevent duplicate data
- **Database Agnostic**: Uses SQLAlchemy types that work across SQLite and PostgreSQL

## Tables

### 1. companies

Stores company information for all listed stocks on Borsa Istanbul.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| stock_code | VARCHAR(10) | UNIQUE, NOT NULL | Stock ticker symbol |
| company_name | VARCHAR(255) | NOT NULL | Full company name |
| sector | VARCHAR(100) | NULLABLE | Industry sector |
| sub_sector | VARCHAR(100) | NULLABLE | Sub-sector classification |
| market | VARCHAR(50) | NOT NULL | Market listing (BIST-100, etc.) |
| market_value | FLOAT | NULLABLE | Total market capitalization |
| free_float | FLOAT | NULLABLE | Free float percentage |
| website | VARCHAR(255) | NULLABLE | Company website |
| kap_url | VARCHAR(500) | NULLABLE | KAP disclosure URL |
| active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether stock is actively traded |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Indexes:**
- `stock_code` (unique)
- `company_name`
- `sector`, `sub_sector`
- `market`
- `active`
- `sector` + `market` (composite)
- `active` + `sector` (composite)
- `market_value`

**Relationships:**
- 1:N with daily_prices, financial_reports, financial_ratios, technical_indicators, elite_scores, watchlist_items, backtest_results, portfolio_items, ai_analyses, notifications

---

### 2. daily_prices

Stores daily OHLCV (Open, High, Low, Close, Volume) price data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| company_id | UUID | FK -> companies.id, NOT NULL | Company reference |
| date | DATE | NOT NULL | Trading date |
| open | FLOAT | NOT NULL | Opening price |
| high | FLOAT | NOT NULL | Highest price |
| low | FLOAT | NOT NULL | Lowest price |
| close | FLOAT | NOT NULL | Closing price |
| volume | FLOAT | NOT NULL | Trading volume |
| turnover | FLOAT | NOT NULL | Trading turnover |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Constraints:**
- UNIQUE (company_id, date)

**Indexes:**
- `company_id` + `date` (composite, unique)
- `date`
- `company_id`

---

### 3. financial_reports

Stores quarterly financial statements for companies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| company_id | UUID | FK -> companies.id, NOT NULL | Company reference |
| period | VARCHAR(10) | NOT NULL | Period string (e.g., "2024Q1") |
| year | INTEGER | NOT NULL | Fiscal year |
| quarter | INTEGER | NOT NULL | Quarter number (1-4) |
| revenue | FLOAT | NULLABLE | Total revenue |
| gross_profit | FLOAT | NULLABLE | Gross profit |
| ebitda | FLOAT | NULLABLE | EBITDA |
| operating_profit | FLOAT | NULLABLE | Operating profit |
| net_profit | FLOAT | NULLABLE | Net profit |
| equity | FLOAT | NULLABLE | Total equity |
| assets | FLOAT | NULLABLE | Total assets |
| liabilities | FLOAT | NULLABLE | Total liabilities |
| cash | FLOAT | NULLABLE | Cash and equivalents |
| net_debt | FLOAT | NULLABLE | Net debt |
| shares | FLOAT | NULLABLE | Number of shares |
| eps | FLOAT | NULLABLE | Earnings per share |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Constraints:**
- UNIQUE (company_id, period)

---

### 4. financial_ratios

Stores calculated financial ratios for analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| company_id | UUID | FK -> companies.id, NOT NULL | Company reference |
| period | VARCHAR(10) | NOT NULL | Period string |
| year | INTEGER | NOT NULL | Fiscal year |
| quarter | INTEGER | NOT NULL | Quarter number |
| pd_dd | FLOAT | NULLABLE | Price/Dividends |
| fk | FLOAT | NULLABLE | Price/Earnings (P/E) |
| fd_favok | FLOAT | NULLABLE | EV/EBITDA |
| peg | FLOAT | NULLABLE | PEG ratio |
| ev_sales | FLOAT | NULLABLE | EV/Sales |
| roe | FLOAT | NULLABLE | Return on Equity |
| roa | FLOAT | NULLABLE | Return on Assets |
| roic | FLOAT | NULLABLE | Return on Invested Capital |
| net_debt_ebitda | FLOAT | NULLABLE | Net Debt/EBITDA |
| current_ratio | FLOAT | NULLABLE | Current Ratio |
| quick_ratio | FLOAT | NULLABLE | Quick Ratio |
| piotroski | FLOAT | NULLABLE | Piotroski F-Score |
| altman | FLOAT | NULLABLE | Altman Z-Score |
| beneish | FLOAT | NULLABLE | Beneish M-Score |
| revenue_growth | FLOAT | NULLABLE | Revenue growth rate |
| net_profit_growth | FLOAT | NULLABLE | Net profit growth rate |
| ebitda_growth | FLOAT | NULLABLE | EBITDA growth rate |
| fcf_growth | FLOAT | NULLABLE | Free cash flow growth rate |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Constraints:**
- UNIQUE (company_id, period)

---

### 5. technical_indicators

Stores all calculated technical analysis indicators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| company_id | UUID | FK -> companies.id, NOT NULL | Company reference |
| date | DATE | NOT NULL | Indicator date |
| sma_9 | FLOAT | NULLABLE | Simple Moving Average (9) |
| sma_20 | FLOAT | NULLABLE | Simple Moving Average (20) |
| sma_50 | FLOAT | NULLABLE | Simple Moving Average (50) |
| sma_100 | FLOAT | NULLABLE | Simple Moving Average (100) |
| sma_200 | FLOAT | NULLABLE | Simple Moving Average (200) |
| ema_9 | FLOAT | NULLABLE | Exponential Moving Average (9) |
| ema_20 | FLOAT | NULLABLE | Exponential Moving Average (20) |
| ema_50 | FLOAT | NULLABLE | Exponential Moving Average (50) |
| ema_100 | FLOAT | NULLABLE | Exponential Moving Average (100) |
| ema_200 | FLOAT | NULLABLE | Exponential Moving Average (200) |
| rsi | FLOAT | NULLABLE | Relative Strength Index |
| stochastic_rsi | FLOAT | NULLABLE | Stochastic RSI |
| macd | FLOAT | NULLABLE | MACD line |
| macd_signal | FLOAT | NULLABLE | MACD signal line |
| adx | FLOAT | NULLABLE | Average Directional Index |
| atr | FLOAT | NULLABLE | Average True Range |
| obv | FLOAT | NULLABLE | On Balance Volume |
| cmf | FLOAT | NULLABLE | Chaikin Money Flow |
| vwap | FLOAT | NULLABLE | Volume Weighted Average Price |
| mfi | FLOAT | NULLABLE | Money Flow Index |
| ichimoku | FLOAT | NULLABLE | Ichimoku Cloud |
| supertrend | FLOAT | NULLABLE | SuperTrend indicator |
| bollinger_upper | FLOAT | NULLABLE | Bollinger Band upper |
| bollinger_middle | FLOAT | NULLABLE | Bollinger Band middle |
| bollinger_lower | FLOAT | NULLABLE | Bollinger Band lower |
| donchian_upper | FLOAT | NULLABLE | Donchian Channel upper |
| donchian_lower | FLOAT | NULLABLE | Donchian Channel lower |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Constraints:**
- UNIQUE (company_id, date)

---

### 6. elite_scores

Stores calculated elite scores for stock ranking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| company_id | UUID | FK -> companies.id, NOT NULL | Company reference |
| analysis_date | DATE | NOT NULL | Analysis date |
| weekly_score | FLOAT | NULLABLE | Weekly performance score |
| one_month_score | FLOAT | NULLABLE | 1-month performance score |
| three_month_score | FLOAT | NULLABLE | 3-month performance score |
| five_month_score | FLOAT | NULLABLE | 5-month performance score |
| one_year_score | FLOAT | NULLABLE | 1-year performance score |
| technical_score | FLOAT | NULLABLE | Technical analysis score |
| fundamental_score | FLOAT | NULLABLE | Fundamental analysis score |
| smart_money_score | FLOAT | NULLABLE | Smart money flow score |
| story_score | FLOAT | NULLABLE | Company story score |
| risk_score | FLOAT | NULLABLE | Risk assessment score |
| explosion_score | FLOAT | NULLABLE | Potential explosion score |
| elite_score | FLOAT | NULLABLE | Final elite score |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Constraints:**
- UNIQUE (company_id, analysis_date)

---

### 7. watchlists

User-created watchlists for stock tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Watchlist name |
| description | VARCHAR(500) | NULLABLE | Watchlist description |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

### 8. watchlist_items

Stocks added to watchlists.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| watchlist_id | UUID | FK -> watchlists.id, NOT NULL | Watchlist reference |
| company_id | UUID | FK -> companies.id, NOT NULL | Company reference |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| notes | VARCHAR(500) | NULLABLE | User notes |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Constraints:**
- UNIQUE (watchlist_id, company_id)

---

### 9. saved_filters

User-saved filter configurations for the screener.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Filter name |
| description | VARCHAR(500) | NULLABLE | Filter description |
| filter_config | TEXT | NOT NULL | JSON filter configuration |
| is_default | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether this is the default filter |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT FALSE | Soft delete flag |
| deleted_at | DATETIME | NULLABLE | Soft delete timestamp |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

### 10. backtests

Stores backtest run configurations and results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Backtest name |
| description | VARCHAR(500) | NULLABLE | Backtest description |
| strategy | VARCHAR(100) | NOT NULL | Strategy identifier |
| start_date | VARCHAR(10) | NOT NULL | Backtest start date |
| end_date | VARCHAR(10) | NOT NULL | Backtest end date |
| initial_capital | FLOAT | NOT NULL | Starting capital |
| final_capital | FLOAT | NULLABLE | Ending capital |
| total_return | FLOAT | NULLABLE | Total return percentage |
| annual_return | FLOAT | NULLABLE | Annualized return |
| max_drawdown | FLOAT | NULLABLE | Maximum drawdown |
| sharpe_ratio | FLOAT | NULLABLE | Sharpe ratio |
| win_rate | FLOAT | NULLABLE | Win rate percentage |
| total_trades | INTEGER | NULLABLE | Total number of trades |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Backtest status |
| config | TEXT | NULLABLE | JSON strategy configuration |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT FALSE | Soft delete flag |
| deleted_at | DATETIME | NULLABLE | Soft delete timestamp |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

### 11. backtest_results

Individual stock results from backtests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| backtest_id | UUID | FK -> backtests.id, NOT NULL | Backtest reference |
| company_id | UUID | FK -> companies.id, NOT NULL | Company reference |
| total_return | FLOAT | NULLABLE | Stock total return |
| annual_return | FLOAT | NULLABLE | Stock annual return |
| max_drawdown | FLOAT | NULLABLE | Stock max drawdown |
| sharpe_ratio | FLOAT | NULLABLE | Stock Sharpe ratio |
| win_rate | FLOAT | NULLABLE | Stock win rate |
| total_trades | INTEGER | NULLABLE | Stock trade count |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Constraints:**
- UNIQUE (backtest_id, company_id)

---

### 12. portfolios

User investment portfolios.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Portfolio name |
| description | VARCHAR(500) | NULLABLE | Portfolio description |
| total_value | FLOAT | NOT NULL, DEFAULT 0 | Total portfolio value |
| total_cost | FLOAT | NOT NULL, DEFAULT 0 | Total cost basis |
| total_profit | FLOAT | NOT NULL, DEFAULT 0 | Total profit/loss |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT FALSE | Soft delete flag |
| deleted_at | DATETIME | NULLABLE | Soft delete timestamp |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

### 13. portfolio_items

Stocks held in portfolios.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| portfolio_id | UUID | FK -> portfolios.id, NOT NULL | Portfolio reference |
| company_id | UUID | FK -> companies.id, NOT NULL | Company reference |
| quantity | INTEGER | NOT NULL | Number of shares |
| average_price | FLOAT | NOT NULL | Average purchase price |
| current_price | FLOAT | NULLABLE | Current market price |
| profit | FLOAT | NOT NULL, DEFAULT 0 | Profit/loss amount |
| profit_percent | FLOAT | NOT NULL, DEFAULT 0 | Profit/loss percentage |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Constraints:**
- UNIQUE (portfolio_id, company_id)

---

### 14. telegram_settings

Telegram bot configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| bot_token | VARCHAR(255) | NOT NULL | Telegram bot token |
| chat_id | VARCHAR(50) | NOT NULL | Telegram chat ID |
| enabled | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether integration is enabled |
| notifications_enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether notifications are sent |
| daily_report | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether to send daily reports |
| price_alerts | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether to send price alerts |
| analysis_alerts | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether to send analysis alerts |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

### 15. notifications

Generated alerts and notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| company_id | UUID | FK -> companies.id, NULLABLE | Company reference (optional) |
| type | VARCHAR(50) | NOT NULL | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| severity | VARCHAR(20) | NOT NULL, DEFAULT 'info' | Severity level |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether notification was read |
| is_sent | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether notification was sent |
| sent_via | VARCHAR(50) | NULLABLE | How notification was sent |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

### 16. ai_analysis

AI-generated analysis and explanations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| company_id | UUID | FK -> companies.id, NOT NULL | Company reference |
| analysis_type | VARCHAR(50) | NOT NULL | Type of analysis |
| model_name | VARCHAR(100) | NOT NULL | AI model used |
| prompt | TEXT | NULLABLE | Input prompt |
| response | TEXT | NOT NULL | AI response |
| confidence | FLOAT | NULLABLE | Confidence score (0-1) |
| sentiment | VARCHAR(20) | NULLABLE | Sentiment analysis |
| language | VARCHAR(10) | NOT NULL, DEFAULT 'tr' | Response language |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

### 17. sector_strength

Daily sector strength scores.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| sector | VARCHAR(100) | NOT NULL | Sector name |
| date | DATE | NOT NULL | Analysis date |
| strength_score | FLOAT | NOT NULL | Sector strength score |
| momentum | FLOAT | NULLABLE | Sector momentum |
| relative_strength | FLOAT | NULLABLE | Relative strength index |
| breadth | FLOAT | NULLABLE | Sector breadth |
| leading_stock | VARCHAR(10) | NULLABLE | Leading stock ticker |
| lagging_stock | VARCHAR(10) | NULLABLE | Lagging stock ticker |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Constraints:**
- UNIQUE (sector, date)

---

### 18. market_summary

Daily market summary data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| date | DATE | UNIQUE, NOT NULL | Trading date |
| bist_100 | FLOAT | NOT NULL | BIST-100 index value |
| bist_100_change | FLOAT | NOT NULL | Index change |
| bist_100_change_percent | FLOAT | NOT NULL | Index change percentage |
| xu100_futures | FLOAT | NULLABLE | XU100 futures value |
| total_volume | FLOAT | NOT NULL | Total market volume |
| total_turnover | FLOAT | NOT NULL | Total market turnover |
| advancing | INTEGER | NOT NULL | Number of advancing stocks |
| declining | INTEGER | NOT NULL | Number of declining stocks |
| unchanged | INTEGER | NOT NULL | Number of unchanged stocks |
| new_highs | INTEGER | NOT NULL | Number of new highs |
| new_lows | INTEGER | NOT NULL | Number of new lows |
| foreign_net_buy | FLOAT | NULLABLE | Foreign net buy amount |
| tefas_net | FLOAT | NULLABLE | TEFAS net fund flow |
| usd_try | FLOAT | NULLABLE | USD/TRY exchange rate |
| eur_try | FLOAT | NULLABLE | EUR/TRY exchange rate |
| gold_price | FLOAT | NULLABLE | Gold price |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

### 19. application_settings

Application configuration settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| setting_key | VARCHAR(100) | UNIQUE, NOT NULL | Setting identifier |
| setting_value | TEXT | NOT NULL | Setting value |
| setting_type | VARCHAR(20) | NOT NULL, DEFAULT 'string' | Value type |
| description | VARCHAR(500) | NULLABLE | Setting description |
| is_public | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether setting is public |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

### 20. system_logs

Application logging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| level | VARCHAR(20) | NOT NULL | Log level (INFO, WARNING, ERROR, DEBUG) |
| module | VARCHAR(100) | NOT NULL | Module name |
| message | TEXT | NOT NULL | Log message |
| details | TEXT | NULLABLE | Additional details |
| ip_address | VARCHAR(45) | NULLABLE | Client IP address |
| user_agent | VARCHAR(500) | NULLABLE | Client user agent |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

---

## Migration

To generate and run migrations:

```bash
cd backend

# Generate migration
alembic revision --autogenerate -m "initial migration"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Seed Data

To populate the database with sample data:

```bash
cd backend
python -m scripts.seed_data
```

## PostgreSQL Migration

To migrate from SQLite to PostgreSQL:

1. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/bist_elite_ai
   ```

2. Install PostgreSQL adapter:
   ```bash
   pip install psycopg2-binary
   ```

3. Run migrations:
   ```bash
   alembic upgrade head
   ```

4. Seed data:
   ```bash
   python -m scripts.seed_data
   ```

All models use SQLAlchemy types that are compatible with both SQLite and PostgreSQL.
