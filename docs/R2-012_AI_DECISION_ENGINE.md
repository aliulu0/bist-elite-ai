# R2-012 — AI Decision Engine

## Overview

The AI Decision Engine is the layer between the **AI Score Engine** and the final investment action. It takes the deterministic outputs of the Score Engine (AI Score, AI Confidence, Strategy Score, all 10 dimension scores) and converts them into a single, explainable, Turkish investment decision.

Every decision is produced by **deterministic rule evaluation** — no GPT, no LLM, no randomness. Identical inputs always produce identical outputs.

## Supported Decisions

| Decision | Strength | Meaning |
| --- | --- | --- |
| GÜÇLÜ AL | 7 | All signals aligned for a strong buy |
| AL | 6 | Overall view is bullish |
| İZLE | 5 | Wait for market to confirm |
| BEKLE | 4 | No clear signal, wait |
| RİSKLİ | 3 | Elevated risk profile, be cautious |
| SAT | 2 | Weak signals, selling pressure |
| GÜÇLÜ SAT | 1 | Strong sell signal |

## Architecture

```
Scanner Engine
        │
        ▼
EliteScannerResult ──► ScoreEngine outputs (AI Score, Confidence, 10 dimensions)
        │
        ▼
  DecisionEngine.evaluate(input)
        │
        ├── decision-rules.ts          (rule table, first-match-wins)
        ├── decision-explanation.service.ts  (Turkish reasons/warnings/signals/stars)
        ├── DecisionRegistry           (in-memory store + ranking)
        ▼
   DecisionResult
```

## Deterministic Decision Rules

Rules are evaluated **first-match-wins** in this exact order:

1. **GÜÇLÜ AL** — `aiScore >= 90 && aiConfidence >= 85 && verification >= 80 && catalyst >= 75`
2. **GÜÇLÜ SAT** — `aiScore <= 20`
3. **RİSKLİ** — `risk <= 30` *(risk is a safety score: low = high risk)*
4. **AL** — `aiScore >= 75 && aiConfidence >= 65`
5. **SAT** — `aiScore <= 40`
6. **İZLE** — `aiScore >= 60`
7. **BEKLE** — fallback when no rule matches

## Decision Score & Confidence

- **Decision Score (0-100)**: weighted average of available production scores — AI Score (30%), AI Confidence (15%), Strategy Score (10%), Verification (10%), Catalyst (10%), Technical (5%), Fundamental (5%), Momentum (5%), Trend (5%), Risk (5%).
- **Confidence (0-100)**: `70% × AI Confidence + 30% × data completeness` (fraction of the 10 dimensions present).

## AI Overview (Star Ratings)

7 dimensions — **Trend, Momentum, Risk, Doğrulama, Katalizör, Likidite, Kalite** — each rendered as 1-5 stars:

| Score | Stars |
| --- | --- |
| 80+ | ★★★★★ |
| 60-79 | ★★★★☆ |
| 40-59 | ★★★☆☆ |
| 20-39 | ★★☆☆☆ |
| 0-19 / null | ★☆☆☆☆ |

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/decision/top` | Strongest decisions, ranked by Decision → AI Score → Confidence |
| `GET /api/decision/all` | All stored decisions |
| `GET /api/decision/:ticker` | Decision for one ticker (404 with Turkish message if absent) |
| `POST /api/decision/batch` | Evaluate a batch of pre-computed score inputs |

### Example request

```json
POST /api/decision/batch
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
  "baslik": "Karar Hesaplama Sonuçları",
  "islenen": 1,
  "sonuclar": [
    {
      "ticker": "THYAO",
      "company": "Türk Hava Yolları",
      "decision": "GÜÇLÜ_AL",
      "decisionLabel": "GÜÇLÜ AL",
      "decisionScore": 78,
      "confidence": 93,
      "reasons": [
        "Tüm göstergeler güçlü alım yönünde hizalanıyor",
        "AI skoru çok güçlü (95)",
        "Yüksek model güveni (90%)",
        "Doğrulama puanı güçlü (85)",
        "Katalizör desteği mevcut (80)"
      ],
      "warnings": [],
      "positiveSignals": ["Güçlü doğrulama", "Güçlü katalizör desteği", "Düşük risk profili"],
      "negativeSignals": [],
      "overview": {
        "ratings": [
          { "dimension": "trend", "label": "Trend", "stars": 3, "starString": "★★★☆☆" },
          { "dimension": "risk", "label": "Risk", "stars": 4, "starString": "★★★★☆" }
        ],
        "totalStars": 27,
        "maxStars": 35
      }
    }
  ]
}
```

## Scanner Integration

Every scanner result now carries a `decision` object with Decision, Decision Confidence, Overview (star ratings), Reasons, Warnings, Positive/Negative Signals.

Scanner ranking order: **1) Decision → 2) AI Score → 3) Confidence**.

## Performance

- The engine performs **zero** provider requests and **zero** indicator calculations.
- It consumes only already-computed Score Engine outputs (from scanner results or the batch API), so there are no duplicated requests or duplicate calculations.
- `DecisionRegistry` is in-memory (`Map`), O(1) lookup per ticker.

## Files

- `apps/api/src/modules/decision/decision.types.ts`
- `apps/api/src/modules/decision/decision-rules.ts`
- `apps/api/src/modules/decision/decision-explanation.service.ts`
- `apps/api/src/modules/decision/decision-registry.service.ts`
- `apps/api/src/modules/decision/decision-engine.service.ts`
- `apps/api/src/modules/decision/decision.dto.ts`
- `apps/api/src/modules/decision/decision.controller.ts`
- `apps/api/src/modules/decision/decision.module.ts`
- `apps/api/src/modules/decision/decision.spec.ts`
