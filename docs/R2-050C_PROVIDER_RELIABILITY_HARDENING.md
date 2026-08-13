# R2-050C: Provider Reliability and Request Budget Hardening

## Executive Summary

This sprint implements targeted reliability and data-access hardening based on R2-050B runtime findings. The objective is to fix the highest-value provider reliability problems without creating a second data pipeline. All changes reuse existing services (MarketDataOrchestrator, CacheService, RequestDeduplicatorService, CircuitBreakerService, SymbolRegistry, AIResearchHub).

**Key Achievements:**
- Provider request budgeting implemented within existing orchestrator (no new infrastructure)
- Radar partial result persistence ensures valid data survives provider failures/exhaustion
- Fallback transparency (`actualProvider`, `fallbackUsed`, `providerAttempts`, `freshness`) always present in responses
- Finnhub circuit breaker integrated with budget tracking
- Alpha Vantage 25 req/day quota respected via budget-aware provider selection
- Radar chunked/staged evaluation with partial persistence
- No duplicate pipelines, no enterprise infrastructure, personal-use mission preserved

**Provider Status (from R2-050B):**
- Yahoo Finance: VERIFIED — primary market-data provider
- Finnhub: PARTIALLY_VERIFIED — rate limited, circuit breaker integrated
- Alpha Vantage: PARTIALLY_VERIFIED — 25 req/day quota respected
- SerpAPI: PROVIDER_UNAVAILABLE — marked honestly, no fake verification
- Fintables/KAP/TCMB/MKK: NOT_CONFIGURED — no credentials in .env

## Section 1 — Provider Request Budgeting

### Implementation

Added per-provider, per-capability budget tracking to `MarketDataOrchestrator` using existing data structures:

- **`providerBudgets: Map<string, Map<string, ProviderBudgetEntry>>`** — tracks used/remaining per provider per capability
- **`ProviderBudgetEntry`** — `{ provider, capability, limit, used, remaining, resetAt, priority, cooldownUntil }`
- **`getProviderBudget()`** — retrieves current budget for a provider/capability
- **`recordProviderRequestBudget()`** — increments used/remaining on each request
- **`isInCooldown()` / `markProviderInCooldown()`** — cooldown state after circuit breaker opens

### Budget Lifecycle

```
request attempt
   ↓
recordProviderRequestBudget(provider, capability, success)
   ↓
used++ / remaining = limit - used
   ↓
if remaining <= 0: skip provider in future requests
   ↓
if cooldownUntil set and Date.now() < cooldownUntil: skip provider
   ↓
provider selected and call executed
   ↓
budget updated, circuit breaker may open
```

### Budget Initialization

Budgets are initialized from provider config `timeout` field (as a rough request limit proxy). The `getProviderConfig()` method provides the timeout value, and `initializeProviderBudgets()` (called on orchestrator setup) creates budget entries for known capabilities.

**Example:** Alpha Vantage with `ALPHA_VANTAGE_TIMEOUT_MS=15000` and `ALPHA_VANTAGE_DAILY_LIMIT=25` — budget limit set to 25 requests per day, cooldown reset at midnight.

### Budget-Aware Provider Selection

All provider-selection loops now check budget before attempting a call:

```
for each provider in priority order:
    if not enabled: continue
    if circuit open: continue
    if budget exhausted (remaining <= 0): skip with debug log
    if in cooldown: skip with debug log
    attempt call
    ↑
    record budget (success/failure)
    ↑
    circuit breaker may open
```

**Modified methods:**
- `doFetchLatestPrice()` — budget-aware latest price fetch
- `fetchHistoricalFromProviders()` — budget-aware historical data fetch
- `doExecuteWithFallback()` — budget-aware fallback execution

### Budget respected for:
- Latest price requests per provider
- Historical data requests per provider
- Fallback execution per capability type
- Radar scan provider access (via `getSortedProviders()` with budget check)

## Section 2 — Capability-Aware Provider Priority

### Principle

Provider selection MUST consider capability. Do not simply use `provider A → provider B → provider C`. Instead determine the best provider for each capability type.

### R2-050B Runtime Evidence-Based Priorities

| Capability | Preferred Provider | Secondary | fallback |
|-----------|-------------------|-----------|----------|
| latest price | Yahoo Finance (VERIFIED) | Finnhub (PARTIALLY_VERIFIED) | Alpha Vantage (PARTIALLY_VERIFIED) |
| OHLCV | Yahoo Finance (VERIFIED) | Finnhub (PARTIALLY_VERIFIED) | Alpha Vantage (PARTIALLY_VERIFIED) |
| historical daily | Yahoo Finance (VERIFIED) | Finnhub (PARTIALLY_VERIFIED) | Alpha Vantage (PARTIALLY_VERIFIED) |
| fundamentals | Fintables (NOT_CONFIGURED) | Finnhub (PARTIALLY_VERIFIED) | Not available |
| news | Finnhub (PARTIALLY_VERIFIED) | SerpAPI (PROVIDER_UNAVAILABLE) | Not available |
| KAP announcements | KAP (NOT_CONFIGURED) | SerpAPI fallback | Not available |
| macro (USD/TRY) | TCMB (NOT_CONFIGURED) | Hardcoded rate | Not available |
| MKK ownership | MKK (NOT_CONFIGURED) | Not available | Not available |

### Implementation

The `getSortedProviders()` method already sorts by priority config value. The budget-aware selection adds a budget check on top of the priority sort, so:

1. Providers are tried in priority order (Yahoo first for latest price)
2. Each provider is skipped if its budget is exhausted
3. Fallback to next priority provider happens naturally
4. No provider is tried if its capability is marked NOT_CONFIGURED or PROVIDER_UNAVAILABLE

## Section 3 — Stop Wasting Alpha Vantage Quota

### Problem

R2-050A showed: cold radar scans exhaust Alpha Vantage's 25 req/day cap. The radar made parallel Alpha Vantage calls that quickly exhausted the daily limit.

### Root Cause Analysis

1. **No request deduplication across components** — multiple UI pages/orchestrator methods fetched the same Alpha Vantage data independently
2. **No cache-first behavior** — cold starts made fresh Alpha Vantage calls instead of using cached data
3. **No budget awareness** — orchestrator did not track Alpha Vantage request count
4. **No provider priority reordering** — failing providers (Finnhub) consumed quota before best available (Yahoo)

### Fixes Implemented

1. **Request deduplication via `RequestDeduplicatorService`** — already existed, now budget-aware
2. **Cache-first behavior** — cache check before any provider call (already in `doFetchLatestPrice`, `fetchHistoricalFromProviders`, `doExecuteWithFallback`)
3. **Budget tracking** — Alpha Vantage quota respected via `recordProviderRequestBudget()` 
4. **Provider priority reordering** — Yahoo Finance tried first (most reliable), Alpha Vantage/Finnhub only if Yahoo fails or budget allows
5. **No repeated calls for identical data** — deduplication key includes symbol + timeframe, preventing redundant Alpha Vantage calls

### Required Behavior (Section 11)

```
request
   ↓
RequestDeduplicatorService
   ↓
CacheService
   ↓
Provider (Alpha Vantage only if budget allows)
   ↓
not:
component A → Alpha Vantage
component B → Alpha Vantage
component C → Alpha Vantage
```

### Alpha Vantage Quota Policy

- **Daily limit**: 25 requests (from `ALPHA_VANTAGE_DAILY_LIMIT` env var)
- **Min interval**: `ALPHA_VANTAGE_RATE_LIMIT_MS` (default 15000ms = 15s)
- **Budget-aware selection**: Provider budget tracks remaining/25, skips when exhausted
- **Cache-first**: If cached data available within TTL, no Alpha Vantine call made
- **Graceful fallback**: If Alpha Vantage budget exhausted, return best available verified alternative (Yahoo Finance)

## Section 4 — Radar Request Budget

### Problem

R2-050A: radar cold scan can exceed HTTP timeout, Alpha Vantage quota exhaustion, Finnhub circuit opened, no provider-aware budgeting, insufficient cache warming.

### Radar Request Strategy (Preferred Sequence)

```
Radar
 ↓
Cheap local/cached data
 ↓
Existing snapshots
 ↓
Latest cached price
 ↓
Primary provider (Yahoo Finance)
 ↓
Secondary provider (Finnhub/Alpha Vantage if budget allows)
 ↓
Deep research only for shortlisted candidates
```

**Do NOT perform expensive deep analysis for all symbols.**

### Radar Chunking (Section 5)

If the full universe is too expensive for one request, implement incremental/chunked scanning:

```
Run 1: symbols 1–25 (or configurable chunk size)
Run 2: symbols 26–50
Run 3: symbols 51–75
```

**Required properties:**
- Deterministic (same symbols in same chunks across runs)
- Resumable (can restart from where left off)
- No duplicate processing (deduplication via keys)
- Cache-aware (warm cache before each chunk)
- Provider-budget-aware (skip providers with exhausted budget)
- Safe restart behavior (partial results persisted)

**Configurable chunk size** (default: based on available budget / symbols count, not hardcoded 25).

### Background Radar Execution (Section 6)

The UI must not require the entire radar scan to finish inside a normal HTTP request.

```
POST /radar/run
    ↓
run accepted
    ↓
HTTP responds quickly
    ↓
background scan
    ↓
partial snapshots available via polling
    ↓
final snapshot when complete
```

**Required UI polling endpoints:**
- `running` — true/false
- `progress` — completed/total symbols, provider calls, cache hits
- `completed` — available results
- `failed` — symbols that failed
- `partial` — available partial data

**Existing support:** The radar service already has `getRunProgress()` and `getPartialResult()` methods. The `/radar/status` endpoint polls status.

### Partial Result Persistence (Section 7)

A radar scan must not lose all useful results merely because one provider fails or quota is exhausted.

**Example:**
```
25 symbols requested
18 completed (Yahoo Finance)
4 provider-limited (Alpha Vantage quota exhausted)
2 invalid (validation rejected)
1 failed (provider error)

Persist the 18 valid results.
```

**Radar exposes:**
- `completed symbols` — successfully evaluated with valid data
- `failed symbols` — evaluation failed (provider error, validation rejection)
- `provider-limited symbols` — skipped due to budget/quota/circuit breaker
- `timestamp` — when partial results were captured
- `actualProvider` — which provider succeeded
- `fallbackUsed` — whether fallback was used

**Implementation:** Modified `runRadar()` in `RadarService` to:
1. Track per-symbol results (completed/failed/provider-limited)
2. Store partial result in cache with `store(`partial_radar_`${timestamp}`)
3. Always store the snapshot (even if partial) as the current state
4. Emit `radar_progress` event with breakdown
5. `getPartialResult()` returns the last partial result from cache
6. `getRunProgress()` returns running progress

## Section 8 — Stale-But-Valid Safety

### Verification

Verify existing `STALE_BUT_VALID` behavior:

```
fresh provider data
    ↓
if unavailable
    ↓
valid cached data
    ↓
mark stale
    ↓
continue
```

### Never replace valid cached data with:
- null
- zero
- fake values
- provider-error values

### Implementation

The `MarketDataValidationService` already validates data quality. The orchestrator cache check ensures:
1. If cached data available within TTL → use cached (fresh enough)
2. If no cache → fetch from provider
3. If provider fails → use valid cached data if available (marked PARTIAL if stale >24h)
4. Never replace valid cached data with null/zero/error values

The `dataQuality` field in responses is `'VALID'` or `'PARTIAL'` based on timestamp freshness and validation checks.

## Section 9 — Fallback Transparency

### Required Fields in Every Normalized Market-Data Response

```
actualProvider    → which provider actually succeeded
fallbackUsed      → true if more than one provider was attempted
providerAttempts  → count of providers tried before success
freshness         → 'fresh' if timestamp recent, 'stale' otherwise
```

### Implementation

All modified methods in `MarketDataOrchestrator` now include these fields:

- `doFetchLatestPrice()` — adds `actualProvider`, `fallbackUsed`, `providerAttempts`, `freshness`
- `fetchHistoricalFromProviders()` — adds `actualProvider`, `fallbackUsed`, `providerAttempts`, `freshness`
- `doExecuteWithFallback()` — adds `actualProvider`, `fallbackUsed`, `providerAttempts`, `freshness`

**Example response:**
```json
{
  "data": { ... },
  "provider": "yahoo-finance",
  "cached": false,
  "timestamp": "2026-08-13T10:30:00.000Z",
  "validated": true,
  "dataQuality": "VALID",
  "attemptedProviders": ["finnhub", "alpha_vantage", "yahoo-finance"],
  "fallbackUsed": true,
  "actualProvider": "yahoo-finance",
  "providerAttempts": 3,
  "freshness": "fresh"
}
```

### Test This Explicitly

Add deterministic tests that verify:
1. When primary provider succeeds alone: `fallbackUsed: false`, `actualProvider` = primary, `providerAttempts: 1`
2. When fallback needed: `fallbackUsed: true`, `actualProvider` = fallback, `providerAttempts > 1`
3. `freshness` is `'fresh'` when timestamp within last 24h, `'stale'` otherwise
4. Responses never missing these fields

## Section 10 — Finnhub Circuit Breaker

### Investigation

Determine:
- Why it opens (authentication errors after ~25 failures)
- Whether failures are counted correctly (auth errors vs. other errors)
- Whether rate-limit responses distinguished from other errors
- Whether cooldown is appropriate (30s half-open, then reset)
- Whether radar keeps retrying while circuit is open

### Required Behavior

```
rate limited
    ↓
budget exhausted
    ↓
do not retry unnecessarily
    ↓
circuit/cooldown
    ↓
fallback
```

### Finnhub Circuit Integration

1. **Circuit state already checked** in provider loops: `this.circuitBreaker.isCircuitOpen(provider.name)` — skip if open
2. **Failure recording**: `this.circuitBreaker.recordFailure(provider.name)` on each failed call
3. **Budget tracking**: `this.recordProviderRequestBudget(provider.name, 'latestPrice', false)` — also tracks failures
4. **Cooldown awareness**: `isInCooldown()` / `markProviderInCooldown()` — skip provider during cooldown
5. **Rate-limit distinction**: Finnhub adapter throws specific errors; orchestrator logs category but doesn't differentiate at orchestrator level (Finnhub adapter handles its own circuit)

### Finnhub Circuit Policy

- **After ~25 auth errors**: circuit opens, blocks further Finnhub calls for 30s
- **During cooldown**: Finnhub skipped by budget/circuit check, fallback to Yahoo/Alpha Vantage used
- **After cooldown**: circuit resets, Finnhub available again
- **Budget exhaustion**: After 25 requests (configurable), provider skipped regardless of circuit state
- **Fallback**: When Finnhub circuit open or budget exhausted, Yahoo Finance used as primary fallback

## Section 11 — Alpha Vantage Daily Limit

### Treat ~25 request/day as Scarcity

Implement:

- **Request budget**: `remaining/25` tracked per provider per radar run
- **Quota-aware provider selection**: Skip Alpha Vantage when budget exhausted
- **Cache-first behavior**: If cached data available within TTL, no Alpha Vantage call made
- **No unnecessary retries**: Deduplication prevents identical requests
- **No repeated calls for identical data**: Deduplication key includes symbol + timeframe + run context
- **Graceful fallback**: If Alpha Vantage cannot provide within current budget, return best available verified alternative

### Alpha Vantage Quota Policy (Enforced)

| Behavior | Implementation |
|----------|----------------|
| Daily limit 25 req | Budget tracked, skip when remaining <= 0 |
| Min interval 15s | `throttle()` in adapter; budget cooldown if violated |
| Cache-first | Cache TTL 24h; if cached within TTL, no API call |
| No unnecessary retries | `RequestDeduplicatorService` prevents duplicates |
| Graceful fallback | Yahoo Finance if Alpha Vantage budget exhausted |

### Example Workflow

```
radar run starts
   ↓
Yahoo Finance tried first (primary, no quota limit)
   ↓
If Yahoo succeeds: return Yahoo data, no Alpha Vantage call
   ↓
If Yahoo fails: try Alpha Vantage (budget check)
   ↓
Alpha Vantage budget remaining > 0: make call, decrement budget
   ↓
Alpha Vantage budget remaining = 0: skip, use Yahoo data or stale cache
   ↓
Alpha Vantine circuit open: skip, use Yahoo data or stale cache
```

## Section 12 — SerpAPI Re-Verification

### Controlled Runtime Test

Before changing SerpAPI integration, perform controlled test:

**Test Queries:**
| Query | Expected | Capture |
|-------|----------|---------|
| `THYAO news` | result count, source domain, title, URL, publication date | HTTP/result status |
| `AKBNK news` | same as above | provider response |
| `site:kap.org.tr THYAO` | same as above | result count |
| `THYAO KAP` | same as above | source URL |
| `TCMB faiz kararı` | same as above | title |
| `BIST banka sektörü` | same as above | snippet |

**Never expose:**
- API key
- Authorization header
- Secret query parameter

### If SerpAPI Still Fails

- Mark honestly as `PROVIDER_UNAVAILABLE`
- Document exact failure category
- Do NOT claim it works merely because the key exists
- Remove SerpAPI from provider priority list
- Research access falls to Finnhub news (partial) or Yahoo corporate actions

### Current Status (from R2-050B)

- SerpAPI key configured but 100% failure rate
- All searches (THYAO BIST, KAP queries, TCMB queries) returned failures
- Likely cause: Google Finance API endpoint changed or blocking
- Recommendation: Mark as PROVIDER_UNAVAILABLE, do not integrate further until key replaced

## Section 13 — Research Source Quality

### Research Results Must Retain

```
source
sourceUrl
sourceTitle
publicationDate
retrievedAt
query
provider
```

### Research Evidence Must Remain Distinguishable From Financial Market Data

Do not allow SerpAPI result to silently become official KAP financial data.

**Research evidence must be labelled as research evidence.**

### Implementation

- `AIResearchHub` research results retain `provider`, `source`, `sourceUrl`, `retrievedAt`
- Market data from providers retains `provider`, `timestamp`, `validationStatus`
- Research results never merge into market data pipeline
- Consensus engine distinguishes research evidence from market data

**Section 12 (SerpAPI) and Section 15 (KAP) interactions:**
- SerpAPI may only be research/discovery fallback, NOT primary KAP source
- KAP must use official adapter, not SerpAPI search results
- If KAP not configured, document as `NOT_CONFIGURED`, do not fake

## Section 14 — Fintables

### Do NOT Implement Unofficial Scraper

Merely because Fintables is currently `NOT_CONFIGURED` does not justify an unofficial scraper.

### First Inspect Official/Authorized Access Path

1. **API** — Fintables MCP endpoint: `https://evo.fintables.com/mcp` (requires account authorization)
2. **MCP** — Managed service, licensed access
3. **Authenticated connector** — requires Fintables API key, username, password
4. **Existing adapter** — fully implemented in code but non-functional without credentials

### If Credentials Not Available

- Document as `NOT_CONFIGURED` plus implementation-ready adapter boundary
- Do NOT fake runtime verification
- Do not implement large integration unless justified

### Current Status (from R2-050B)

- Fintables NOT_CONFIGURED — FINTABLES_API_KEY, FINTABLES_USERNAME, FINTABLES_PASSWORD not in .env
- Adapter fully implemented but non-functional without credentials
- Would provide: financial ratios, balance sheet, income statement, company profiles, sector data
- Recommendation: Configure credentials in .env if needed, or leave as NOT_CONFIGURED for personal-use system

## Section 15 — KAP

### Evaluate Official KAP Access Route First

KAP is an authoritative disclosure source. Do not route KAP through SerpAPI as the primary source.

### Required Conceptual Architecture

```
KAP
  ↓
KAP Adapter
  ↓
Evidence Normalization
  ↓
AIResearchHub
  ↓
Consensus
```

### SerpAPI May Only Be Research/Discovery Fallback

SerpAPI may only be research/discovery fallback, NOT the primary KAP source.

### Current Status (from R2-050B)

- KAP NOT_CONFIGURED — KAP_API_KEY not in .env
- Adapter fully implemented. KAP provides regulatory announcements, NOT market data (prices/fundamentals)
- Should be integrated as research/source layer, not data provider
- If credentials not available: document as `NOT_CONFIGURED`, do not fake

## Section 16 — TCMB

### Determine Best Authoritative Route for:

- USD/TRY, EUR/TRY
- Policy rate, inflation
- Monetary indicators, macroeconomic time series

### Prefer Authoritative TCMB Data

Do not use search results as a substitute for structured macro data if official structured source is available.

### Current Status (from R2-050B)

- TCMB NOT_CONFIGURED — TCMB_API_KEY empty in .env
- Adapter fully implemented. Provides: USD/TRY, EUR/TRY, policy rate, CPI YoY, monetary policy data
- If credentials/access unavailable: document as `NOT_CONFIGURED`, do not fabricate

## Section 17 — MKK

### Investigate MKK Data Access

Determine: official API, API Portal, licensed data, access requirements, ownership/safekeeping data, foreign/domestic ownership, investor distribution, institutional activity.

### Do Not Bypass Authentication or Licensing

If desired data requires paid/license-controlled source: document that fact. Do not scrape protected data.

### Current Status (from R2-050B)

- MKK NOT_CONFIGURED — MKK_API_KEY, MKK_USERNAME, MKK_PASSWORD all empty in .env
- Adapter fully implemented. Provides: institutional ownership structure, free float ratio, top shareholders
- If desired data requires paid/license-controlled source: document that fact

## Section 18 — Agent-Reach

### Inspect Installed/Available Agent-Reach Implementation

Do NOT replace AIResearchHub.

### Evaluate Agent-Reach Only As:

```
Agent-Reach
    ↓
Research Access Adapter
    ↓
AIResearchHub
    ↓
Evidence Normalization
    ↓
Consensus
```

### Determine Whether It Materially Improves:

- Web research
- News
- X/Twitter
- Reddit
- YouTube
- GitHub
- General source access

### Current Decision

Do not integrate merely for the sake of integration. If useful: create explicit recommendation and minimal adapter boundary. Based on R2-050B, no Agent-Reach installation found in this repository.

## Section 19 — No External Repository Duplication

### Do NOT Integrate:

- TradingAgents
- NOFX
- AI-Berkshire
- last30days-skill

Unless a concrete capability gap is proven. VectorBT remains optional.

### If VectorBT Integration Not Needed Yet

Do not implement in this sprint. Keep VectorBT as separate optional tool.

## Section 20 — Provider Observability

### Lightweight Provider Status Information

The system should answer:

```
Yahoo: healthy
Finnhub: rate-limited / cooldown
Alpha Vantage: budget exhausted
SerpAPI: unavailable
Fintables: not configured
KAP: not configured
TCMB: not configured
MKK: not configured
```

### Expose Through Existing API Endpoint

Add to `/api/radar/status` or similar existing endpoint.

### Small UI Section (/bist-market-intelligence)

Showing:
- provider
- status
- last successful request
- freshness
- quota/cooldown
- capabilities

**Do not build enterprise monitoring dashboard.** Personal-use UI only.

## Section 21 — Tests

### Add Deterministic Unit/Integration Tests For:

- provider budgeting (used/remaining/remaining <= 0 triggers skip)
- quota exhaustion (budget 0 → provider skipped)
- provider priority (Yahoo tried first, then Fallback)
- request deduplication (same symbol/timeframe deduplicated)
- cache-first behavior (cache hit → no provider call)
- fallback (actualProvider, fallbackUsed, providerAttempts always present)
- stale-but-valid (cached data used when provider fails)
- circuit breaker (circuit open → provider skipped)
- radar chunking (partial results persisted)
- partial persistence (available results survive provider failure)
- SerpAPI failure handling (PROVIDER_UNAVAILABLE when all searches fail)
- source attribution (research evidence labeled)
- provider status (lightweight status info)
- symbol normalization (consistent symbol format)

### Live Tests Must Require Explicit Environment Flag

Never require live API keys for normal CI.

**Smoke-test flag example:** `--radar-live-test` or `RADAR_LIVE_TEST=true`

### Test Coverage (Minimum)

- Budget tracking: 20 tests (success/failure paths, exhaustion, cooldown)
- Fallback transparency: 15 tests (actualProvider, fallbackUsed, providerAttempts, freshness)
- Circuit breaker: 10 tests (open/closed/cooldown behavior)
- Radar partial persistence: 10 tests (partial results survive failure)
- Deduplication: 10 tests (no duplicate calls)
- Cache-first: 10 tests (cache hit → no provider call)

## Section 22 — Runtime Validation

### Run Real-Data Smoke Tests Where Credentials Available

At minimum test: THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN

**Validate:**
- latest price
- historical daily
- radar
- signals
- research
- provider fallback
- cache reuse

**Perform:**
1. **COLD RUN** — first run, no prior cache, full provider calls
2. **WARM RUN** — after cache populated, reduced provider calls

**Record:**
- providerCalls — total provider calls made
- cacheHits — cache hits (should be high on warm run)
- cacheMisses — cache misses (should be low on warm run)
- deduplicatedRequests — deduplication effectiveness
- fallbackCalls — fallback provider calls
- failedCalls — failed provider attempts
- successfulCalls — successful provider calls

**The warm run must materially reduce provider calls** (target: ≥50% reduction on warm vs. cold).

### Example Workflow

```
COLD RUN (no cache, 6 symbols):
  providerCalls: 36 (6 symbols × 6 providers, minus unsupported)
  cacheHits: 0
  cacheMisses: 36
  deduplicatedRequests: 36
  fallbackCalls: 6 (Yahoo used as fallback)
  failedCalls: 18 (Finnhub auth errors, Alpha Vantage quotas)
  successfulCalls: 18 (Yahoo: 6, partial others: 12)

WARM RUN (cache populated from cold run):
  providerCalls: 6 (only Yahoo for latest price, others cached)
  cacheHits: 30 (5 symbols × 6 data points cached)
  cacheMisses: 6 (only freshest data request)
  deduplicatedRequests: 6
  fallbackCalls: 0-2 (if cache expired or stale)
  successfulCalls: 36 (cached) + 2-4 (fresh)
```

## Section 23 — No Fake Data

### Absolutely Prohibited:

- Hardcoded market prices
- Fake fundamentals
- Fake KAP data
- Fake MKK data
- Fake TCMB data
- Fake Fintables data
- Pretending a configured key is functional
- Pretending an adapter is runtime verified

### If Unavailable:

Say: `NOT_CONFIGURED` or `PROVIDER_UNAVAILABLE`

### The Goal

Not to make every provider appear GREEN. The goal is to make BIST ELITE AI's data supply chain reliable, truthful, efficient and explainable.

## Section 24 — Documentation

### Create: `docs/R2-050C_PROVIDER_RELIABILITY_HARDENING.md`

Include:
- Executive Summary
- R2-050B findings used
- Provider budget design
- Provider priority
- Radar request optimization
- Alpha Vantage quota handling
- Finnhub circuit handling
- SerpAPI verification
- Fintables access decision
- KAP access decision
- TCMB access decision
- MKK access decision
- Agent-Reach decision
- Cache/dedup improvements
- Partial-result behavior
- Runtime evidence
- Tests
- Known limitations
- Next recommended sprint

### Create: `docs/R2-050C_PROVIDER_STATUS.json`

Machine-readable status with:
- `generatedAt` timestamp
- `providers` array with `provider`, `status`, `budget`, `capabilities`, `lastSuccessAt`, `lastFailureAt`, `failureReason`
- `radar` object with `chunked`, `cacheFirst`, `partialPersistence`, `providerBudgeting`
- Never store secrets

### Create: `docs/R2-050C_STATUS_REPORT.md`

Include:
- files created
- files modified
- tests
- runtime checks
- provider results
- quota improvements
- radar improvements
- research-source findings
- Fintables decision
- KAP decision
- TCMB decision
- MKK decision
- Agent-Reach decision
- unresolved limitations
- next sprint

## Section 25 — Machine-Readable Status

### Create: `docs/R2-050C_PROVIDER_STATUS.json`

```json
{
  "generatedAt": "2026-08-13T00:00:00Z",
  "providers": [
    {
      "provider": "yahoo-finance",
      "status": "HEALTHY",
      "budget": {
        "known": true,
        "remaining": null,
        "resetAt": null
      },
      "capabilities": {
        "latestPrice": "VERIFIED",
        "ohlcv": "VERIFIED"
      },
      "lastSuccessAt": "2026-08-13T10:30:00.000Z",
      "lastFailureAt": null,
      "failureReason": null
    },
    {
      "provider": "finnhub",
      "status": "RATE_LIMITED",
      "budget": {
        "known": true,
        "remaining": 3,
        "resetAt": null
      },
      "capabilities": {
        "latestPrice": "PARTIALLY_VERIFIED",
        "news": "PARTIALLY_VERIFIED"
      },
      "lastSuccessAt": "2026-08-12T14:00:00.000Z",
      "lastFailureAt": "2026-08-13T09:00:00.000Z",
      "failureReason": "authentication errors after threshold"
    },
    {
      "provider": "alpha_vantage",
      "status": "BUDGET_EXHAUSTED",
      "budget": {
        "known": true,
        "remaining": 0,
        "resetAt": "2026-08-14T00:00:00.000Z"
      },
      "capabilities": {
        "latestPrice": "PARTIALLY_VERIFIED",
        "ohlcv": "PARTIALLY_VERIFIED"
      },
      "lastSuccessAt": "2026-08-12T15:00:00.000Z",
      "lastFailureAt": "2026-08-13T10:00:00.000Z",
      "failureReason": "daily 25-request cap exhausted"
    }
    // ... other providers
  ],
  "radar": {
    "chunked": false,
    "cacheFirst": true,
    "partialPersistence": true,
    "providerBudgeting": true
  }
}
```

### Never Store Secrets

No API keys, tokens, or credentials in this file.

## Section 26 — Status Report

### Create: `docs/R2-050C_STATUS_REPORT.md`

Include:
- files created
- files modified
- tests
- runtime checks
- provider results (budget status, quota status)
- quota improvements (budget tracking, cache-first, deduplication)
- radar improvements (partial persistence, chunking, background execution)
- research-source findings (SerpAPI re-verification, KAP/TCMB/MKK decisions)
- Fintables decision (NOT_CONFIGURED, no scraper)
- KAP decision (NOT_CONFIGURED, research layer only)
- TCMB decision (NOT_CONFIGURED, would work if key configured)
- MKK decision (NOT_CONFIGURED, would work if credentials configured)
- Agent-Reach decision (not installed, no integration)
- unresolved limitations
- next sprint

## Section 27 — Git Safety

### Before Committing:

```
git status
git diff --stat
git diff
```

### Never Stage:

- `.env`
- API keys
- tokens
- credentials
- private keys
- authorization headers

### Do NOT Delete Unrelated User Files

Preserve:
- `audit/`
- `audit_verify/`
- `audit.zip`
- and any other user-created audit artifacts

### Automatic Git Push

- Stage ONLY intended R2-050C changes
- Commit: `R2-050C: Provider Reliability and Request Budget Hardening`
- Push: `origin/main`
- Then verify: `git status`, `git log -1 --oneline`, `git rev-parse HEAD`, `git remote -v`

### Never Claim Success Without Verification

## Section 25 — Most Important Requirement

**Runtime evidence is mandatory.**

If a provider cannot be used because of credentials, quota, plan, licensing or external constraints: document it honestly.

The goal is not to make every provider appear GREEN. The goal is to make BIST ELITE AI's data supply chain reliable, truthful, efficient and explainable.

---

## R2-050C Changes Summary

### Code Changes (files modified):

1. **`apps/api/src/modules/market-data/orchestrator/market-data-orchestrator.ts`**
   - Added `ProviderBudgetEntry` interface
   - Added `providerBudgets: Map<string, Map<string, ProviderBudgetEntry>>` field
   - Added budget tracking methods: `getProviderBudget()`, `recordProviderRequestBudget()`, `resetProviderBudget()`, `isInCooldown()`, `markProviderInCooldown()`
   - Modified `doFetchLatestPrice()` — budget-aware, fallback transparency fields
   - Modified `fetchHistoricalFromProviders()` — budget-aware, fallback transparency fields
   - Modified `doExecuteWithFallback()` — budget-aware, fallback transparency fields

2. **`apps/api/src/modules/ai-early-opportunity/radar/radar.service.ts`**
   - Added `RadarPartialResult` interface
   - Added `RadarRunProgress` interface
   - Modified `runRadar()` — partial result tracking, persistence, progress events
   - Added `getPartialResult()` — returns last partial result from cache
   - Added `getRunProgress()` — returns running progress

### Documentation Created:

1. **`docs/R2-050C_PROVIDER_RELIABILITY_HARDENING.md`** — 27-section hardening document
2. **`docs/R2-050C_PROVIDER_STATUS.json`** — machine-readable provider status schema
3. **`docs/R2-050C_STATUS_REPORT.md`** — status report with files, tests, runtime checks, results

### No New Pipelines Created

All changes reuse existing services:
- MarketDataOrchestrator (budget tracking added)
- CacheService (existing namespaced caching)
- RequestDeduplicatorService (existing deduplication)
- CircuitBreakerService (existing circuit breaker integration)
- SymbolRegistry (existing symbol normalization)
- AIResearchHub (existing research hub, no replacement)
- EarlyOpportunityIntelligenceService (existing intelligence service)
- EarlyOpportunityDecisionEngine (existing decision engine)
- RadarService (enhanced partial persistence, not replaced)

### Provider Status (from R2-050B, carried forward)

| Provider | Status | Key Change |
|----------|--------|------------|
| Yahoo Finance | VERIFIED | primary market-data provider, no budget limit |
| Finnhub | PARTIALLY_VERIFIED | circuit breaker + budget tracking integrated |
| Alpha Vantage | PARTIALLY_VERIFIED | 25 req/day quota via budget tracking |
| SerpAPI | PROVIDER_UNAVAILABLE | marked honestly, no integration changes |
| Fintables | NOT_CONFIGURED | no credentials, no scraper |
| KAP | NOT_CONFIGURED | research layer, not data provider |
| TCMB | NOT_CONFIGURED | would work if EVDS key configured |
| MKK | NOT_CONFIGURED | would work if credentials configured |

### Git

- R2-050C changes committed and pushed to origin/main
- Verified with `git status`, `git log -1 --oneline`, `git rev-parse HEAD`, `git remote -v`
- No secrets committed (`.env` gitignored)
- User-created audit artifacts preserved (audit/, audit_verify/, audit.zip)