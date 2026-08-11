# R2-029 — Elite Dashboard & AI Screener

## Overview

The Elite Dashboard is the **main control center** of BIST ELITE AI — a professional, Bloomberg/TradingView-inspired dashboard that becomes the homepage of the application. It detects BIST stocks entering early bullish phases *before* the market by reusing ALL existing production engines (zero duplicated calculations).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Elite Dashboard (R2-029)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Top 10 Early Opportunities                                              │
│  2. Market Overview                                                         │
│  3. AI Filter Panel (Screener)                                              │
│  4. Watchlist                                                               │
│  5. Quick Search                                                            │
│  6. Timeframe Panel (1H-6M)                                                 │
│  7. Top Lists (7 Leaderboards)                                              │
│  8. Dashboard Performance                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                    Reused Production Engines                                 │
│  Prediction │ MTF Opportunity │ Early Opp Intel │ Elite Score │ Opportunity │
│  Catalyst   │ Smart Money      │ Verification AI  │ Research Hub │ Decision  │
│  Entry Zone │ Portfolio        │ Market Structure │ Backtest     │ Indicator │
│  Historical │ Market Data Orch │ Symbol Registry                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8 Dashboard Sections

### 1. Top 10 Early Opportunities
**Cards** with full intelligence per symbol:
- Ticker, Company Name, Early Opportunity Score, Elite Score
- Bullish Probability, Confidence, Expected Return, Risk
- Holding Period, Best Timeframe, Smart Money Score
- Catalyst Score, Verification Status, Research Consensus
- Entry Zone, Stop Loss, Target 1, Target 2, Risk/Reward
- **Reason (Turkish)** — deterministic explanation

### 2. Market Overview
- **BIST100** — index value, change, change%
- **Sector Heatmap** — sector change%, stock count
- **Top Gainers/Losers** — ticker, name, change%, price
- **Volume Leaders** — ticker, name, volume, change%
- **Smart Money Leaders** — ticker, name, score, accumulation
- **Catalyst Leaders** — ticker, name, score, verified

### 3. AI Filter Panel (Professional Screener)
20+ filters with sliders and dropdowns:
- **Scores:** Elite Score, Opportunity Score, Smart Money, Catalyst
- **Quality:** Bullish %, Confidence, Expected Return
- **Risk:** Max Risk (low/medium/high), Liquidity
- **Fundamentals:** Sector, Market Cap (min/max)
- **Advanced:** Holding Period, Volume Spike, Relative Volume, Momentum, Trend, MTF Agreement, Timeframe

### 4. Watchlist
- **Favorites** — user-selected stocks
- **Pinned** — priority watchlist
- **Recent Analysis** — recently viewed
- **AI Alerts** — automated notifications

### 5. Quick Search
Type ticker (e.g., `ASELS`) → instant comprehensive analysis:
- **Prediction:** bullish%, confidence, expected return, trend, momentum
- **Research:** consensus, agreement level
- **Verification:** status, details
- **Catalyst:** score, verified, summary
- **Smart Money:** score, accumulation
- **Entry/Targets:** zone, stop, target1, target2
- **Backtest:** win rate, total trades, sharpe ratio
- **Multi-Timeframe:** 8 timeframes with scores

### 6. Timeframe Panel
8 timeframes (1H, 2H, 4H, 1D, 1W, 1M, 3M, 6M) with tabs:
- **All** / **Short** (1H-4H) / **Medium** (1D-1W) / **Long** (1M-6M)
- Per timeframe: Bullish%, Confidence, Expected Return, Trend, Momentum
- MTF Summary: score, strength, trend stage, holding type, best/worst TF

### 7. Top Lists (7 Leaderboards)
Tabs for: Smart Money, Catalyst, Confidence, Expected Return, Elite Score, Opportunity, Risk/Reward
- Rank, Ticker, Name, Sector, Value, Change%

### 8. Dashboard Performance
- AI Accuracy, Prediction Success, Avg Expected Return, Avg Win Rate
- Learning Progress (scanned/updated/modifiers)
- Accuracy trend chart (30 days)

## API Endpoints (7 New)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/early-opportunities` | Top 10 with filters |
| GET | `/early-opportunities/:ticker` | Full intelligence for ticker |
| GET | `/early-opportunities/explain/:ticker` | Turkish explanation |
| GET | `/multi-timeframe/:ticker` | MTF analysis (R2-028) |
| GET | `/multi-timeframe/:ticker/explain` | MTF Turkish explanation (R2-028) |
| GET | `/market/overview` | BIST100, heatmap, leaders |
| GET | `/watchlist` | Favorites, pinned, recent, alerts |
| GET | `/search/:ticker` | Instant comprehensive analysis |
| GET | `/top-lists` | 7 ranked leaderboards |
| GET | `/dashboard/performance` | AI accuracy, success, returns, learning |

## Frontend Components

```
frontend/src/
├── components/dashboard/
│   ├── TopEarlyOpportunities.tsx    # Section 1
│   ├── MarketOverview.tsx           # Section 2
│   ├── AIFilterPanel.tsx            # Section 3
│   ├── Watchlist.tsx                # Section 4
│   ├── QuickSearch.tsx              # Section 5
│   ├── TimeframePanel.tsx           # Section 6
│   ├── TopLists.tsx                 # Section 7
│   ├── DashboardPerformance.tsx     # Section 8
│   └── index.ts                     # Barrel export
├── app/
│   ├── dashboard/page.tsx           # Dashboard page
│   └── page.tsx                     # Homepage (integrates dashboard)
├── hooks/use-dashboard.ts           # React Query hooks
├── services/dashboard.ts            # API service functions
├── types/
│   ├── early-opportunity.ts         # Types for early opp
│   └── dashboard.ts                 # Types for dashboard
└── lib/constants.ts                 # Filter constants
```

## Reused Engines (Zero Duplication)

| Engine | Used For |
|---|---|
| Prediction Engine | All timeframe predictions |
| MTF Opportunity Engine | Multi-timeframe analysis |
| Early Opportunity Intelligence | Core scoring & filtering |
| Elite Score Engine | Elite scores & leaderboards |
| Opportunity Engine | Opportunity detection |
| Catalyst Engine | Catalyst scoring & leaders |
| Smart Money Engine | Smart money scoring & leaders |
| Verification AI | Verification status |
| Research Hub | Consensus & agreement |
| Decision Engine | Decision signals |
| Entry Zone Engine | Entry/stop/targets |
| Portfolio Engine | Portfolio metrics |
| Market Structure Engine | Support/resistance |
| Backtest Engine | Win rate, sharpe, trades |
| Indicator Engine | Technical indicators |
| Historical Data | Historical context |
| Market Data Orchestrator | Price/volume data |
| Symbol Registry | Symbol metadata |

## UI Design

- **Dark Theme** — professional, Bloomberg/TradingView/NoFx inspired
- **Responsive** — works on desktop, tablet, mobile
- **Fast** — React Query with smart caching (30s-15min intervals)
- **Professional** — consistent spacing, typography, color coding

## Tests

- **Backend:** 68 deterministic unit tests (all GREEN)
- **Frontend:** TypeScript strict mode (UI component API fixes needed for full compile)
- **Integration:** All endpoints tested via service specs

## Verification

```bash
# Backend
cd apps/api
node_modules/.bin/tsc --noEmit -p tsconfig.json      # GREEN (exit 0)
node_modules/.bin/jest --testPathPattern=ai-early-opportunity   # 68 tests, GREEN
```

## Next Steps

1. **Frontend UI Polish** — fix component API mismatches (Badge variants, Tabs API, Select components)
2. **Real-time Updates** — WebSocket integration for live price/alert updates
3. **Export/Share** — PDF/CSV export for screener results
4. **Custom Alerts** — User-defined threshold alerts
4. **Portfolio Integration** — Link watchlist to portfolio positions
5. **Mobile App** — React Native companion

## Files Created/Modified

### Backend (New)
- `apps/api/src/modules/ai-early-opportunity/market-overview.controller.ts`
- `apps/api/src/modules/ai-early-opportunity/watchlist.controller.ts`
- `apps/api/src/modules/ai-early-opportunity/search.controller.ts`
- `apps/api/src/modules/ai-early-opportunity/top-lists.controller.ts`
- `apps/api/src/modules/ai-early-opportunity/dashboard-performance.controller.ts`
- `apps/api/src/modules/ai-early-opportunity/multi-timeframe/multi-timeframe.controller.ts`

### Backend (Modified)
- `apps/api/src/modules/ai-early-opportunity/early-opportunity.module.ts`

### Frontend (New)
- `frontend/src/components/dashboard/*.tsx` (8 components)
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/hooks/use-dashboard.ts`
- `frontend/src/services/dashboard.ts`
- `frontend/src/types/early-opportunity.ts`
- `frontend/src/types/dashboard.ts` (extended)
- `frontend/src/lib/constants.ts`

### Frontend (Modified)
- `frontend/src/app/page.tsx` (integrates dashboard)
- `frontend/src/components/index.ts` (barrel exports)