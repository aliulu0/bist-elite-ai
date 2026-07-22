# Financial Engine Module

Enterprise-grade financial analysis engine for BIST Elite AI.

## Overview

The Financial Engine provides comprehensive financial statement storage, ratio calculation, quality scoring, and growth analysis for Borsa Istanbul companies. It serves as the financial core consumed by Elite Score, AI Analysis, Backtest, Screener, Portfolio Optimizer, Telegram Alerts, Strategy Builder, and Risk Engine.

## Architecture

```
modules/financial/
├── api/router.py              # 8 REST endpoints
├── calculators/               # Pure calculation engines
│   ├── ratio_calculator.py    # P/E, P/B, EV/EBITDA, EV/Sales, PEG, Price/Sales
│   ├── margin_calculator.py   # Gross, Operating, EBITDA, Net, FCF margins
│   ├── growth_calculator.py   # QoQ, YoY, CAGR (3Y/5Y), TTM, Rolling
│   ├── profitability_calculator.py  # ROE, ROA, ROIC, ROCE, Gross Return
│   ├── debt_calculator.py     # D/E, D/A, Net Debt/EBITDA, Current/Quick/Cash
│   ├── efficiency_calculator.py  # Asset/Inventory/Receivable Turnover, CCC
│   └── quality_calculator.py  # Piotroski F, Altman Z, Beneish M, composite scores
├── models/
│   ├── financial_statement.py   # Income + Balance Sheet + Cash Flow (47 fields)
│   ├── financial_ratio.py       # 72 calculated ratio fields
│   ├── financial_dividend.py    # Dividend history
│   ├── financial_capital_event.py  # Splits, bonuses, rights issues
│   ├── financial_quality_score.py  # Quality metrics
│   └── financial_calculation_log.py  # Audit trail
├── schemas/                  # Pydantic request/response models
├── validators/               # Input validation (period, consistency, duplicates)
├── repositories/             # SQLAlchemy CRUD + aggregation
├── providers/                # Data fetching (Mock + KAP)
├── services/
│   ├── calculation_service.py  # Orchestrates all calculators
│   └── financial_service.py    # Main orchestration + caching
└── tests/                    # 188 tests
```

## Database Tables

| Table | Description |
|-------|-------------|
| `financial_statements` | Raw financial data (47 columns: IS + BS + CF) |
| `fin_engine_ratios` | 72 calculated ratio/margin/growth fields |
| `financial_dividends` | Dividend history with yield and payout |
| `financial_capital_events` | Corporate actions (split, bonus, rights) |
| `financial_quality_scores` | Piotroski, Altman, Beneish + composite scores |
| `financial_calculation_logs` | Update audit trail |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/financial/latest/{stock}` | Latest statement + ratios + quality |
| GET | `/financial/history/{stock}` | Historical statements |
| GET | `/financial/ratios/{stock}` | All calculated ratios |
| GET | `/financial/growth/{stock}` | Growth metrics (QoQ, YoY, CAGR) |
| GET | `/financial/dividends/{stock}` | Dividend history |
| GET | `/financial/quality/{stock}` | Quality scores |
| POST | `/financial/update` | Update single stock |
| POST | `/financial/update-all` | Update all active companies |

## Calculated Metrics

### Valuation Ratios
P/E, P/B, EV/EBITDA, EV/Sales, PEG, Price/Sales, Enterprise Value

### Margins
Gross, Operating, EBITDA, Net, FCF

### Growth
Quarterly, Yearly, CAGR 3Y, CAGR 5Y (Revenue, Profit, EPS, Book Value, EBITDA, FCF)

### TTM (Trailing Twelve Months)
Revenue, Net Profit, EPS, EBITDA, FCF

### Profitability
ROE, ROA, ROIC, ROCE, Gross Return

### Debt Analysis
Debt/Equity, Debt/Assets, Net Debt/EBITDA, Interest Coverage, Current Ratio, Quick Ratio, Cash Ratio

### Efficiency
Asset Turnover, Inventory Turnover, Receivable Turnover, Cash Conversion Cycle

### Quality Scores
- **Piotroski F Score** (0-9): Financial strength
- **Altman Z Score**: Bankruptcy risk
- **Beneish M Score**: Earnings manipulation detection
- **Financial Strength Score** (0-100): Composite debt/solvency
- **Profitability Score** (0-100): Composite returns
- **Growth Score** (0-100): Composite growth momentum
- **Dividend Quality Score** (0-100): Payout sustainability

## Validation

- Period format enforcement (YYYYQN)
- Report type validation (quarterly/annual/ttm/restated/historical)
- Financial consistency checks (Assets = Liabilities + Equity)
- Duplicate detection across stock + period + report type
- Negative value rejection for revenue, assets
- Share count positivity check
- EPS vs Diluted EPS warnings

## Testing

```bash
# Run financial engine tests
python -m pytest tests/financial/ -v

# Run with coverage
python -m pytest tests/financial/ --cov=modules.financial --cov-report=term-missing
```

188 tests covering validators, calculators, repositories, services, and API endpoints.
