# R2-071 Status Report: Market Truth Runtime Validation & Provider Reconciliation

**Generated**: 2026-08-17 (runtime probes 08:46 UTC)  
**Typecheck**: PASSED (0 errors)  
**Tests**: 30/30 suites; 511 passed / 1 skipped (market-data)  
**Scope**: 10 BIST symbols, 5 direct providers probed live

---

## Build

- TypeScript typecheck `tsc --noEmit -p apps/api/tsconfig.json`: **0 errors**
- MarketDataController imports fixed (`Optional` from `@nestjs/common`, `ConsensusResult` import) → typecheck clean

## Tests

- 30/30 market-data test suites pass
- 511 tests pass, 1 skipped
- Opportunity engine: 34/34 (from R2-070 baseline)
- No new live-API tests added to CI; live probing was done via a standalone script

## Runtime Checks

- Standalone Node.js probe hit provider HTTP endpoints directly (global `fetch`), reading keys from `.env` without printing them
- 10 symbols: THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN, ISCTR, KCHOL, SAHOL, EREGL

## Provider Results

| Provider                   | Result                      | Evidence                                                                                                                                                                              |
| -------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Yahoo Finance**          | **VERIFIED**                | Real TRY prices for all 10 symbols (THYAO 305.5, AKBNK 68.80, ASELS 387.5, BIMAS 375.75, TUPRS 362.75, GARAN 131.20, ISCTR 12.52, KCHOL 206.10, SAHOL 89.20, EREGL 37.68) @ 08:46 UTC |
| **Finnhub**                | **AUTH_FAILED**             | `"You don't have access to this resource."` — key has no BIST access                                                                                                                  |
| **Alpha Vantage**          | **NO_QUOTE / RATE_LIMITED** | Empty Global Quote for THYAO.IS; free-tier ~1 req/sec hit on 2nd call                                                                                                                 |
| **SerpAPI Google Finance** | **NO_RESULTS**              | `"Google Finance hasn't returned any results for this query."` for THYAO.IS                                                                                                           |
| **SerpAPI Research**       | INTEGRATED                  | google_search/news adapters; research evidence only                                                                                                                                   |
| **Agent-Reach**            | INTEGRATED (research only)  | RESEARCH_PRICE_EVIDENCE; never direct market data                                                                                                                                     |
| **Fintables**              | **NOT_CONFIGURED**          | email/password missing in .env; no smoke test possible                                                                                                                                |
| **KAP**                    | NOT_TESTED                  | disclosure only                                                                                                                                                                       |
| **TCMB**                   | NOT_TESTED                  | FX/macro only                                                                                                                                                                         |
| **MKK**                    | NOT_TESTED                  | ownership data only                                                                                                                                                                   |

## Consensus Results

- **All 10 symbols: SINGLE_SOURCE** (Yahoo-only)
- No MULTI_SOURCE_CONFIRMED
- No STALE_SOURCE_ONLY
- No NO_VALID_PRICE

## Price Conflicts

- **None observed** — only one independent direct provider (Yahoo) returned a price. No conflict could arise, and none was fabricated.

## Price Confidence

- **LOW for all 10 symbols** (deterministic model: 1 direct source → LOW)
- `priceConfidence=LOW`, `priceSourceCount=1`, `priceSources=[yahoo-finance]`, `priceConflict=null`, `priceFreshness=fresh`

## Agent-Reach

- Research access layer, not a market-data API
- No `agent-reach doctor` binary in repo
- Price evidence classified RESEARCH_PRICE_EVIDENCE / INDIRECT_EVIDENCE / UNVERIFIED
- Does NOT participate in numeric consensus; does not override Yahoo

## SerpAPI

- `google_finance` engine: **does not return BIST `.IS` results** (verified for THYAO)
- `google_search`/`google_news`: research adapters integrated
- Research snippets are never masqueraded as market data
- Quota conserved: only 1 google_finance probe

## Fintables

- NOT_CONFIGURED (email/password absent)
- No claims made about authentication, prices, or fundamentals

## External Integrations

| Repo          | Status                             |
| ------------- | ---------------------------------- |
| TradingAgents | ADAPTER_ONLY / NOT_ACTIVATED       |
| NOFX          | ADAPTER_ONLY / NOT_ACTIVATED       |
| AI-Berkshire  | ADAPTER_ONLY / NOT_ACTIVATED       |
| Agent-Reach   | INTEGRATED_RUNTIME (research only) |
| VectorBT      | NOT_ACTIVATED                      |

No autonomous trading. No replacement of the BIST ELITE AI brain.

## BISTScan Capability

All core capabilities present: market overview, top gainers/losers, volume leaders, unusual volume, price movers, technical signals, opportunity radar, stock detail, research evidence. Gap: explicit sector performance breakdown (P2). No UI redesign.

## Defects Found

| ID         | Severity | Description                                                                                            |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------ |
| R2-071-D01 | HIGH     | SerpAPI Google Finance NO_RESULTS for BIST `.IS` — R2-070 secondary-source claim not runtime-confirmed |
| R2-071-D02 | HIGH     | R2-070 artifacts contained price figures not from runtime probes (THYAO 305.25 vs real 305.5)          |
| R2-071-D03 | MEDIUM   | Finnhub key has no BIST access (AUTH_FAILED)                                                           |
| R2-071-D04 | MEDIUM   | Alpha Vantage no BIST quote + free-tier rate limits                                                    |
| R2-071-D05 | HIGH     | Fintables not configured                                                                               |

## Fixes Implemented

| ID         | Description                                              |
| ---------- | -------------------------------------------------------- |
| R2-071-F01 | Controller imports fixed → typecheck 0 errors            |
| R2-071-F02 | R2-071 artifacts rewritten with real runtime prices only |
| R2-071-F03 | Conservative quota usage in runtime probe                |
| R2-071-F04 | Provider hierarchy corrected per runtime evidence        |

## Unresolved Limitations

1. Only Yahoo verified → all symbols SINGLE_SOURCE, confidence LOW
2. Fintables needs credentials before any fundamental verification
3. Finnhub needs a BIST-enabled key
4. Alpha Vantage free tier can't serve BIST quotes
5. SerpAPI Google Finance doesn't recognize BIST `.IS` symbols
6. R2-070 committed artifacts contain unverified figures (flagged; not force-pushed)

## Next Sprint

1. Configure Fintables credentials and smoke-test fundamentals (P/E, P/B, revenue, EBITDA, margins) for THYAO/AKBNK/ASELS
2. Re-provision Finnhub with BIST access, or mark FINNHUB=UNUSABLE in config
3. Research the correct exchange/symbol format for SerpAPI Google Finance (BIST = `İST:THYAO`?), or drop it as a price source
4. Add live smoke-test flags (behind explicit env) for provider reconciliation tests
5. Frontend: show Kaynak / Güven / Güncellik / FİYAT UYUŞMAZLIĞI per R2-071 confidence model
6. Correct the R2-070 matrix/audit price figures in a follow-up commit

---

_R2-071 Status Report — generated from real runtime evidence. No fabricated values._
