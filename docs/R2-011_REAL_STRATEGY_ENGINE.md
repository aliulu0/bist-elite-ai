# R2-011: Real Strategy Engine

## Architecture

R2-011 converts all 9 placeholder scanner strategies into real, deterministic investment strategies. Each strategy evaluates an instrument's REAL data (historical prices, financials, indicators, verification, catalysts) against a set of clear rules and returns a 0-100 Strategy Score plus passed/failed rules, signals, reasons, and confidence.

```
Scanner
  ↓
EliteScannerEngine
  ↓
  ├─ ScannerRegistry (795 instruments, 643 active)
  ├─ StrategyRegistry (9 REAL deterministic strategies)
  │    └─ each implements evaluate(context) → StrategyEvaluation
  ├─ ScannerFilter (sector, assetType, activeOnly, limit)
  ├─ Context Enrichment (per instrument)
  │    ├─ MarketDataService.fetchData → historicalPrices (260d)
  │    ├─ MarketDataOrchestrator → financials (Company, Financials, BalanceSheet, Income, CashFlow)
  │    ├─ IndicatorEngine.calculateAll → indicators (19 families)
  │    ├─ VerificationRepository → verificationData
  │    └─ ResearchIntelligenceService → catalystData
  ├─ ScoreEngine (unchanged, AI score weights per strategy)
  └─ ScorePipeline (10-stage pipeline, unchanged)
        ↓
  EliteScannerResult (strategy score + rules + signals + all 13 AI scoring fields)
```

## Strategy Interface

```ts
interface EliteScannerStrategy {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  evaluate(context: EliteScannerContext): StrategyEvaluation;
}

interface StrategyEvaluation {
  score: number;            // 0-100 (passed rule ratio)
  passed: string[];         // passed rule names
  failedReasons: string[];  // failed rule names + reason
  signals: string[];        // actionable signals
  reasons: string[];        // full reason text
  confidence: number;       // 0-100 data completeness confidence
}
```

## Deterministic Engine

- **No GPT, no prediction, no randomness** — every rule is a pure function of real data.
- Strategies never compute the AI Score — that remains in the existing ScoreEngine.
- Each strategy returns `score`, `passed`, `failedReasons`, `signals`, `reasons`, `confidence` which the engine merges with ScoreEngine output into one `EliteScannerResult`.
- Base strategy engine (`BaseStrategyEngine`) computes score as `round(passed / totalRules * 100)` and confidence from data completeness (how many context buckets were populated).

## Context Enrichment (Real Data)

For each instrument, the engine loads real data once and reuses it for BOTH the strategy evaluation AND the ScoreEngine pipeline (single source of truth, zero duplication):

| Context bucket | Source | Notes |
|---|---|---|
| historicalPrices | `MarketDataService.fetchData(symbol, '1d', { limit: 260 })` | Cached via `MarketDataCacheService` key `historical` |
| financials | `MarketDataOrchestrator` (fetchCompany, fetchFinancials, fetchBalanceSheet, fetchIncomeStatement, fetchCashFlow) | Assembled into `FinancialSnapshot` |
| indicators | `IndicatorEngine.calculateAll(OHLCV, '1d')` | Mapped into `IndicatorSnapshot` (SMA_20/50/200, EMA_12/26, RSI, MACD, ADX, ATR, Bollinger, StochasticRSI, OBV, MFI, ROC) |
| verificationData | `VerificationRepository.getVerificationResult(ticker)` | Mapped into `VerificationSnapshot` |
| catalystData | `ResearchIntelligenceService.getCompanyResearch(ticker)` | Mapped into `CatalystSnapshot` from `bundle.catalysts` |

All enrichment failures are caught and degrade gracefully (missing bucket → strategy rules report unavailable data → lower confidence, never a crash).

## The 9 Real Strategies

All rules are deterministic thresholds over real data. Each strategy has 5-8 rules.

### 1. value-hunter — Değer Avcısı (8 rules, fundamental)
- P/E düşük (< 15), P/B düşük (< 1.5), ROE yüksek (> 15%), Borç/Özkaynak düşük (< 1.0), PEG düşük (< 1.5), EV/EBITDA düşük (< 10), Net marj pozitif (> 5%), Gelir büyümesi (> 5%)

### 2. smart-money — Akıllı Para (5 rules, money flow)
- OBV pozitif, MFI > 55, CMF > 0.05, Hacim artışı (ortalamanın 1.5x), Birikim (OBV + ROC pozitif)

### 3. momentum — Momentum (6 rules, trend)
- MACD pozitif (MACD > sinyal), RSI 50-75, ROC pozitif, ADX > 20, EMA12 > EMA26, Fiyat > SMA50

### 4. swing — Swing (5 rules, medium-term)
- EMA altın kesişim, ATR/fiyat %1-6, RSI 45-65, MACD histogram pozitif, Yukarı trend (SMA20+SMA50)

### 5. dip-collector — Dip Toplayıcı (5 rules, oversold)
- RSI < 35, Williams %R < -70, Bollinger alt banda yakın, 20 günlük destek bölgesi, Kontrollü düşüş (ROC > -15%)

### 6. minervini — Minervini (6 rules, stage analysis)
- Fiyat > 150 SMA, 150 SMA > 200 SMA, Fiyat > 200 SMA, 52 haftalık zirveye yakınlık (maks %25 uzaklık), Göreli güç (ROC pozitif), Kısa vadeli trend (SMA20)

### 7. canslim — CANSLIM (7 rules, growth)
- Cari kazanç pozitif, Yıllık kazanç büyümesi (ROE > 10%), Göreli güç (maks %30 zirve uzaklık), Kontrollü borçluluk (< 1.5), Liderlik (gelir büyümesi > 10%), Kurumsal ilgi (OBV pozitif), Piyasa yönü (SMA50)

### 8. william-oneil — William O'Neil (5 rules, breakout)
- EPS güçlü (net marj > 10%), Satış büyümesi (> 10%), Göreli güç yüksek (maks %20 zirve uzaklık), Breakout (SMA50 +%5), Hacim doğrulaması (1.4x)

### 9. qullamaggie — Qullamaggie (5 rules, contraction breakout)
- Volatilite daralması (Bollinger genişliği < 8%), Sıkışık aralık (20g < 15%), Düşük hacim (kuru dönem), Breakout (20g zirve), Hacim genişlemesi (1.3x)

## Filters (R2-011)

- `minStrategyScore` — minimum Strategy Score (0-100)
- `minAiScore` — minimum AI Score (existing)
- `minConfidence` — minimum AI Confidence (existing)
- `sector`, `assetType`, `activeOnly`, `limit` — existing

## API Endpoints

### GET /scanner/run
Runs all enabled strategies. Response items now include `strategyScore`, `strategyConfidence`, `passedRules`, `failedRules`, `signals`.

### GET /scanner/strategy/:strategy
Runs one strategy with the same enriched response.

### GET /scanner/top
Top results by AI Score DESC (unchanged).

### GET /scanner/filter
New query param: `minStrategyScore`. Filters by strategy score in addition to AI score/confidence.

## Response Example

```json
{
  "ticker": "THYAO",
  "company": "Türk Hava Yolları",
  "sector": "Ulaştırma",
  "strategyId": "value-hunter",
  "strategyName": "Değer Avcısı",
  "strategyScore": 87,
  "strategyConfidence": 60,
  "passedRules": ["P/E düşük", "ROE yüksek", "Borç/Özkaynak düşük", "PEG düşük", "EV/EBITDA düşük", "Net marj pozitif", "Gelir büyümesi"],
  "failedRules": ["P/B düşük: P/B 1.8 (eşik < 1.5)"],
  "signals": ["Düşük P/E: 8.0", "Yüksek ROE: 20.0%"],
  "aiScore": 76,
  "aiConfidence": 82,
  "technicalScore": 82,
  "fundamentalScore": 75,
  "reasons": ["P/E düşük: geçti", "P/B düşük: P/B 1.8 (eşik < 1.5)"],
  "scannedAt": "2025-01-15T10:30:00.000Z"
}
```

## Reused Production Services (unchanged)

- **ScoreEngine / ScorePipeline / ScoreCalculator** — AI score pipeline, untouched
- **ScoreRegistry / STRATEGY_WEIGHT_PROFILES** — weight profiles, untouched
- **MarketDataOrchestrator / MarketDataService / MarketDataCacheService** — data loading
- **IndicatorEngine** (19 indicators) — technical calculations
- **VerificationRepository** — verification data
- **ResearchIntelligenceService** — catalyst data
- **ScannerRegistry / ScannerFilter** — instrument selection and filtering

## New Files

- `apps/api/src/modules/scanner/strategy-utils.ts` — deterministic helpers (SMA, EMA, RSI, MACD, ROC, ATR, Bollinger, Williams %R, OBV, MFI, CMF, ADX, 52-week high/low, PEG, EV/EBITDA, TechnicalContext builder, relative strength, verification/catalyst helpers)

## Modified Files

- `apps/api/src/modules/scanner/strategy-registry.service.ts` — 9 REAL deterministic strategies (`evaluate()`), `StrategyRegistry` provider
- `apps/api/src/modules/scanner/elite-scanner.types.ts` — `StrategyEvaluation`, enriched `EliteScannerContext`, strategy scoring fields in result, `evaluate()` interface (v1.1.0)
- `apps/api/src/modules/scanner/elite-scanner-engine.service.ts` — context enrichment + strategy evaluation + AI score merge + 3-level sort
- `apps/api/src/modules/scanner/scanner.service.ts` — `minStrategyScore` filter support
- `apps/api/src/modules/scanner/scanner.controller.ts` — `minStrategyScore` query param + strategy scoring fields in DTO mapping
- `apps/api/src/modules/scanner/dto/scanner-response.dto.ts` — strategyScore, strategyConfidence, passedRules, failedRules, signals fields
- `apps/api/src/modules/scanner/dto/scanner-query.dto.ts` — minStrategyScore query param
- `apps/api/src/modules/scanner/scanner.module.ts` — imports IndicatorsModule, ResearchModule
- `apps/api/src/modules/scanner/__tests__/elite-scanner.spec.ts` — deterministic per-strategy tests

## Verification

- Build: GREEN
- Tests: 42 GREEN in elite-scanner.spec.ts (per-strategy deterministic tests for all 9 strategies)
- Full scanner suite: 131 GREEN across 3 spec files
- Each strategy tested for: expected pass/fail on synthetic up/down/flat data, deterministic output on identical input, graceful failure without data
- AI Score pipeline untouched — strategies only contribute Strategy Score, rules, signals, reasons
- 23 pre-existing failures in unrelated suites (cache, compression, performance-validator, scheduler, provider-health-monitor, market-data.controller, error-handling) remain — not introduced by this sprint
