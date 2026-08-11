# R2-022: Verification AI

**Status:** ✅ COMPLETE
**Date:** 2026-08-07

---

## MISSION

Verification AI **never predicts** and **never generates investment advice**.

Its only responsibility is **verifying information**.

Every research item produced by the AI Research Hub is checked against trusted sources, assigned a confidence score, and classified as TRUE / FALSE / PARTIAL / UNVERIFIED.

---

## ARCHITECTURE

### Module: `apps/api/src/modules/verification-ai/`

| File | Role |
|------|------|
| `verification-ai.types.ts` | `VerificationVerdict`, `TrustedSourceRank`, `VerificationEvidence`, `VerificationClaim`, `VerificationResult`, `VerificationReport` |
| `verification-ai.config.ts` | `TRUSTED_SOURCE_RANKS`, thresholds, company-IR detection, `VERIFICATION_CACHE_*` |
| `verification-rule-engine.ts` | `VerificationRuleEngine` — normalize → cross-check → evidence score → truth score → verdict |
| `verification-registry.ts` | `VerificationRegistry` — in-memory LRU store (max 200) |
| `verification-ai.service.ts` | `VerificationAIService` — reuses AI Research Hub, caching, refresh |
| `verification-ai.controller.ts` | `VerificationController` — REST endpoints |
| `dto/verification-ai.dto.ts` | `VerificationResultDto`, `VerificationReportDto`, `VerificationRefreshDto`, `VerificationClaimDto`, `VerificationEvidenceDto` |
| `verification-ai.module.ts` | `VerificationAIModule` (imports `AIResearchHubModule`) |

---

## VERIFICATION FLOW

```
AI Research Hub (cached consensus)
  ↓
Collect Sources (consensus.researchSources — already deduplicated by the hub)
  ↓
Normalize (map each source → trust rank, official flag)
  ↓
Cross-check (confirming vs conflicting vs trusted sources)
  ↓
Evidence Score (trust weight ratio + corroboration + official ratio)
  ↓
Truth Score (0.6×evidence + 0.4×agreement − conflict penalty)
  ↓
Verification Result (TRUE / FALSE / PARTIAL / UNVERIFIED)
```

---

## EVIDENCE SCORING

**Evidence Score** (0-1):

```
evidenceScore = 0.5 × weightRatio + 0.3 × corroboration + 0.2 × officialRatio
```

- `weightRatio` — sum of source trust weights / (count × 100)
- `corroboration` — distinct provider count / 3 (capped at 1)
- `officialRatio` — fraction of sources from official providers

**Truth Score** (0-1):

```
truthScore = clamp01(0.6 × evidenceScore + 0.4 × consensusAgreement − conflictPenalty)
```

- `conflictPenalty` = min(0.4, Σ conflictSeverity × 0.15) where high=2, medium=1, low=0.5

**Verdict thresholds:**

- `UNVERIFIED` — zero evidence sources
- `TRUE` — truthScore ≥ 0.7 and no conflicts
- `FALSE` — truthScore < 0.35
- `PARTIAL` — everything in between

---

## TRUSTED SOURCE PRIORITY

| Rank | Source | Provider Name | Weight |
|------|--------|---------------|--------|
| 1 | KAP | `kap` | 100 |
| 2 | Company IR | `company-ir` (marker detection) | 95 |
| 3 | TCMB | `tcmb` | 85 |
| 4 | MKK | `mkk` | 80 |
| 5 | Yahoo Finance | `yahoo-finance` | 70 |
| 6 | Finnhub | `finnhub-news` | 60 |
| 7 | SerpAPI Google News | `google-news` | 50 |
| 8 | SerpAPI Search | `serpapi` / `google-search` | 40 |

Company IR is auto-detected when a source string contains markers like `yatirimci`, `investor`, `ir.`, `ir@`, `investor-relations`.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/verification/:ticker` | Get verification for a ticker |
| GET | `/verification/report/:ticker` | Get a full verification report |
| POST | `/verification/refresh?ticker=THYAO.IS` | Force a verification refresh |

All endpoints are `@Public()`.

---

## VERIFICATION OBJECT

Every `VerificationResult` contains:

- `ticker`
- `verified` — TRUE / FALSE / PARTIAL / UNVERIFIED
- `verificationScore` — 0-100
- `evidenceCount`
- `sourceCount`
- `trustedSources` — ranked trusted source names
- `conflictingSources` — sources flagged by consensus conflicts
- `lastVerified`
- `verificationReason` — Turkish explainable reason
- `claims[]` — per-claim evidence score, truth score, trusted/conflicting sources, reason
- `rawSources` — the hub research sources used

---

## EXAMPLE

`GET /verification/report/ASELS.IS`:

```json
{
  "ticker": "ASELS.IS",
  "summary": {
    "verified": "TRUE",
    "verificationScore": 92,
    "evidenceCount": 6,
    "sourceCount": 4,
    "trustedSources": ["KAP", "TCMB"],
    "conflictingSources": []
  },
  "claims": [
    {
      "statement": "ASELS yeni bir savunma sözleşmesi kazandı.",
      "verdict": "TRUE",
      "evidenceScore": 0.93,
      "truthScore": 0.92,
      "evidenceCount": 6,
      "sourceCount": 4,
      "trustedSources": ["KAP", "TCMB"],
      "conflictingSources": [],
      "reason": "6 kanıt, 4 güvenilir kaynak ile doğrulandı (güven skoru 92)."
    }
  ]
}
```

---

## PERFORMANCE

- **ZERO duplicated provider requests** — Verification AI never calls providers directly; it consumes the AI Research Hub's already-collected, deduplicated consensus.
- **ZERO duplicated verification requests** — results cached in global `CacheService` namespace `research` (key `verification:{TICKER}`, TTL 10 min) + in-memory `VerificationRegistry`.
- Reuses `AIResearchHubService.getConsensus()` (itself cached with 5-min TTL) — identical content never re-verified.

---

## TESTING

Gate: `node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` clean; `jest verification-ai` green.

**4 suites / 30 tests** (R2-022):

| Suite | Tests |
|-------|-------|
| `verification-rule-engine.spec.ts` | normalize/dedupe, trust ranks, company-IR, evidence score, truth score, verdicts, TRUE/FALSE/PARTIAL/UNVERIFIED results |
| `verification-registry.spec.ts` | save/get, recency order, re-save to front, LRU eviction, clear |
| `verification-ai.service.spec.ts` | reuses hub consensus, caching, refresh, reports, case normalization |
| `verification-ai.controller.spec.ts` | verification DTO, report DTO, refresh |

Regression gates green: `jest ai-research` (6 suites / 40 tests), `jest backtest` (11 suites / 144 tests), `jest research` (10 suites / 70 tests).

---

## FILES CREATED

```
apps/api/src/modules/verification-ai/
  verification-ai.types.ts
  verification-ai.config.ts
  verification-rule-engine.ts
  verification-rule-engine.spec.ts
  verification-registry.ts
  verification-registry.spec.ts
  verification-ai.service.ts
  verification-ai.service.spec.ts
  verification-ai.controller.ts
  verification-ai.controller.spec.ts
  verification-ai.module.ts
  index.ts
  dto/verification-ai.dto.ts
```

## FILES MODIFIED

```
apps/api/src/app.module.ts        (register VerificationAIModule)
docs/MASTER_ROADMAP.md            (R2-022 complete)
docs/AI_HANDOFF.md                (R2-022 complete, engines/registries/APIs)
docs/PROJECT_STATUS.md            (R2-022 complete)
```

---

## INTEGRATION POINTS

- `AIResearchHubService` (AIResearchHubModule) — cached consensus as the sole evidence input
- `CacheService` (common) — verification cache namespace `research`, key prefix `verification:`
- `Public` decorator (common/auth)
- Base `VerificationEngine` (research module) — retained and untouched; R2-022 adds a new AI layer on top of the hub consensus

---

## KNOWN LIMITATIONS

1. Verification confidence depends on hub consensus freshness (hub TTL 5 min).
2. Company-IR detection is heuristics-based (marker substrings), not a dedicated IR provider yet.
3. In-memory registry is lost on restart (consistent with other registries).
4. No persistence of verification history.

---

## NEXT RECOMMENDED SPRINT

**R2-023: TradingView Integration** — TradingView widget data ingestion, chart + screen integration, alert source wiring.
