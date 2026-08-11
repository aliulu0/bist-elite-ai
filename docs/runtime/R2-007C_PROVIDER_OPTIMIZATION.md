# R2-007C — External Provider Optimization

## Scope
Runtime-level optimization of the existing external providers for BIST (Borsa Istanbul). No new features, no duplicate providers, no architecture/contract/DTO/Scheduler changes. Reuses Provider Health Monitor, Unified Provider, Cache, Retry, Circuit Breaker.

## Reference Environment
- Root `.env` provides `SERPAPI_API_KEY`, `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`. No `FINTABLES_API_KEY` in env (authentication intentionally not implemented).
- BIST registry: 52 canonical entries (`bist-symbols.data.ts`), 51 `active:true`, 1 `active:false`. Dashboard coverage = 51.

## Per-Provider Verification

| Provider | Status | Coverage | Avg Latency | Limitations | Recommendations |
|---|---|---|---|---|---|
| **Yahoo Finance** | ✅ Working | Quote, OHLC, Historical, Volume, Corporate Actions, BIST (`THYAO.IS`) | quote-meta 518ms, corp-actions 234ms, historical 81ms | `fetchCompany` chart meta has no sector → sector `Unknown`, marketCap 0 | (below) |
| **SerpAPI** | ⚠️ Partial (engine-dependent) | Google News, Google Search, Turkish results | google_news ~9.5s (100 items), google search ~3.4s (10 organic) | Google Finance returns **no results for any ticker incl. AAPL** → account/tier limitation (plan-limited), not query format. AI Mode returns Success but empty on current plan. | (below) |
| **Alpha Vantage** | ⚠️ Auth required / no BIST | US symbols only | — | Returns empty `{}` for `THYAO.IST`, `THYAO.IS` — BIST unsupported. | Use only for US instruments. Document non-BIST. |
| **Finnhub** | ⚠️ Partial | General News only | — | `/calendar/economic`, `/calendar/earnings` → **HTTP 403 (premium)**; `/economics?country=tr` → 200 HTML shell (SPA, no data); BIST symbols unsupported. News works. | Keep news; treat calendar/macro as unavailable. |
| **TCMB (EVDS)** | ✅ Prepared | Macro indicators, Turkey rate | — | Requires `TCMB_API_KEY` from `.env` (never hardcoded); key-gated `validateConnection`. | Provide key via env. |
| **Fintables** | ✅ Prepared (docs/interface only) | /health, interface | /health: 403 (anti-bot) without key | No authentication implemented (by design). | Keep interface + docs; add key later. |
| **KAP** | ✅ Existing | Announcements | — | — | — |
| **MKK** | ✅ Existing | Ownership | — | — | — |

## Task 1 — SerpAPI Optimization
- **Google News**: dedicated `google_news` engine returns up to 100 news items (verified live) with `status: Success`. `searchNews`, `fetchNews`, `fetchSectorNews`, `fetchEconomicNews` now route to `newsEngine` (new config field, defaults to `SERPAPI_NEWS_ENGINE || 'google_news'`) instead of the search engine.
- **Google Finance**: verified live — returns `Google Finance hasn't returned any results for this query` for every ticker tested (`THYAO`, `THYAO:BIST`, `BIST:THYAO`, `THYAO.IS`, and US control `AAPL`). This is a plan/account-tier limitation, **not** a query-format problem. `searchFinancial` now falls back to a normal Google search (`searchEngine`) when Google Finance yields nothing, so a company card (organic + news) is still returned. `toGoogleFinance` name resolution extended to `organic_results[0].title`.
- **Google Search**: works (10 organic results, Turkish-appropriate queries).
- **AI Mode**: returns `status: Success` but empty on the current SerpAPI plan — documented.

## Task 2 — Yahoo Finance Optimization
- Verified live against built `dist`: `getQuoteMeta` (chart `meta`: `longName` `Türk Hava Yollari Anonim Ortakligi`, currency `TRY`, exchange `IST`/`Istanbul`, 52-week high 355.5 / low 262.75, `regularMarketVolume`); `getCorporateActions` (chart `events`, 10y, dividends+splits — 2 dividends parsed); historical OHLCV (253 daily points).
- Unified adapter `fetchCompany` rewritten to use `getQuoteMeta` (chart endpoint) — the previous `v7/finance/quote` returned HTTP 401. `sector` is `Unknown` and `marketCap` 0 because chart `meta` exposes no sector/market-cap field.
- Added exported types `YahooChartMeta` / `YahooCorporateAction`; widened chart `meta` type. Removed unused adapter-local `fetchQuote` and `toYahooSymbol`.

## Task 3 — Alpha Vantage
No code path change needed. Documented: BIST symbols return empty `{}`. Use only for US instruments.

## Task 4 — Finnhub
Documented: BIST unsupported; `/calendar/*` and `/economics` unavailable on current plan. News (`/news?category=general`) works.

## Task 5 — TCMB / EVDS
`TCMB_API_KEY` read from `.env` only (no hardcoded credentials). `validateConnection` returns false when key absent and requires `body.success === true`.

## Task 6 — Fintables
Interface + documentation only. `validateConnection` returns false without a key before any network call. Authentication intentionally not implemented.

## Task 7 — Provider Health
`validateConnection` gating hardened for SerpAPI (status check + `BIST İstanbul` probe), TCMB (success check), Fintables (key gate), Alpha Vantage (existing). Retry, Circuit Breaker, Timeout, Quota counters reused unchanged (BaseProviderAdapter).

## Task 8 — Runtime Verification
- `pnpm --filter @bist-elite/api build` → **GREEN (EXIT 0)**.
- Live probes (`r2-007c-runtime-probe.cjs`) against built `dist`: Yahoo quote-meta 518ms, corporate-actions 234ms (2 dividends), historical 253 points 81ms, unified `fetchCompany` 75ms.
- Live HTTP format probe (`r2-007c-serpapi-format-probe.cjs`): google_news 100 items, google search 10 organic, google_finance empty (all tickers), AI Mode empty.

## Known Issues
- SerpAPI Google Finance + AI Mode return no data on the current plan/tier.
- Yahoo `fetchCompany` sector is `Unknown` (chart meta lacks sector/market-cap).
- Finnhub calendar/macro = 403/HTML (premium), BIST unsupported.
- Alpha Vantage has no BIST coverage.
- Fintables anti-bot 403 without a key.

## Conclusion
Build GREEN, runtime verified, Provider Health verified. No architecture changes, no duplicate providers, no DTO/contract changes, no Scheduler changes. Ready for next sprint.