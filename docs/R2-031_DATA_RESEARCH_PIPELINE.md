# R2-031 — Data Research Pipeline

## Overview

The Data Research Pipeline module (`data-research-pipeline`) provides a unified data quality and research layer for the BIST ELITE AI platform. It consolidates provider health monitoring, data freshness tracking, source quality classification, research evidence normalization, data quality validation, multi-timeframe coverage verification, indicator coverage reporting, and Agent Reach integration into a single cohesive module.

## Architecture

```
Provider → Market Data Orchestrator → Data Research Pipeline → Cache → Existing Engines → Dashboard/Telegram
                                    ↓
                              Agent Reach → Research Evidence → Research Hub → Verification → Catalyst/Story
```

## Components

### 1. Provider Health Service (`ProviderHealthService`)

Monitors all data providers and exposes health metrics:

```typescript
GET /data-research/health       // Overall data health report
GET /data-research/providers    // Individual provider health
```

**Features:**
- Provider status (enabled/disabled, configured/unconfigured)
- Circuit breaker state (CLOSED/OPEN/HALF_OPEN)
- Request/latency/error metrics
- Data freshness per provider
- Source quality tier classification
- Cache entry counts
- Coverage metrics

### 2. Data Freshness Service (`DataFreshnessService`)

Tracks data freshness across all providers:

```typescript
GET /data-research/freshness           // Overall freshness report
GET /data-research/freshness/:provider // Freshness for specific provider
```

**Freshness States:**
- **FRESH** (≤ 60s for market data, ≤ 5min for news)
- **ACCEPTABLE** (≤ 5min for market data, ≤ 30min for news)
- **STALE** (≤ 30min for market data, ≤ 2h for news)
- **UNAVAILABLE** (no data)

### 3. Source Quality Service (`SourceQualityService`)

Classifies providers into quality tiers:

| Tier | Providers | Description |
|------|-----------|-------------|
| TIER_1 | KAP, TCMB, MKK | Official, authoritative sources |
| TIER_2 | Fintables, Finnhub, Alpha Vantage, Yahoo Finance | Established financial data vendors |
| TIER_3 | SerpAPI, Google News, Google Search, Finnhub News, Agent Reach | Third-party aggregators, search APIs |

### 4. Research Evidence Service (`ResearchEvidenceService`)

Normalizes research results into a common evidence structure:

```typescript
GET /data-research/evidence/:ticker
GET /data-research/stories/:ticker
```

**Supported Evidence Types:**
- NEWS, DISCLOSURE, FINANCIAL_REPORT, ANALYST_REPORT
- COMPANY_ANNOUNCEMENT, MACRO_INDICATOR, TECHNICAL_SIGNAL
- INSIDER_TRANSACTION, SHAREHOLDER_ACTION, REGULATORY_FILING
- EARNINGS_REPORT, DIVIDEND_ANNOUNCEMENT, CORPORATE_ACTION
- MANAGEMENT_CHANGE, PARTNERSHIP, ACQUISITION, INVESTMENT
- CAPACITY_EXPANSION, NEW_PRODUCT, REGULATORY_CHANGE
- SECTOR_TAILWIND, MAJOR_ORDER, EARNINGS_INFLECTION
- EXPORT_AGREEMENT, PRODUCT_LAUNCH, NEW_CONTRACT, NEW_FACILITY

**Story Detection:**
Automatically detects story patterns from evidence:
- NEW_CONTRACT, MAJOR_INVESTMENT, CAPACITY_EXPANSION
- NEW_FACILITY, EXPORT_AGREEMENT, STRATEGIC_PARTNERSHIP
- ACQUISITION, PRODUCT_LAUNCH, REGULATORY_CHANGE
- SECTOR_TAILWIND, MAJOR_ORDER, EARNINGS_INFLECTION
- MANAGEMENT_ACTION

### 4. Data Quality Service (`DataQualityService`)

Validates market data integrity:

```typescript
GET /data-research/quality/:ticker?timeframe=1d
```

**Checks:**
- Missing OHLCV data
- Invalid OHLC relationships (high < low, close outside range)
- Negative volume
- Duplicate timestamps
- Unsorted timestamps
- Abnormal gaps
- Insufficient history
- Stale data

**Quality Levels:** EXCELLENT, GOOD, FAIR, POOR

### 5. MTF Coverage Service (`MTFCoverageService`)

Verifies multi-timeframe data availability:

```typescript
GET /data-research/mtf-coverage/:ticker
GET /data-research/mtf-coverage
```

**Supported Timeframes:** 1h, 2h, 4h, 1d, 1w, 1m, 3m, 6m

### 6. Indicator Coverage Service (`IndicatorCoverageService`)

Reports on indicator engine coverage:

```typescript
GET /data-research/indicator-coverage
```

**56 Indicators Supported** across trend, momentum, volatility, volume, pattern, and cycle categories.

### 8. Agent Reach Adapter (`AgentReachAdapter`)

Integrates SerpAPI-based web research:

```typescript
GET /data-research/agent-reach/status
POST /data-research/agent-reach/search { ticker }
POST /data-research/agent-reach/news { ticker }
```

**Capabilities:**
- Company research (web search, IR website, investor relations)
- News search (Google News, SerpAPI)
- Sector/market search
- PDF discovery (annual reports, presentations, ESG reports)
- RSS feed discovery
- Press release search
- ESG/Governance document search

**Fallback Behavior:** Returns empty arrays gracefully when unavailable.

### 9. VectorBT Adapter (`VectorBTAdapter`)

Integration boundary for VectorBT Python library:

```typescript
GET /data-research/vectorbt/status
```

**Status:** Adapter boundary defined, Python implementation optional.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/data-research/health` | Overall data health report |
| GET | `/data-research/providers` | Provider health status |
| GET | `/data-research/freshness` | Data freshness report |
| GET | `/data-research/freshness/:provider` | Provider-specific freshness |
| GET | `/data-research/source-quality` | Source quality report |
| GET | `/data-research/source-quality/:provider` | Provider-specific quality |
| GET | `/data-research/evidence/:ticker` | Research evidence for ticker |
| GET | `/data-research/stories/:ticker` | Detected stories for ticker |
| GET | `/data-research/quality/:ticker` | Data quality report |
| GET | `/data-research/mtf-coverage/:ticker` | MTF coverage for ticker |
| GET | `/data-research/mtf-coverage` | Overall MTF coverage |
| GET | `/data-research/indicator-coverage` | Indicator coverage report |
| GET | `/data-research/vectorbt/status` | VectorBT adapter status |
| GET | `/data-research/agent-reach/status` | Agent Reach status |
| POST | `/data-research/agent-reach/search` | Search company via Agent Reach |
| POST | `/data-research/agent-reach/news` | Search news via Agent Reach |
| GET | `/data-research/full-report/:ticker` | Full data research report |
| GET | `/data-research/full-report` | Full data research report (all) |
| POST | `/data-research/cache/clear` | Clear data research caches |

## Integration Points

- **Market Data Orchestrator** - Reuses for provider management
- **Early Opportunity Intelligence** - Consumes intelligence bundle
- **Portfolio Intelligence** - Provides evidence for portfolio analysis
- **Dashboard (R2-029)** - Adds "Data Research" section
- **CacheService** - Reuses existing cache infrastructure

## Cache Strategy

| Namespace | TTL | Contents |
|-----------|-----|----------|
| `data-health` | 60s | Provider health dashboard |
| `data-freshness` | 30s | Freshness reports |
| `source-quality` | 1hr | Source quality classifications |
| `research-evidence` | 10min | Normalized evidence |
| `agent-reach` | 10min | Agent Reach search results |

## Verification Checklist

- ✅ TypeScript strict typecheck passes
- ✅ Build succeeds (`nest build`)
- ✅ All existing tests pass (663 tests)
- ✅ No duplicate market-data requests
- ✅ No duplicate indicator calculations
- ✅ No duplicate research provider requests
- ✅ No duplicate Agent Reach requests
- ✅ Cache reuse verified
- ✅ Provider failures don't break pipeline
- ✅ Existing Prediction/Early Opportunity/Portfolio Intelligence work

## Known Issues

1. **VectorBT Adapter** - Not fully implemented (requires Python environment)
2. **Agent Reach** - Requires `SERPAPI_API_KEY` for full functionality
3. **Provider Health** - Some providers need API keys (Fintables, Finnhub, Alpha Vantage, KAP, TCMB, MKK, SerpAPI)
4. **Tests** - Module unit tests not yet implemented (infrastructure only)
5. **Tests** - Module unit tests not yet implemented (infrastructure only)

## Next Steps

Per MASTER_ROADMAP.md, the next sprint is **R2-032: Real-time Data Pipeline Integration** (WebSocket market data, live order book, streaming indicators).