# R2-008 — BIST Master Symbol Registry

Canonical registry of the complete discoverable Borsa İstanbul universe. Reproducible, never hand-edited.

## Method (reproducible)
- **Step 1** source discovery (priority order): Yahoo Finance (live chart probe), KAP public API (`/tr/api/company/items/IGS/A` — 746 listed companies), existing local registry (`bist-symbols.data.ts` — 52 entries), MKK/Borsa İstanbul (documented, no free bulk API found).
- **Step 3** generation: `node scripts/generate-bist-master-registry.mjs` fetches KAP, expands multi-code company records into per-ticker records, probes every active ticker against Yahoo, classifies asset type, enriches with local ISIN/names, and writes `bist-master-registry.data.ts`. Requires no manual edits.

## Registry Summary
| Metric | Count |
|---|---|
| **Total instruments (distinct ticker codes)** | **795** |
| Active | 643 |
| Inactive | 152 |
| Current registry (R2-007 baseline) | 52 (51 active) |
| Yahoo-covered (active, live price) | 623 |
| ISIN enriched (from local registry) | 42 |

## Asset-Type Classification
| Asset Type | Count |
|---|---|
| Equity | 625 |
| REIT | 57 |
| Bank | 48 |
| Fund / Financial-Leasing / Factoring | 29 |
| Investment Trust | 15 |
| Holding | 15 |
| Insurance | 4 |
| Institutional | 2 |

> KAP `financialType` values `SIR`/`GYO`/`GSYO`/`YO`/`HLD`/`SIG`/`BNK`/`FFF`/`KTL` drive classification; null financialType defaults to Equity unless the title/SUFFIX pattern indicates REIT (`GYO`), Trust (`YO`), or Fund.
> **Known gap:** BIST ETFs, funds, indices, rights, warrants, and preferred-share instruments are separate market instrument types and are **not present in the KAP company feed**. They are not counted in the totals above and require a dedicated bulk instrument source (see Recommendations).

## Coverage Per Provider (of 643 active)
| Provider | Covered | Coverage % | Missing % | Notes |
|---|---|---|---|---|
| Yahoo Finance | 623 | 96.9% | 3.1% | Live probe verified; 20 are group/prefix codes (e.g. `TGB`→`GARAN`, `SEK`→`SKBNK`) whose canonical ticker is already covered, or `KTEST` (KAP test stub) → **100% of real distinct instruments** |
| KAP | 643 | 100% | 0% | Source of universe; all tickers present |
| Local Registry | 52 | 8.1% | 91.9% | Prior curated subset; ISIN/name enrichment source |
| Alpha Vantage | 0 | 0% | 100% | No BIST coverage (documented R2-007C) |
| Finnhub | 0 | 0% | 100% | No BIST coverage; calendar/premium 403 |
| SerpAPI | — | — | — | Search engine; not a price/download source |
| TCMB / MKK | — | — | — | Macro / ownership; not a price symbol source |

## Runtime Verification (STEP 5 — historical download, live Yahoo)
Random sample `{THYAO, EREGL, SISE, AKBNK, ASELS, TUPRS, GARAN, PGSUS}`:
| Timeframe | Ok | Points (sample) |
|---|---|---|
| 1d | 8/8 | 253 pts @ ~2025-08-04 |
| 1w | 8/8 | 105 pts @ ~2024-08-04 |
| 1m | 8/8 | 60 pts @ ~2021-08 |
| 6m | 8/8 | 315 pts @ ~2000-05 |
| 1y | source OK | provider map lacks `1y` (returns []) |
| 5y | source OK | provider map lacks `5y` |
| max | source OK | provider map lacks `max` |
| Corporate actions | 8/8 | dividends+splits parsed (THYAO 2, EREGL 10, SISE 11) |

Direct Yahoo chart probe confirms `range=1y/5y/max` return data back to 2000; the existing `YahooFinanceProvider.TIMEFRAME_MAP` exposes only `4h/1d/1w/1m/3m/6m` (Provider Layer unchanged per sprint rules — `1y/5y/max` remain a recommendation).

## Missing Symbols
20 of 643 active codes lack a standalone live Yahoo quote; **all are group/prefix codes** whose canonical ticker is separately covered, plus `KTEST` (KAP test stub): `ALK, ACP, GLB, ICB, IYF, IYM, KTEST, OMD, OYA, FIN, SKY, SEK, TRA, TGB, THL, TIB, KLN, TSK, TVB, YKB`. No genuine trading symbol is missing.

## Recommendations
- Add a dedicated BIST instrument bulk source (Borsa İstanbul / MKK / TEFAS) to enumerate ETFs, funds, indices, rights, warrants, and preferred shares that KAP's company feed omits.
- Extend `YahooFinanceProvider.TIMEFRAME_MAP` with `1y`, `5y`, `max` (next sprint — Provider Layer was frozen this sprint).
- Enrich ISIN/sector/industry for the full 795 using KAP per-company or MKK endpoints (only 42 ISINs currently from the local 52-entry subset).
- Regenerate the registry on a schedule to keep new listings / delistings current.

## Conclusion
Build GREEN, tests GREEN, canonical registry created (795 instruments, 643 active), coverage measured, missing symbols documented. No architecture, Provider-Layer, Scheduler, or Scanner changes. Reproducible generation via `scripts/generate-bist-master-registry.mjs`. Ready for next sprint.