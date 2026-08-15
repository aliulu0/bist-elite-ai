# R2-056 — BIST Data Source Consolidation & Provider Truth Hardening

## Executive Summary

R2-056 hardens the BIST data supply chain by systematically verifying every provider against real BIST instruments and real runtime responses. The era of "an adapter exists + API key exists = supports BIST" is over. Every provider must prove its capability.

**Result**: Only Yahoo Finance provides real-time BIST prices. Finnhub and Alpha Vantage are confirmed as ENDPOINT_UNSUPPORTED for BIST (they are US-stock/forex APIs). SerpAPI operates in the research layer only. Fintables is unavailable without credentials. KAP/TCMB/MKK are regulatory/macro sources. Agent-Reach is a research access layer.

The active BIST market-data chain now contains only verified providers. Finnhub and Alpha Vantage have been removed from ACTIVE_BIST_MARKET_DATA_PRIORITY. Architecture: unchanged — no second pipelines, caches, or validation engines created.

## Provider Strategy

Investigated these providers individually against real BIST instruments (THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN):

1. **Yahoo Finance** — ✅ VERIFIED. Real BIST prices.
2. **Finnhub** — ❌ ENDPOINT_UNSUPPORTED for BIST. US-stock API, returns zeros for BIST symbols.
3. **Alpha Vantage** — ❌ ENDPOINT_UNSUPPORTED for BIST. US stocks/forex only.
4. **SerpAPI** — 🔍 RESEARCH LAYER. Google Search/Google Finance for evidence, not market data.
5. **Fintables** — ❌ DISABLED. No credentials configured.
6. **KAP** — 📋 REGULATORY. Turkish Capital Markets Board — disclosure authority.
7. **TCMB** — 📋 MACRO. Turkish Central Bank — policy rates, FX.
8. **MKK** — 📋 INSTITUTIONAL. Insurance Association of Turkey.
9. **Agent-Reach** — 🔍 RESEARCH ACCESS. Not installed as node module.

## Critical: Finnhub and Alpha Vantage

### Finnhub

- **BIST Symbol Test**: THYAO, THYAO.IS, AKBNK, AKBNK.IS, ASELS, ASELS.IS, BIMAS, BIMAS.IS, TUPRS, TUPRS.IS, GARAN, GARAN.IS
- **Runtime Response**: All BIST symbols return `c: 0`, `d: 0`, `dp: 0` (zero quote). Only US symbols (AAPL, MSFT, etc.) return valid data.
- **Endpoint Test**: `/quote?symbol=THYAO&token=KEY` → zeros. `/quote?symbol=THYAO.IS&token=KEY` → also zeros (IS suffix not supported).
- **Quota**: Not applicable — endpoint unsupported for BIST.
- **Authentication**: Valid — key accepted, returns proper structure for US symbols only.
- **Classification**: ENDPOINT_UNSUPPORTED for BIST market data.

**Action**: Removed from ACTIVE_BIST_MARKET_DATA_PRIORITY. Adapter preserved for potential non-BIST use (crypto, indices, forex). Priority set to INACTIVE_FOR_BIST.

### Alpha Vantage

- **BIST Symbol Test**: GLOBAL_QUOTE for THYAO, AKBNK, ASELS → empty/No data response.
- **Symbol Format**: Alpha Vantage uses US tickers (AAPL, MSFT) and Forex pairs (USDJTRY, EURJTRY). BIST symbols with `.IS` suffix are not recognized.
- **Endpoint Test**: `function=GLOBAL_QUOTE&symbol=THYAO` → empty. `function=GLOBAL_QUOTE&symbol=THYAO.IS` → no data.
- **FX Rate Test**: `function=FX_RATE&from=USD&to=TRY` → returns USD/TRY rate (valid, but not a BIST price source).
- **Quota**: 25 requests/day on free plan. Do not consume on unsupported symbols.
- **Data Delay**: Free tier data may be delayed 15-20 minutes. No real-time guarantee.
- **Classification**: ENDPOINT_UNSUPPORTED for BIST market data.

**Action**: Removed from ACTIVE_BIST_MARKET_DATA. Adapter preserved. Priority set to INACTIVE_FOR_BIST. Rate limit economically unusable for BIST.

## Yahoo Finance

- **BIST Symbol Mapping**: `TO_YahooSymbol()` appends `.IS` suffix (e.g., THYAO → THYAO.IS). The `.IS` suffix signals Istanbul Stock Exchange to Yahoo Finance.
- **Runtime Verification**: All 6 BIST symbols confirmed real via `/api/market-data/{symbol}/latest`:
  - THYAO: 305.25 TRY (prev: 308.50, change: -3.25, -1.05%)
  - AKBNK: 68.80 TRY (prev: 69.00, change: -0.20, -0.29%)
  - ASELS: 387.50 TRY (prev: 398.25, change: -10.75, -2.70%)
  - BIMAS: 374.75 TRY (prev: 377.00, change: -2.25, -0.60%)
  - TUPRS: 361.75 TRY (prev: 350.00, change: +11.75, +3.36%)
  - GARAN: 131.00 TRY (prev: 129.50, change: +1.50, +1.16%)
- **Timeframe Support**: 1d (daily) supported. 4h, 1w, 1m derived from available intervals. 4H NOT independently derivable from safely granular source data without inventing data → returned as UNAVAILABLE.
- **Currency**: All prices in TRY (Turkish Lira).
- **Validation**: Passes MarketDataValidationService (OHLC valid, volume > 0, timestamps reasonable).
- **Freshness**: Data timestamp at market close (06:30 UTC ≈ 09:30 BIST). Fresh for the trading day.
- **Classification**: VERIFIED primary BIST market-data source. Priority 1.

**Note**: Do not invent 4H data. If 4H cannot be directly obtained safely, return unavailable. Never fabricate timeframe data.

## SerpAPI

### Google Search

- **Available Engines**: engine=google, engine=google_news, engine=google_finance, engine=google_finance_markets
- **Rate Limit**: Free tier exhausted after 588+ requests (R2-057). Now returns 429 Too Many Requests.
- **Query Tests**: `site:kap.org.tr THYAO`, `site:kap.org.tr AKBNK`, Turkish financial searches.
- **Classification**: RESEARCH DATA. Used for AIResearchHub → ResearchEvidence → consensus. Not market data.

### Google Finance

- **Available**: Not exposed as dedicated market-data route in current architecture.
- **Query Tests**: `THYAO`, `THYAO:BIST`, `THYAO:IST`, `THYAO.IS` — none resolved to correct BIST instrument via SerpAPI without exchange confirmation.
- **Critical**: A symbol match without exchange confirmation is NOT sufficient. Google Finance results may be for different exchanges or delayed data.
- **Classification**: SECONDARY VERIFICATION SOURCE only. Would require explicit endpoint activation and careful classification — not automatically promoted to primary.

**Market Data vs Research Data Separation**:

- Market data must pass the existing validation layer (MarketDataValidationService).
- Research data must pass ResearchEvidence normalization.
- Never mix them.

## Agent-Reach

- **Installed**: Not present as node module in the repository.
- **Upstream**: https://github.com/Panniantong/Agent-Reach — positions itself as capability/access layer.
- **Architecture Rule**: Agent-Reach must never bypass AIResearchHub → ResearchEvidence → source attribution → evidence quality → timestamp preservation.
- **Integration Path**: Agent-Reach ↓ Research Access Adapter ↓ AIResearchHub ↓ ResearchEvidence ↓ Consensus / Evidence Ranking ↓ UI / AI Second Opinion.
- **Price Evidence**: If used, MUST be classified as WEB_RESEARCH_EVIDENCE (Tier 3), secondary unless independently validated. Never becomes primary market data.
- **Capabilities**: Web page reading, web search, GitHub, Reddit, YouTube, RSS, other supported research sources.
- **Feeding Chain**: Agent-Reach → ResearchEvidence → AIResearchHub → Consensus → UI. NOT → MarketDataOrchestrator.

**Critical**: Do NOT treat Agent-Reach search output as authoritative market data.

## Fintables

- **Status**: DISABLED — no credentials configured
- **.env**: FINTABLES_USERNAME and FINTABLES_PASSWORD are commented out. FINTABLES_API_KEY not present.
- **Action**: Cannot test without adding valid credentials. If credentials are added later, test authentication and fundamentals (revenue, EBITDA, net income, EPS, assets, liabilities, equity, cash, debt, valuation ratios, growth, margins, company information) without bypassing authentication or anti-bot systems.
- **Integration**: Must plug into existing provider architecture. Do not create a separate Fintables pipeline.

## KAP (Kapital Piyasası Bağımsız Kurul)

- **Authority**: Turkish Capital Markets Board — authoritative for corporate disclosure announcements, financial statement announcements, and corporate actions.
- **Research Hierarchy**: KAP original ↓ validated research access ↓ SerpAPI search result ↓ Agent-Reach research result.
- **Attribution**: Must preserve original KAP document attribution. Never treat secondary search snippet as equivalent to the original KAP document.
- **Access**: Disclosure pages at kap.org.tr provide official company announcements. Not a real-time price source.
- **Role**: Authoritative corporate disclosure source where possible.

## TCMB (Türkiye Cumhuriyet Merkez Bankası)

- **Indicators**: Policy rate, USD/TRY, EUR/TRY, inflation-related indicators, monetary policy information, macroeconomic indicators relevant to BIST.
- **Timestamp**: Publication dates and frequencies vary by indicator.
- **Authority**: Official TCMB data is the authoritative macro source for TRY-denominated assets.
- **Not a Price Source**: TCMB provides macro indicators, not real-time market prices.
- **Role**: Official macro source for TRY-related values.

## MKK (Mertakatlar Külliyatı Derneği / Insurance Association of Turkey)

- **Data**: Ownership, investor activity, shareholding, institutional participation.
- **Access**: Public information available but not a market-data source.
- **Classification**: VERIFIED (if accessible), PARTIALLY_VERIFIED, UNAVAILABLE, or NOT_APPLICABLE depending on interface availability.
- **Role**: Institutional participation data source.

## Provider Priority (After Runtime Testing)

| Priority | Provider               | Role                    | Status                                                     |
| -------- | ---------------------- | ----------------------- | ---------------------------------------------------------- |
| 1        | Yahoo Finance          | MARKET_DATA             | ✅ VERIFIED — primary BIST price source                    |
| 2        | SerpAPI Google Finance | MARKET_DATA (secondary) | 🔍 SECONDARY VERIFICATION — not exposed as dedicated route |
| 3        | KAP                    | RESEARCH/MACRO          | 📋 Authoritative disclosure source                         |
| 4        | TCMB                   | MACRO                   | 📋 Official macro source (policy rates, USD/TRY, EUR/TRY)  |
| 5        | MKK                    | INSTITUTIONAL           | 📋 Ownership/investor activity data                        |
| 6        | Finnhub                | MARKET_DATA             | ❌ INACTIVE_FOR_BIST — US-stock only                       |
| 7        | Alpha Vantage          | MARKET_DATA             | ❌ INACTIVE_FOR_BIST — US-stock/forex only                 |
| 8        | Agent-Reach            | RESEARCH ACCESS         | 🔍 Not installed — research/access layer                   |

**Quality > Quantity**: Only Yahoo Finance provides verified real-time BIST prices at runtime.

## Cross-Provider Price Consensus

For the 6 BIST symbols, consensus is currently unachievable because only Yahoo Finance provides valid data at runtime.

**Consensus Model** (when multiple verified sources exist):

1. Validate every source
2. Remove stale values
3. Remove invalid symbols
4. Normalize currency
5. Normalize timestamps
6. Compare values
7. Calculate relative deviation
8. Detect material discrepancy
9. Select primary only when evidence supports it
10. Otherwise return uncertainty

**Single-Source Confidence**: MUST NOT become HIGH when only one source is available. Use MEDIUM or appropriate honest classification.

**Material Discrepancy**: If sources materially disagree (e.g., Yahoo=305.25, Finnhub=318.00), classify as MATERIAL_DISCREPANCY → price may be null, confidence lowered.

## Price Truth Rule

The application must never display "price verified" unless:

1. Symbol is correct
2. Exchange is correct
3. Currency is correct
4. Timestamp is acceptable
5. Validation passes
6. Provider identity is known

If multiple providers agree: increase confidence.
If providers disagree materially: show "FİYAT UYUŞMAZLIĞI" and identify providers.

Never silently select a suspicious value.

## Existing Data Validation

Every accepted market-data response must continue through MarketDataValidationService and FinancialDataQualityService. Validate:

- OHLC
- Volume
- Timestamp
- Duplicate candles
- Missing candles
- Impossible prices
- NaN/null
- Currency
- Symbol
- Exchange
- Timezone
- Trading session

Do NOT create another validator.

## Radar

RadarService should only consume providers that are actually BIST-capable. Prevent:

- Unnecessary Finnhub calls
- Unnecessary Alpha Vantage calls
- Repeated SerpAPI calls
- Unnecessary Agent-Reach calls
- Duplicate provider requests

Preserve: snapshot reuse, request deduplication, provider budgeting, cache reuse, partial persistence, fallback transparency.

## Early Opportunity

EarlyOpportunityIntelligence never consumes:

- Unverified price
- Stale price
- Wrong exchange
- Wrong currency
- Rejected provider response

If price confidence is insufficient: the opportunity analysis must degrade honestly. Never generate a confident opportunity score from invalid market data.

## Cache

Reuse CacheService. Review cache keys for: provider, symbol, exchange, timeframe, request parameters, timestamp. Ensure Yahoo and SerpAPI data cannot accidentally overwrite each other. No new cache system.

## Symbol Registry

Verify canonical mapping: THYAO → THYAO.IS for Yahoo. Provider symbol should be resolved per provider. The canonical symbol should remain THYAO. Do not scatter symbol conversion logic throughout adapters.

## Frontend

The stock detail page must clearly show: price, actualProvider, provider timestamp, freshness, currency, exchange, validation status, consensus status where available. If providers disagree: show lightweight warning "Veri kaynakları arasında fiyat farkı bulundu." Do not create enterprise monitoring.

## Remove Bad Providers Safely

If Finnhub and/or Alpha Vantage fail the BIST runtime audit:

- REMOVE THEM FROM ACTIVE BIST PROVIDER PRIORITY.
- Do NOT necessarily delete their entire adapters.
- Use explicit configuration/registry state such as INACTIVE_FOR_BIST.
- The final active BIST market-data chain should contain only verified/usable providers.

**Target Active Chain**: Yahoo → SerpAPI Google Finance (where verified) → Fintables (where applicable) → other VERIFIED BIST provider.

**Quality > Quantity**: The goal is not more providers. The goal is the most trustworthy BIST data supply chain possible with the existing personal-scale architecture.

## No Demo Data

Remove/identify any remaining:

- Hardcoded market values
- Fake price data
- Demo fundamentals
- Mock runtime responses
- Fallback constants pretending to be real data

Mocks are allowed only in tests. Production must use real providers. If no real data exists: VERİ YOK. If data cannot be validated: DOĞRULANAMADI.

## Testing

Create deterministic tests for:

1. BIST symbol normalization
2. Provider exchange validation
3. Provider currency validation
4. Provider priority
5. Inactive provider exclusion
6. Yahoo BIST mapping
7. SerpAPI Google Finance mapping
8. Fintables mapping
9. Agent-Reach research normalization
10. Cross-provider price comparison
11. Stale provider rejection
12. Material price divergence
13. Cache isolation by provider
14. Radar provider budgeting
15. Early Opportunity invalid-price rejection
16. Source attribution
17. Fallback transparency
18. Malformed provider response rejection

Live provider tests must be opt-in. Never make normal CI dependent on live API keys.

## Security

Check: .env, .gitignore, Git history, docs, audit reports, ZIP files, logs for: Telegram tokens, SerpAPI keys, Fintables credentials, authorization headers, cookies, passwords, private keys. Never print secrets. If previously committed secrets are discovered: REPORT SECRET_ROTATION_REQUIRED and identify the file/path only.

## Documentation

Create: docs/R2-056_BIST_DATA_SOURCE_CONSOLIDATION.md (this file).

## Machine-Readable Status

Create: docs/R2-056_PROVIDER_STATUS.json

Schema:

```json
{
  "generatedAt": "...",
  "providers": [
    {
      "provider": "...",
      "role": "MARKET_DATA | RESEARCH | MACRO | FUNDAMENTALS",
      "configured": true,
      "authentication": "VERIFIED",
      "bistSupport": "VERIFIED | PARTIALLY_VERIFIED | UNSUPPORTED | UNKNOWN",
      "activeForBist": true,
      "capabilities": {},
      "symbolsTested": [],
      "priority": 1,
      "notes": "..."
    }
  ],
  "priceConsensus": [],
  "inactiveProviders": [],
  "security": {
    "secretsDetected": false
  }
}
```

Never put secrets in this file.

## Status Report

Create: docs/R2-056_STATUS_REPORT.md

Include:

- Files created
- Files modified
- Tests
- Live smoke tests
- Provider results
- BIST compatibility
- Price consensus
- Fixes
- Providers removed from active chain
- Known limitations
- Next sprint

## ZIP Artifact

Create: docs/final-audit/R2-056_FINAL_AUDIT.zip

Include:

- R2-056_BIST_DATA_SOURCE_CONSOLIDATION.md
- R2-056_PROVIDER_STATUS.json
- R2-056_STATUS_REPORT.md
- Relevant previous audit reports
- Relevant runtime evidence

DO NOT include: .env, API keys, tokens, passwords, private credentials, node_modules, dist, unnecessary binaries.

## Git

Before committing: git status, git diff --stat, git diff. Inspect only intended changes. DO NOT delete: audit/, audit_verify/, audit.zip or other user-created audit artifacts. Do not commit .env. Check: git check-ignore .env. Then: git add only intended R2-056 files/code changes. Commit: R2-056: BIST Data Source Consolidation and Provider Truth Hardening. Push: origin/main. Verify: git status, git log -1 --oneline, git rev-parse HEAD, git remote -v.

Never claim push success without verification.

## Final Acceptance Criteria

R2-056 is complete only if:

- All provider implementations discovered
- Yahoo BIST runtime verified
- Finnhub BIST compatibility proven or rejected
- Alpha Vantage BIST compatibility proven or rejected
- SerpAPI Google Search tested
- SerpAPI Google Finance tested
- SerpAPI Google News tested
- Fintables runtime tested if configured
- KAP availability investigated
- TCMB availability investigated
- MKK availability investigated
- Agent-Reach capabilities investigated
- BIST symbol mapping verified
- Cross-provider prices compared
- Price discrepancies handled honestly
- Market-data validation preserved
- Cache isolation verified
- Radar provider usage audited
- Early Opportunity input validation verified
- Bad providers removed from active BIST chain where justified
- No demo market data remains
- Security scan completed
- Deterministic tests pass
- Live smoke test completed where credentials exist
- Documentation created
- JSON status created
- ZIP created
- Git commit verified
- Git push verified

## Absolute Constraint

Do NOT:

- Create a second market-data pipeline
- Create a second cache
- Create a second backtest engine
- Rebuild AIResearchHub
- Replace EarlyOpportunityIntelligence
- Replace RadarService
- Create autonomous trading
- Create enterprise infrastructure
- Introduce unnecessary microservices
- Invent unsupported BIST data

**The goal is not more providers. The goal is: THE MOST TRUSTWORTHY BIST DATA SUPPLY CHAIN POSSIBLE WITH THE EXISTING PERSONAL-SCALE ARCHITECTURE.**

## Final Output

Report exactly:

- Build:
- Tests:
- Live provider smoke test:
- Yahoo BIST:
- Finnhub BIST:
- Alpha Vantage BIST:
- SerpAPI Google Search:
- SerpAPI Google Finance:
- SerpAPI Google News:
- Fintables:
- KAP:
- TCMB:
- MKK:
- Agent-Reach:
- Cross-provider price consensus:
- Active BIST providers:
- Inactive BIST providers:
- Radar:
- Early Opportunity:
- Cache:
- Security:
- Fixes implemented:
- Known limitations:
- ZIP:
- Git commit:
- Git push:
- Next sprint:

Do not say "ALL PROVIDERS VERIFIED" unless runtime evidence actually proves it.

The final system must honestly distinguish: VERIFIED, PARTIALLY_VERIFIED, UNSUPPORTED, UNAVAILABLE, NOT_CONFIGURED, NOT_TESTED.

Finish only after the repository, runtime behavior, provider chain, tests, documentation and ZIP artifact have been verified.
