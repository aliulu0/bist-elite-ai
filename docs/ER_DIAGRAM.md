# BIST Elite AI - Database ER Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BIST ELITE AI - DATABASE ER DIAGRAM                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────────────┐
                                    │      COMPANIES       │
                                    ├──────────────────────┤
                                    │ PK id (UUID)         │
                                    │    stock_code (UNQ)  │
                                    │    company_name      │
                                    │    sector            │
                                    │    sub_sector        │
                                    │    market            │
                                    │    market_value      │
                                    │    free_float        │
                                    │    website           │
                                    │    kap_url           │
                                    │    active            │
                                    │    created_at        │
                                    │    updated_at        │
                                    └──────────┬───────────┘
                                               │
        ┌──────────────────────────────────────┼──────────────────────────────────────┐
        │                                      │                                      │
        │                                      │                                      │
        ▼                                      ▼                                      ▼
┌───────────────────┐              ┌──────────────────────┐              ┌──────────────────────┐
│   DAILY_PRICES    │              │  FINANCIAL_REPORTS   │              │  FINANCIAL_RATIOS    │
├───────────────────┤              ├──────────────────────┤              ├──────────────────────┤
│ PK id (UUID)      │              │ PK id (UUID)         │              │ PK id (UUID)         │
│ FK company_id ────┘              │ FK company_id ───────┘              │ FK company_id ───────┘
│    date (UNQ)                    │    period (UNQ)                    │    period (UNQ)      │
│    open                          │    year                            │    year              │
│    high                          │    quarter                         │    quarter           │
│    low                           │    revenue                         │    pd_dd             │
│    close                         │    gross_profit                    │    fk                │
│    volume                        │    ebitda                          │    fd_favok          │
│    turnover                      │    operating_profit                │    peg               │
│    created_at                    │    net_profit                      │    ev_sales          │
│    updated_at                    │    equity                          │    roe               │
└───────────────────┘              │    assets                          │    roa               │
                                   │    liabilities                     │    roic              │
                                   │    cash                            │    net_debt_ebitda   │
                                   │    net_debt                        │    current_ratio     │
                                   │    shares                          │    quick_ratio       │
                                   │    eps                             │    piotroski         │
                                   │    created_at                      │    altman            │
                                   │    updated_at                      │    beneish           │
                                   └──────────────────────┘             │    revenue_growth   │
                                                                        │    net_profit_growth │
        ┌──────────────────────────────────────────────────────────────┐│    ebitda_growth     │
        │                                                              ││    fcf_growth        │
        │                                                              ││    created_at        │
        ▼                                                              ││    updated_at        │
┌──────────────────────────┐                                           │└──────────────────────┘
│  TECHNICAL_INDICATORS    │                                           │
├──────────────────────────┤                                           │
│ PK id (UUID)             │                                           │
│ FK company_id ───────────┘                                           │
│    date (UNQ)                                                        │
│    sma_9, sma_20, sma_50, sma_100, sma_200                          │
│    ema_9, ema_20, ema_50, ema_100, ema_200                          │
│    rsi, stochastic_rsi, macd, macd_signal                           │
│    adx, atr, obv, cmf, vwap, mfi                                    │
│    ichimoku, supertrend                                             │
│    bollinger_upper, bollinger_middle, bollinger_lower                │
│    donchian_upper, donchian_lower                                    │
│    created_at, updated_at                                            │
└──────────────────────────┘                                           │
                                                                       │
        ┌──────────────────────────────────────────────────────────────┐│
        │                                                              ││
        ▼                                                              ▼│
┌──────────────────────────┐                              ┌──────────────────────────┐
│     ELITE_SCORES         │                              │      AI_ANALYSIS         │
├──────────────────────────┤                              ├──────────────────────────┤
│ PK id (UUID)             │                              │ PK id (UUID)             │
│ FK company_id ───────────┘                              │ FK company_id ───────────┘
│    analysis_date                                        │    analysis_type         │
│    weekly_score                                         │    model_name            │
│    one_month_score                                      │    prompt                │
│    three_month_score                                    │    response              │
│    five_month_score                                     │    confidence            │
│    one_year_score                                       │    sentiment             │
│    technical_score                                      │    language              │
│    fundamental_score                                    │    created_at            │
│    smart_money_score                                    │    updated_at            │
│    story_score                                          └──────────────────────────┘
│    risk_score
│    explosion_score        ┌──────────────────────────┐
│    elite_score            │     NOTIFICATIONS        │
│    created_at             ├──────────────────────────┤
│    updated_at             │ PK id (UUID)             │
└──────────────────────────┘ FK company_id (NULL)      │
                           │    type                   │
                           │    title                  │
                           │    message                │
                           │    severity               │
                           │    is_read                │
                           │    is_sent                │
                           │    sent_via               │
                           │    created_at             │
                           │    updated_at             │
                           └──────────────────────────┘

┌──────────────────────────┐              ┌──────────────────────────┐
│      WATCHLISTS          │              │    SAVED_FILTERS         │
├──────────────────────────┤              ├──────────────────────────┤
│ PK id (UUID)             │              │ PK id (UUID)             │
│    name                  │              │    name                  │
│    description           │              │    description           │
│    sort_order            │              │    filter_config (JSON)  │
│    created_at            │              │    is_default            │
│    updated_at            │              │    is_deleted            │
└──────────┬───────────────┘              │    deleted_at            │
           │                              │    created_at            │
           ▼                              │    updated_at            │
┌──────────────────────────┐              └──────────────────────────┘
│   WATCHLIST_ITEMS        │
├──────────────────────────┤              ┌──────────────────────────┐
│ PK id (UUID)             │              │      BACKTESTS           │
│ FK watchlist_id          │              ├──────────────────────────┤
│ FK company_id            │              │ PK id (UUID)             │
│    sort_order            │              │    name                  │
│    notes                 │              │    description           │
│    created_at            │              │    strategy              │
│    updated_at            │              │    start_date            │
└──────────────────────────┘              │    end_date              │
                                          │    initial_capital       │
                                          │    final_capital         │
┌──────────────────────────┐              │    total_return          │
│      PORTFOLIOS          │              │    annual_return         │
├──────────────────────────┤              │    max_drawdown          │
│ PK id (UUID)             │              │    sharpe_ratio          │
│    name                  │              │    win_rate              │
│    description           │              │    total_trades          │
│    total_value           │              │    status                │
│    total_cost            │              │    config (JSON)         │
│    total_profit          │              │    is_deleted            │
│    is_deleted            │              │    deleted_at            │
│    deleted_at            │              │    created_at            │
│    created_at            │              │    updated_at            │
│    updated_at            │              └──────────┬───────────────┘
└──────────┬───────────────┘                         │
           │                                         ▼
           ▼                              ┌──────────────────────────┐
┌──────────────────────────┐              │   BACKTEST_RESULTS       │
│   PORTFOLIO_ITEMS        │              ├──────────────────────────┤
├──────────────────────────┤              │ PK id (UUID)             │
│ PK id (UUID)             │              │ FK backtest_id           │
│ FK portfolio_id          │              │ FK company_id            │
│ FK company_id            │              │    total_return          │
│    quantity              │              │    annual_return         │
│    average_price         │              │    max_drawdown          │
│    current_price         │              │    sharpe_ratio          │
│    profit                │              │    win_rate              │
│    profit_percent        │              │    total_trades          │
│    created_at            │              │    created_at            │
│    updated_at            │              │    updated_at            │
└──────────────────────────┘              └──────────────────────────┘

┌──────────────────────────┐              ┌──────────────────────────┐
│  TELEGRAM_SETTINGS       │              │   SECTOR_STRENGTH        │
├──────────────────────────┤              ├──────────────────────────┤
│ PK id (UUID)             │              │ PK id (UUID)             │
│    bot_token             │              │    sector                │
│    chat_id               │              │    date                  │
│    enabled               │              │    strength_score        │
│    notifications_enabled │              │    momentum              │
│    daily_report          │              │    relative_strength     │
│    price_alerts          │              │    breadth               │
│    analysis_alerts       │              │    leading_stock         │
│    created_at            │              │    lagging_stock         │
│    updated_at            │              │    created_at            │
└──────────────────────────┘              │    updated_at            │
                                          └──────────────────────────┘
┌──────────────────────────┐              ┌──────────────────────────┐
│   MARKET_SUMMARY         │              │  APPLICATION_SETTINGS    │
├──────────────────────────┤              ├──────────────────────────┤
│ PK id (UUID)             │              │ PK id (UUID)             │
│    date (UNQ)            │              │    setting_key (UNQ)     │
│    bist_100              │              │    setting_value         │
│    bist_100_change       │              │    setting_type          │
│    bist_100_change_pct   │              │    description           │
│    total_volume          │              │    is_public             │
│    total_turnover        │              │    created_at            │
│    advancing             │              │    updated_at            │
│    declining             │              └──────────────────────────┘
│    unchanged             │
│    new_highs             │              ┌──────────────────────────┐
│    new_lows              │              │     SYSTEM_LOGS          │
│    foreign_net_buy       │              ├──────────────────────────┤
│    usd_try               │              │ PK id (UUID)             │
│    eur_try               │              │    level                 │
│    gold_price            │              │    module                │
│    created_at            │              │    message               │
│    updated_at            │              │    details               │
└──────────────────────────┘              │    ip_address            │
                                          │    user_agent            │
                                          │    created_at            │
                                          │    updated_at            │
                                          └──────────────────────────┘

┌──────────────────────────┐
│     SYSTEM_LOGS          │
├──────────────────────────┤
│ PK id (UUID)             │
│    level                 │
│    module                │
│    message               │
│    details               │
│    ip_address            │
│    user_agent            │
│    created_at            │
│    updated_at            │
└──────────────────────────┘


╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      RELATIONSHIPS                                                ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                    ║
║  companies ──1:N──> daily_prices          (company.id = daily_prices.company_id)                  ║
║  companies ──1:N──> financial_reports     (company.id = financial_reports.company_id)             ║
║  companies ──1:N──> financial_ratios      (company.id = financial_ratios.company_id)              ║
║  companies ──1:N──> technical_indicators  (company.id = technical_indicators.company_id)          ║
║  companies ──1:N──> elite_scores          (company.id = elite_scores.company_id)                  ║
║  companies ──1:N──> watchlist_items       (company.id = watchlist_items.company_id)               ║
║  companies ──1:N──> backtest_results      (company.id = backtest_results.company_id)              ║
║  companies ──1:N──> portfolio_items       (company.id = portfolio_items.company_id)               ║
║  companies ──1:N──> ai_analysis           (company.id = ai_analysis.company_id)                   ║
║  companies ──1:N──> notifications         (company.id = notifications.company_id)                 ║
║                                                                                                    ║
║  watchlists ──1:N──> watchlist_items      (watchlist.id = watchlist_items.watchlist_id)           ║
║  backtests ──1:N──> backtest_results      (backtest.id = backtest_results.backtest_id)            ║
║  portfolios ──1:N──> portfolio_items      (portfolio.id = portfolio_items.portfolio_id)           ║
║                                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝


╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      INDEXES                                                      ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                    ║
║  companies:                                                                                        ║
║    - stock_code (UNIQUE)                                                                          ║
║    - company_name                                                                                  ║
║    - sector, sub_sector                                                                            ║
║    - market                                                                                        ║
║    - active                                                                                        ║
║    - sector + market (composite)                                                                   ║
║    - active + sector (composite)                                                                   ║
║    - market_value                                                                                  ║
║                                                                                                    ║
║  daily_prices:                                                                                     ║
║    - company_id + date (UNIQUE)                                                                   ║
║    - date                                                                                          ║
║    - company_id                                                                                    ║
║                                                                                                    ║
║  financial_reports:                                                                                ║
║    - company_id + period (UNIQUE)                                                                 ║
║    - company_id + year                                                                            ║
║    - company_id + quarter                                                                         ║
║    - year + quarter                                                                                ║
║                                                                                                    ║
║  financial_ratios:                                                                                 ║
║    - company_id + period (UNIQUE)                                                                 ║
║    - company_id + year                                                                            ║
║    - roe                                                                                           ║
║    - fk                                                                                            ║
║                                                                                                    ║
║  technical_indicators:                                                                             ║
║    - company_id + date (UNIQUE)                                                                   ║
║    - date                                                                                          ║
║    - company_id                                                                                    ║
║    - rsi                                                                                           ║
║                                                                                                    ║
║  elite_scores:                                                                                     ║
║    - company_id + analysis_date (UNIQUE)                                                          ║
║    - elite_score                                                                                   ║
║    - analysis_date                                                                                 ║
║    - company_id                                                                                    ║
║                                                                                                    ║
║  watchlist_items:                                                                                  ║
║    - watchlist_id + company_id (UNIQUE)                                                           ║
║    - watchlist_id                                                                                  ║
║    - company_id                                                                                    ║
║                                                                                                    ║
║  backtest_results:                                                                                 ║
║    - backtest_id + company_id (UNIQUE)                                                            ║
║    - backtest_id                                                                                   ║
║    - company_id                                                                                    ║
║                                                                                                    ║
║  portfolio_items:                                                                                  ║
║    - portfolio_id + company_id (UNIQUE)                                                           ║
║    - portfolio_id                                                                                  ║
║    - company_id                                                                                    ║
║                                                                                                    ║
║  ai_analysis:                                                                                      ║
║    - company_id                                                                                    ║
║    - analysis_type                                                                                 ║
║    - company_id + analysis_type (composite)                                                       ║
║    - created_at                                                                                    ║
║                                                                                                    ║
║  notifications:                                                                                    ║
║    - type                                                                                          ║
║    - severity                                                                                      ║
║    - is_read                                                                                       ║
║    - created_at                                                                                    ║
║                                                                                                    ║
║  sector_strength:                                                                                  ║
║    - sector + date (UNIQUE)                                                                       ║
║    - date                                                                                          ║
║    - strength_score                                                                                ║
║                                                                                                    ║
║  market_summary:                                                                                   ║
║    - date (UNIQUE)                                                                                ║
║                                                                                                    ║
║  application_settings:                                                                             ║
║    - setting_key (UNIQUE)                                                                         ║
║    - is_public                                                                                     ║
║                                                                                                    ║
║  system_logs:                                                                                       ║
║    - level                                                                                         ║
║    - module                                                                                        ║
║    - created_at                                                                                    ║
║                                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```
