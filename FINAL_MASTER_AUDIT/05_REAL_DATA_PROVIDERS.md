# 05 — REAL DATA PROVIDER AUDIT

> Provider configuration is read from `.env` / `market-data.config.ts` at runtime. This audit inspected `.env` keys **without printing values** and the adapter code.

## Provider configuration matrix

| Provider | Adapter | `.env` key | Key configured? | Expected behavior in this env |
|---|---|---|---|---|
| Yahoo | `yahoo-unified.adapter.ts` | none required | — | Should work (no key) — **network-blocked from this shell (ECONNREFUSED)** |
| Alpha Vantage | `alpha-vantage.adapter.ts` | `ALPHA_VANTAGE_API_KEY` | **NO** | Fast-fail; unavailable |
| Finnhub | `finnhub.adapter.ts` | `FINNHUB_API_KEY` | **NO** | Fast-fail 401; **partial** only via company-profile path in prior runs |
| Fintables | `fintables-unified.adapter.ts` | `FINTABLES_API_KEY` | **NO** | 403/404, circuit-protected |
| KAP | `kap.adapter.ts` | `KAP_API_KEY` | **NO** (Bearer optional) | **WORKS** — public disclosures (prior truth-audit verified) |
| MKK | `mkk.adapter.ts` | `MKK_API_KEY`/creds | **NO** | "credentials not configured" |
| TCMB | `tcmb.adapter.ts` | `TCMB_API_KEY` | **NO** | EVDS disabled; macro empty |
| SerpAPI | `serpapi.adapter.ts` | `SERPAPI_API_KEY` | **NO** | Disconnected; rate-limited previously |

## Findings

1. **Only KAP** demonstrated real usable output in prior validation (disclosures, Turkish). Finnhub showed partial (company profile) capability before its key situation changed.
2. **No market-data API keys are configured** in `.env`. Every keyed provider fast-fails or runs disconnected → the live OHLCV + fundamental pipeline has **no real data source** in this environment.
3. Yahoo needs no key but **cannot reach network from this shell** (ECONNREFUSED observed in earlier audit runs).
4. Circuit-breakers exist (Fintables 403 → open after 3 fails) so failures degrade gracefully, but graceful degradation is still **no data**.
5. `MarketDataOrchestrator` caching/dedup is present and well-tested, but it only helps when a provider actually returns data.

## Classification

- `REAL_AND_WORKING`: KAP (disclosures only).
- `PARTIAL`: Finnhub (company profile historically), SerpAPI (news research historically).
- `BROKEN_OR_UNCONFIGURED` (in this env): Yahoo (network), Alpha Vantage (no key), Fintables (no key), MKK (no creds), TCMB (no key).
- **No provider supplies real BIST OHLCV candles in this environment** → any dashboard/scanner output is effectively empty or `INVALID_OPPORTUNITY`.

## Verdict

- Real-data readiness: **LOW**. Requires adding at least one keyed OHLCV provider (Finnhub or Fintables) or a working Yahoo path, then a live smoke test.
