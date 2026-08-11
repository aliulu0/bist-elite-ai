# R2-013 — AI Opportunity Engine

## Overview

The AI Opportunity Engine sits on top of the **AI Decision Engine** and converts an investment decision into an actionable Turkish opportunity classification. It answers the question: *"Is this stock a real opportunity right now, and how strong is it?"*

Like the Decision Engine, everything is **deterministic rule evaluation** — no GPT, no LLM, no randomness. Identical inputs always produce identical outputs. It performs **zero** provider requests and **zero** indicator calculations: it only consumes already-computed scores (reusing `DecisionEngine` for the underlying decision).

## Supported Opportunity Levels

| Level | Emoji | Strength | Meaning |
| --- | --- | --- | --- |
| ÇOK_GÜÇLÜ_FIRSAT | 🔥 | 5 | Very strong opportunity — all signals aligned |
| GÜÇLÜ_FIRSAT | 🟢 | 4 | Strong opportunity |
| FIRSAT | 🟢 | 3 | Real investment opportunity |
| İZLEME_LISTESI | 🟡 | 2 | Watchlist candidate |
| BEKLE | ⚪ | 1 | No clear opportunity right now |

## Architecture

```
Scanner Engine
        │
        ▼
EliteScannerResult ──► ScoreEngine outputs (AI Score, Confidence, 10 dimensions)
        │
        ▼
  DecisionEngine.evaluate(input)          (reused, not recalculated)
        │
        ▼
  OpportunityEngine.evaluate(input, decision)
        │
        ├── opportunity-rules.ts              (level table, first-match-wins)
        ├── opportunity-explanation.service.ts (11 tags + Turkish reasons/warnings)
        ├── OpportunityRankingService         (Level → Score → Decision → AI Score → Confidence)
        ├── OpportunityRegistry               (in-memory store + ranking)
        ▼
   OpportunityResult
```

## Deterministic Opportunity Level Rules

Rules are evaluated **first-match-wins** in this exact order:

1. **ÇOK_GÜÇLÜ_FIRSAT** — decision `GÜÇLÜ_AL`
2. **GÜÇLÜ_FIRSAT** — decision `AL`
3. **FIRSAT** — decision `İZLE && aiScore >= 70`
4. **İZLEME_LISTESI** — decision `İZLE` OR (`BEKLE && aiScore >= 55`)
5. **BEKLE** — fallback (includes `RİSKLİ`, `SAT`, `GÜÇLÜ_SAT`)

## Opportunity Tags (11)

The engine attaches dynamic Turkish tags when the corresponding signal is present:

| Tag | Condition |
| --- | --- |
| Erken Kırılım | technical >= 75 && momentum >= 65 |
| Akıllı Para | strategy `smart-money` && strategyScore >= 65 |
| Dip Toplama | strategy `dip-collector` && strategyScore >= 65 |
| Trend Başlangıcı | trend >= 75 |
| Momentum | momentum >= 70 |
| Hacim Patlaması | volume >= 75 |
| Doğrulanmış Haber | verification >= 75 |
| Yeni Katalizör | catalyst >= 70 |
| Güçlü Temel | fundamental >= 75 |
| Düşük Risk | risk >= 75 |
| Yüksek Likidite | liquidity >= 75 |

## Opportunity Score & Confidence

- **Opportunity Score (0-100)**: weighted average of available production scores — AI Score (25%), AI Confidence (10%), Strategy Score (10%), Verification (10%), Catalyst (10%), Technical (5%), Fundamental (5%), Momentum (5%), Trend (5%), Quality (5%).
- **Confidence (0-100)**: `70% × decision confidence + 30% × data completeness`.

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/opportunity` | All stored opportunities, ranked |
| `GET /api/opportunity/top` | Strongest opportunities (default limit 10) |
| `GET /api/opportunity/:ticker` | Opportunity for one ticker (404 with Turkish message if absent) |
| `POST /api/opportunity/batch` | Evaluate a batch of pre-computed score inputs |

### Example request

```json
POST /api/opportunity/batch
{
  "items": [
    {
      "ticker": "THYAO",
      "company": "Türk Hava Yolları",
      "strategyId": "value-hunter",
      "aiScore": 95,
      "aiConfidence": 90,
      "dimensions": { "verification": 85, "catalyst": 80, "risk": 70 }
    }
  ]
}
```

### Example response (excerpt)

```json
{
  "baslik": "Fırsat Hesaplama Sonuçları",
  "toplamFirsat": 1,
  "sonuclar": [
    {
      "ticker": "THYAO",
      "company": "Türk Hava Yolları",
      "level": "ÇOK_GÜÇLÜ_FIRSAT",
      "levelLabel": "Çok Güçlü Fırsat",
      "levelEmoji": "🔥",
      "opportunityScore": 67,
      "confidence": 95,
      "decision": "GÜÇLÜ_AL",
      "decisionLabel": "GÜÇLÜ AL",
      "decisionScore": 78,
      "decisionConfidence": 93,
      "reasons": [
        "Çok güçlü fırsat tespit edildi — tüm göstergeler olumlu",
        "Karar: GÜÇLÜ AL",
        "AI skoru: 95",
        "Etiket: Düşük Risk"
      ],
      "warnings": [],
      "positiveSignals": ["Güçlü doğrulama", "Güçlü katalizör desteği", "Düşük risk profili"],
      "negativeSignals": [],
      "tags": ["Düşük Risk"]
    }
  ]
}
```

## Scanner Integration

Every scanner result now carries both a `decision` object and an `opportunity` object (Level, Label, Emoji, Opportunity Score, Confidence, Decision, Tags, Reasons, Warnings, Positive/Negative Signals).

Scanner ranking order: **1) Decision → 2) AI Score → 3) Confidence**.

Opportunity ranking order (registry + API): **1) Level → 2) Opportunity Score → 3) Decision → 4) AI Score → 5) Confidence**.

## Compatibility Notes

- The legacy `apps/api/src/modules/opportunity/` module (used by market-scanner, pipeline-orchestrator, rule-analytics) is **untouched**. R2-013 lives in `apps/api/src/modules/ai-opportunity/` and is registered in `AppModule` as `AiOpportunityModule` to avoid a name collision.
- Future compatibility only — Prediction, Portfolio, Backtesting, Notifications, ML/LLM, and UI are **not** implemented.

## Performance

- The engine performs **zero** provider requests and **zero** indicator calculations.
- `OpportunityEngine.evaluate` reuses the injected `DecisionEngine` when no precomputed decision is passed, and `evaluateMany` accepts a `Map<ticker, DecisionResult>` to skip re-evaluation entirely.
- `OpportunityRegistry` is in-memory (`Map`), O(1) lookup per ticker.

## Files

- `apps/api/src/modules/ai-opportunity/opportunity.types.ts`
- `apps/api/src/modules/ai-opportunity/opportunity-rules.ts`
- `apps/api/src/modules/ai-opportunity/opportunity-explanation.service.ts`
- `apps/api/src/modules/ai-opportunity/opportunity-ranking.service.ts`
- `apps/api/src/modules/ai-opportunity/opportunity-registry.service.ts`
- `apps/api/src/modules/ai-opportunity/opportunity-engine.service.ts`
- `apps/api/src/modules/ai-opportunity/opportunity.dto.ts`
- `apps/api/src/modules/ai-opportunity/opportunity.controller.ts`
- `apps/api/src/modules/ai-opportunity/opportunity.module.ts`
- `apps/api/src/modules/ai-opportunity/opportunity.spec.ts`
