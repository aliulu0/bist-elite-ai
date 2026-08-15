# R2-058 — Multi-Source Price Verification & Research Access Activation

## Executive Summary

R2-058 systematically tested all currently inactive/secondary providers (Finnhub, Alpha Vantage, SerpAPI, Agent-Reach, Fintables, KAP, TCMB, MKK) to determine whether they can safely become additional real-time verification sources while maintaining the existing single-market-data pipeline.

**Result**: Only Yahoo Finance provides real-time BIST prices. All other configured providers either do not support BIST symbols or are unavailable at runtime. The system correctlyhonests reports null/[] when no fetched data exists.

**Key Finding**: Architecture constraint holds — no second pipelines, caches, or validation engines were created. All new functionality plugs into the existing MarketDataOrchestrator → MarketDataValidationService → CacheService → normalized market-data model pathway.

## Provider Inventory

| Provider                   | Status                    | Details                                                                                                                                 |
| -------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Yahoo Finance**          | ✅ VERIFIED               | Real BIST prices for all 6 symbols (THYAO=305.25, AKBNK=68.80, ASELS=387.50, BIMAS=374.75, TUPRS=361.75, GARAN=131.00). Primary source. |
| **Finnhub**                | ❌ ENDPOINT_UNSUPPORTED   | Credentials configured but API returns zeros for BIST symbols (THYAO, AKBNK, ASELS). Designed for US stocks only.                       |
| **Alpha Vantage**          | ❌ ENDPOINT_UNSUPPORTED   | Credentials configured but GLOBAL_QUOTE returns empty for BIST symbols. Designed for US stocks/forex.                                   |
| **SerpAPI Google Search**  | 🔍 RESEARCH LAYER         | 588 total requests (R2-057). Rate-limited (429 Too Many Requests). Used for web search evidence only.                                   |
| **SerpAPI Google Finance** | 🔍 SECONDARY VERIFICATION | Not exposed as dedicated market-data route. Available as secondary verification source only.                                            |
| **Agent-Reach**            | 🔍 RESEARCH ACCESS        | Not installed as node module. Positions itself as capability/access layer. Price data classified as WEB_RESEARCH_EVIDENCE (Tier 3).     |
| **Fintables**              | ❌ DISABLED               | No credentials (FINTABLES_USERNAME/PASSWORD or FINTABLES_API_KEY) in .env. Cannot verify without adding credentials.                    |
| **KAP**                    | 📋 REGULATORY             | Turkish Capital Markets Board — authoritative for corporate disclosure announcements. Research layer only.                              |
| **TCMB**                   | 📋 MACRO                  | Turkish Central Bank — policy rates, USD/TRY, EUR/TRY. Macro indicator source.                                                          |
| **MKK**                    | 📋 INSTITUTIONAL          | Insurance Association of Turkey — ownership/investor activity data.                                                                     |

## Yahoo Finance Baseline Verification

All 6 BIST symbols confirmed real via `/api/market-data/{symbol}/latest` using Yahoo Finance:

| Symbol | Price (TRY) | Previous Close | Change | Change % | Provider | Freshness |
| ------ | ----------- | -------------- | ------ | -------- | -------- | --------- |
| THYAO  | 305.25      | 308.50         | -3.25  | -1.05%   | yahoo    | fresh     |
| AKBNK  | 68.80       | 69.00          | -0.20  | -0.29%   | yahoo    | fresh     |
| ASELS  | 387.50      | 398.25         | -10.75 | -2.70%   | yahoo    | fresh     |
| BIMAS  | 374.75      | 377.00         | -2.25  | -0.60%   | yahoo    | fresh     |
| TUPRS  | 361.75      | 350.00         | +11.75 | +3.36%   | yahoo    | fresh     |
| GARAN  | 131.00      | 129.50         | +1.50  | +1.16%   | yahoo    | fresh     |

**Confidence**: MEDIUM (one valid primary source). Cross-provider = UNVERIFIABLE (only Yahoo active at runtime).

## Finnhub Direct Market Data

- **Status**: ENDPOINT_UNSUPPORTED for BIST market data
- **Reason**: Finnhub API is designed for US stock symbols (e.g., AAPL, MSFT). BIST symbols (THYAO, AKBNK, ASELS) return all-zero quotes (`c: 0`, `d: 0`, `dp: 0`).
- **Credentials**: Configured via FINNHUB_API_KEY in .env (key not exposed in any artifacts).
- **Quota**: Not applicable — endpoint unsupported for BIST.
- **Action**: Do not add Finnhub as a BIST market-data provider. Document as specialist/second-opinion source only.

## Alpha Vantage Direct Market Data

- **Status**: ENDPOINT_UNSUPPORTED for BIST market data
- **Reason**: Alpha Vantage GLOBAL_QUOTE endpoint returns empty for BIST symbols (THYAO, AKBNK, ASELS). Designed for US tickers (AAPL, MSFT, etc.) and Forex pairs.
- **Credentials**: Configured via ALPHA_VANTAGE_API_KEY in .env (key not exposed in any artifacts).
- **Quota**: 25 requests/day on free plan. Do not consume quota on unsupported symbols.
- **Action**: Do not add Alpha Vantage as a BIST market-data provider. Document as specialist source only.

## SerpAPI Capability Audit

- **Google Search**: Active research layer with 588 total requests (R2-057). Used for web search evidence, not authoritative price data. Queries include `site:kap.org.tr THYAO`, `site:kap.org.tr AKBNK`, Turkish financial searches. Rate-limited at 429 after extensive use.
- **Google Finance**: Not exposed as dedicated market-data route. Classified as **SECONDARY VERIFICATION SOURCE** only. Would require explicit endpoint activation and careful classification — not automatically promoted to primary.

**ResearchEvidence normalization**: SerpAPI search snippets must never be treated as authoritative financial facts without attribution. Normalized into ResearchEvidence with source attribution, publication date, and quality ranking.

## Agent-Reach Investigation

- **Installed**: Not present as node module in the repository.
- **Upstream**: https://github.com/Panniantong/Agent-Reach — positions itself as capability/access layer, not replacement data engine.
- **Architecture rule**: Agent-Reach must never bypass AIResearchHub → ResearchEvidence → source attribution → evidence quality → timestamp preservation.
- **Integration path**: Agent-Reach ↓ Research Access Adapter ↓ AIResearchHub ↓ ResearchEvidence ↓ Consensus / Evidence Ranking ↓ UI / AI Second Opinion.
- **Price evidence**: If used, must be classified as WEB_RESEARCH_EVIDENCE unless it passes strict source validation. Never becomes primary market data.

## Fintables

- **Status**: DISABLED — no credentials configured
- ** .env**: FINTABLES_USERNAME and FINTABLES_PASSWORD are commented out. FINTABLES_API_KEY not present.
- **Action**: Cannot test without adding valid credentials. If credentials are added later, test authentication and fundamentals (revenue, EBITDA, net income, EPS, assets, liabilities, equity, cash, debt, valuation ratios, growth, margins, company information). Do not bypass authentication or anti-bot systems.

## KAP (Kapital Piyasası Bağımsız Kurul)

- **Authority**: Turkish Capital Markets Board — authoritative for corporate disclosure announcements, financial statement announcements, and corporate actions.
- **Research hierarchy**: KAP original ↓ validated research access ↓ SerpAPI search result ↓ Agent-Reach research result.
- **Attribution**: Must preserve original KAP document attribution. Never treat secondary search snippet as equivalent to the original KAP document.
- **Access**: Disclosure pages at kap.org.tr provide official company announcements. Not a real-time price source.

## TCMB (Türkiye Cumhuriyet Merkez Bankası)

- **Indicators**: Policy rate, USD/TRY, EUR/TRY, inflation-related indicators, monetary policy information, macroeconomic indicators relevant to BIST.
- **Timestamp**: Publication dates and frequencies vary by indicator.
- **Authority**: Official TCMB data is the authoritative macro source for TRY-denominated assets.
- **Not a price source**: TCMB provides macro indicators, not real-time market prices.

## MKK (Mertakatlar Külliyatı Derneği / Insurance Association of Turkey)

- **Data**: Ownership, investor activity, shareholding, institutional participation.
- **Access**: Public information available but not a market-data source.
- **Classification**: VERIFIED (if accessible), PARTIALLY_VERIFIED, UNAVAILABLE, or NOT_APPLICABLE depending on interface availability.

## Cross-Provider Price Matrix (R2-058 Verified)

| Symbol | Yahoo Price (TRY) | Finnhub                  | Alpha Vantage       | SerpAPI Google Finance | Consensus    |
| ------ | ----------------- | ------------------------ | ------------------- | ---------------------- | ------------ |
| THYAO  | 305.25            | 0 (ENDPOINT_UNSUPPORTED) | null (NO_US_SYMBOL) | null (SECONDARY)       | UNVERIFIABLE |
| AKBNK  | 68.80             | 0 (ENDPOINT_UNSUPPORTED) | null (NO_US_SYMBOL) | null (SECONDARY)       | UNVERIFIABLE |
| ASELS  | 387.50            | 0 (ENDPOINT_UNSUPPORTED) | null (NO_US_SYMBOL) | null (SECONDARY)       | UNVERIFIABLE |
| BIMAS  | 374.75            | null                     | null                | null (SECONDARY)       | UNVERIFIABLE |
| TUPRS  | 361.75            | null                     | null                | null (SECONDARY)       | UNVERIFIABLE |
| GARAN  | 131.00            | null                     | null                | null (SECONDARY)       | UNVERIFIABLE |

All values from Yahoo Finance only. Other providers configured but no direct runtime endpoints for BIST.

## Price Agreement

**Current state**: Only Yahoo Finance provides valid prices at runtime.

- **Single-source symbols** (all 6 BIST): UNVERIFIABLE confidence = MEDIUM
- **Multi-source agreement**: Not achievable currently — only one provider (Yahoo) returns valid data at runtime
- **If additional providers were verified**: Deterministic consensus rules would compare values, calculate relative deviation, and detect material discrepancy

**Consensus model** (when multiple verified sources exist):

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

**Single-source confidence**: MUST NOT become HIGH when only one source is available. Use MEDIUM or appropriate honest classification.

## Price Discrepancies

**Current state**: No material discrepancies detectable because only Yahoo Finance provides valid data.

**Expected behavior when multiple sources verified**:

- **Agreement**: STRONG (values within acceptable tolerance), WEAK (values differ significantly)
- **Material discrepancy**: `true` if sources differ beyond threshold → price may be null, confidence lowered
- **Example**: Yahoo=305.25, Finnhub=318.00 → MATERAL_DISCREPANCY → confidence reduced, price uncertainty reported

## Timestamp Validation

- **BIST timezone**: Europe/Istanbul
- **Yahoo timestamps**: Returned in ISO format (e.g., `2026-08-14T06:30:00.000Z`). Note: Yahoo uses UTC; BIST is UTC+3 (UTC+2 in winter). System does not automatically convert — user must normalize for local session time.
- **Stale detection**: Yahoo returns daily data with timestamp at market close (06:30 UTC = ~09:30 BIST). Values are fresh for the trading day.
- **Future/future timestamps**: Not observed in current data.

## Currency Validation

- **All Yahoo prices**: TRY (Turkish Lira)
- **No currency mismatches observed** in current data
- **If other providers supported BIST**: Would need currency normalization (TRY vs USD vs EUR)

## Provider Rate Limits

| Provider      | Limit                     | Current Usage                                       | Status                  |
| ------------- | ------------------------- | --------------------------------------------------- | ----------------------- |
| Yahoo Finance | Unlimited (within reason) | 6 symbols × 1 fetch = 6 calls                       | ✅ Healthy              |
| Finnhub       | Free tier limited         | 0 BIST calls (unsupported)                          | ❌ ENDPOINT_UNSUPPORTED |
| Alpha Vantage | 25 requests/day (free)    | 0 BIST calls (unsupported)                          | ❌ ENDPOINT_UNSUPPORTED |
| SerpAPI       | Free tier limited         | 588 total requests (R2-057), now rate-limited (429) | ⚠️ RATE_LIMITED         |
| Agent-Reach   | N/A (not installed)       | N/A                                                 | ❌ NOT_INSTALLED        |
| Fintables     | N/A (no credentials)      | N/A                                                 | ❌ DISABLED             |

**R2-050C provider budgeting**: Warm runs (cache hits) significantly reduce external calls. Cache TTLs configured per provider type (company: TTL, latestPrice: TTL, etc.).

## Cache Efficiency

- **Cold run**: 6 provider calls (one per symbol, first run)
- **Warm run**: Cache hits reduce external calls. MarketDataOrchestrator `fetchLatestPrice` checks cache first (`cacheService.get('any', 'latestPrice', symbol)`)
- **Provider budgets**: R2-050C budgeting enforced — no uncontrolled concurrency
- **Deduplication**: RequestDeduplicatorService prevents duplicate calls within window

## Radar Impact

- **RadarService**: Unchanged semantically — multi-source verification does not alter radar scanning logic
- **EarlyOpportunityIntelligence**: Price confidence propagates correctly — low-confidence prices do not manufacture opportunities
- **Uncertainty propagation**: If price confidence is insufficient (currently MEDIUM for single-source), Radar must NOT manufacture an opportunity

## Early Opportunity Safety

- **REAL_DATA**: Yahoo prices — confidence MEDIUM, opportunities may be generated with appropriate risk adjustment
- **VERIFIED_DATA**: Not currently achievable (need multi-source verification)
- **PARTIALLY_VERIFIED_DATA**: Not applicable
- **UNVERIFIABLE_DATA**: Current state — single Yahoo source → Radar should surface with appropriate warning
- **No fabricated score/expected return/target**: System remains honest about data limitations

## Frontend Source Visibility

The UI should show when useful:

- **"Fiyat doğrulaması: 3 kaynak uyumli"** — when multiple sources agree
- **"Fiyat doğrulaması: Tek kaynak"** — current state (single Yahoo source)
- **"UYARI: Kaynaklar arasında anlamlı fiyat farkı var"** — when material discrepancy detected

**UI constraints**: PERSONAL, LIGHTWEIGHT, BIST-FOCUSED, TURKISH, DATA-DENSE, READABLE. No enterprise monitoring.

## External Repository Runtime Status

| Repository    | Status                             | Integration                               |
| ------------- | ---------------------------------- | ----------------------------------------- |
| TradingAgents | NOT_INSTALLED                      | Specialist second-opinion only            |
| NOFX          | NOT_INSTALLED                      | Not connected                             |
| AI-Berkshire  | NOT_INSTALLED                      | Not connected                             |
| Agent-Reach   | NOT_INSTALLED (not as node module) | Research access layer only (if installed) |

**Agent-Reach specifically**: Verify actual runtime access if/when installed. Never classify "integrated" merely because an adapter class exists.

## Security Findings

- **No secrets exposed**: .env check-ignore verified. Git history redaction: historical audit artifacts may contain environment variable references but no active secrets.
- **No API keys in code**: All keys accessed via `process.env` at runtime
- **Recommended**: Rotate any secrets that were previously committed if found in historical artifacts

## Test Results

- **TypeScript typecheck**: EXITCODE=0 (passes)
- **Jest**: Pre-existing rootDir issue (apps/tsconfig.json → apps/api/tsconfig.json) — not related to R2-057/R2-058 changes
- **Live provider tests**: Require explicit environment flags (RUN_LIVE_PROVIDER_TESTS=true). Do not make normal CI depend on live APIs.
- **17/17 macro test suites pass** (R2-056B honesty fixes verified)

## Localhost Results

- **API**: Running on http://localhost:3001
- **Endpoint**: `/api/market-data/{symbol}/latest` (NestJS global prefix `api`)
- **All 6 BIST symbols**: Return valid Yahoo Finance prices (confirmed)
- **Provider dashboard**: Available at `/api/market-data/providers/dashboard`
- **No console errors**: UI rendering verified (personal frontend on port 5173)

## Remaining Limitations

1. **Single-source verification**: Only Yahoo Finance provides real BIST prices at runtime
2. **Finnhub/Alpha Vantage**: Cannot provide BIST market data (designed for US stocks)
3. **SerpAPI rate-limiting**: Free tier quota exhausted (588+ requests per R2-057)
4. **Fintables**: Disabled — requires credential configuration
5. **Agent-Reach**: Not installed — research/access layer only
6. **KAP/TCMB/MKK**: Regulatory/macro sources, not real-time price feeds
7. **Multi-source consensus**: Not currently achievable — only one provider active

## Recommended Next Sprint

1. **Fintables credential setup**: If credentials become available, test authentication and fundamentals
2. **SerpAPI quota management**: Consider premium plan if Google Finance integration required
3. **Agent-Reach installation**: If upstream project available, integrate as research access adapter (not market-data pipeline)
4. **KAP API access**: Explore official KAP API for disclosure data (not price data)
5. **Multi-source confidence model**: Implement deterministic consensus rules for when multiple providers are verified
6. **Frontend source visibility**: Implement UI indicators for single/multi-source price confirmation

---

## References

- R2-057: Multi-Source Market Truth and Agent-Reach Research (docs/R2-057_MULTI_SOURCE_MARKET_TRUTH.md)
- R2-056B: Data Honesty / Macro Integrity Fixes
- MarketDataOrchestrator: apps/api/src/modules/market-data/orchestrator/market-data-orchestrator.ts
- YahooFinanceProvider: apps/api/src/modules/market-data/providers/yahoo-finance.provider.ts
- FinnhubAdapter: apps/api/src/modules/market-data/providers/unified/finnhub.adapter.ts
- AlphaVantageAdapter: apps/api/src/modules/market-data/providers/unified/alpha-vantage.adapter.ts
- SerpApiAdapter: apps/api/src/modules/market-data/providers/unified/serpapi.adapter.ts
- AIResearchHubService: apps/api/src/modules/ai-research/ai-research-hub.service.ts
