# R2-014 — AI Opportunity Center

## Overview

The AI Opportunity Center is the **presentation layer** of BIST ELITE AI. It is not a scoring engine and not another scanner — it combines every production engine into one unified Opportunity Hub.

It performs **zero** calculations. Every tab, every card, every score is **reused** from the existing production engines (Scanner, Strategy, Score, Decision, Opportunity, Verification, Catalyst). Identical inputs always produce identical outputs.

## Architecture

```
Scanner Engine
      │
      ▼
Strategy Engine
      │
      ▼
Score Engine
      │
      ▼
Decision Engine
      │
      ▼
Opportunity Engine  ──►  OpportunityRegistry (source of truth)
      │
      ▼
OpportunityCenterService.sync()
      │  (copies OpportunityResult → OpportunityCenterCard + entryArea: null)
      ▼
OpportunityCenterRegistry (card store + dedicated tomorrow registry)
      │
      ▼
OpportunityCenterController  (9 endpoints, Turkish)
      │
      ▼
        🔥 Bugünün Fırsatları   🟢 Yarın Artacaklar   ⭐ Elite Score
        📈 Haftalık   📊 Aylık   📅 3 Aylık   📆 6 Aylık
        💎 Top 10   🏆 Top 20   🚀 Momentum   💰 Değer Avcıları   🧠 Smart Money
```

## Data Flow

1. `ScannerEngine.runScan()` → `DecisionEngine` → `OpportunityEngine` → results stored in `OpportunityRegistry`.
2. `OpportunityCenterController` calls `OpportunityCenterService.sync()` before each response.
3. `sync()` maps each stored `OpportunityResult` into an `OpportunityCenterCard` (single source of truth: `toOpportunityCenterCard` in `opportunity-center.dto.ts`) and registers it in `OpportunityCenterRegistry`.
4. Tab endpoints derive their lists by **filtering and ranking the same card store** — no new scoring.

## Tabs

| Tab | Emoji | Source (reuse only) |
| --- | --- | --- |
| Bugünün Fırsatları | 🔥 | OpportunityRankingService.rank (Level → Score → Decision → AI Score → Confidence) |
| Yarın Artacaklar | 🟢 | Dedicated `tomorrow` sub-registry in OpportunityCenterRegistry — **no prediction**, night-analysis placeholder |
| Elite Score | ⭐ | 5 placeholder timeframes (Günlük/Haftalık/Aylık/3 Aylık/6 Aylık), score = `null` — **no calculation** |
| Haftalık | 📈 | Ranked card store (time-window bucketing is future architecture) |
| Aylık | 📊 | Ranked card store |
| 3 Aylık | 📅 | Ranked card store |
| 6 Aylık | 📆 | Ranked card store |
| Top 10 | 💎 | Ranked card store, `top(10)` |
| Top 20 | 🏆 | Ranked card store, `top(20)` |
| Momentum | 🚀 | Cards filtered by `strategyId === 'momentum'` (Momentum Strategy) |
| Değer Avcıları | 💰 | Cards filtered by `strategyId === 'value-hunter'` (Value Hunter Strategy) |
| Smart Money | 🧠 | Cards filtered by `strategyId === 'smart-money'` (Smart Money Strategy) |

## Opportunity Card

Every card contains the full production result:

- Ticker, Company
- AI Score, AI Confidence
- Decision, Decision Label, Decision Score, Decision Confidence
- Opportunity Level (`level`), Level Label, Level Emoji
- Opportunity Score, Opportunity Confidence (`confidence`)
- Strategy (id, name, score)
- Verification, Catalyst, Risk, Momentum, Trend, Liquidity, Quality, Technical, Fundamental
- `reasons[]`, `warnings[]`, `positiveSignals[]`, `negativeSignals[]`, `tags[]`
- `entryArea` — **placeholder** (`null`): Entry Zone, Support, Resistance, Stop, Target (all nullable, no calculation)
- `evaluatedAt`

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/opportunity-center` | Full hub — all 12 tab sections |
| `GET /api/opportunity-center/top10` | Top 10 opportunities |
| `GET /api/opportunity-center/top20` | Top 20 opportunities |
| `GET /api/opportunity-center/today` | Bugünün Fırsatları |
| `GET /api/opportunity-center/tomorrow` | Yarın Artacaklar (placeholder list) |
| `GET /api/opportunity-center/momentum` | Momentum strategy opportunities |
| `GET /api/opportunity-center/value` | Değer Avcıları opportunities |
| `GET /api/opportunity-center/smart-money` | Smart Money opportunities |
| `GET /api/opportunity-center/elite-score` | 5 Elite Score timeframes (placeholders) |

### Example response — `GET /api/opportunity-center` (excerpt)

```json
{
  "baslik": "AI Fırsat Merkezi",
  "olusturmaZamani": "2026-08-05T00:00:00.000Z",
  "toplamKart": 1,
  "sekmeler": [
    {
      "tabId": "BUGUNUN_FIRSATLARI",
      "baslik": "Bugünün Fırsatları",
      "emoji": "🔥",
      "aciklama": "Bugünün en yüksek skorlu fırsatları",
      "kartSayisi": 1,
      "kartlar": [
        {
          "ticker": "THYAO",
          "company": "Türk Hava Yolları",
          "aiScore": 95,
          "decision": "GÜÇLÜ_AL",
          "level": "ÇOK_GÜÇLÜ_FIRSAT",
          "levelLabel": "Çok Güçlü Fırsat",
          "levelEmoji": "🔥",
          "opportunityScore": 67,
          "confidence": 95,
          "strategyId": "momentum",
          "verification": 85,
          "catalyst": 80,
          "risk": 70,
          "momentum": 50,
          "trend": 50,
          "liquidity": 50,
          "quality": 50,
          "reasons": ["Çok güçlü fırsat tespit edildi — tüm göstergeler olumlu", "Karar: GÜÇLÜ AL"],
          "warnings": [],
          "positiveSignals": ["Güçlü doğrulama"],
          "negativeSignals": [],
          "tags": ["Düşük Risk"],
          "entryArea": null,
          "evaluatedAt": "2026-08-05T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

## Future Compatibility

Architecture is prepared for (not implemented):

- AI Fırsatlar feeds, Top 10 / Top 20 günlük
- Haftalık / Aylık fırsatlar (time-window bucketing on the card store)
- Yarın Güçlü Adaylar (tomorrow registry already exists, night-analysis ready)
- Elite Score (5 timeframe placeholders ready)
- Entry Zone / Exit Zone (entryArea placeholder ready)
- AI Portfolio, Prediction Engine

## Performance

- **ZERO** provider requests — the center never fetches data.
- **ZERO** indicator calculations — only `toOpportunityCenterCard` (spread + `entryArea: null`) and in-memory ranking/filtering.
- Reuses `OpportunityRegistry`, `OpportunityRankingService`, and the card store — O(n) tab derivations, O(1) per-ticker lookup.

## Files

- `apps/api/src/modules/opportunity-center/opportunity-center.types.ts`
- `apps/api/src/modules/opportunity-center/opportunity-center.registry.ts`
- `apps/api/src/modules/opportunity-center/opportunity-center.service.ts`
- `apps/api/src/modules/opportunity-center/opportunity-center.dto.ts`
- `apps/api/src/modules/opportunity-center/opportunity-center.controller.ts`
- `apps/api/src/modules/opportunity-center/opportunity-center.module.ts`
- `apps/api/src/modules/opportunity-center/opportunity-center.spec.ts`

## Modified

- `apps/api/src/app.module.ts` — `OpportunityCenterModule` registered after `AiOpportunityModule`.
