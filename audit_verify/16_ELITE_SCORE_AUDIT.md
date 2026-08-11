# BIST ELITE AI — ELITE SCORE AUDIT

**Audit Date:** 2026-08-08  
**Auditor:** Principal AI Developer (R2-FINAL-AUDIT)

---

## ELITE SCORE OVERVIEW

**Module:** `apps/api/src/modules/elite-score/` + `apps/api/src/common/elite-score/`  
**Engine:** `EliteScoreEngine`  
**Registry:** `EliteScoreRegistry`  
**Controller:** `EliteScoreController`

---

## FORMULA

**Elite Score = Weighted Composite of 3 Pillars**

| Pillar | Weight | Components |
|--------|--------|------------|
| **Technical** | 40% | Momentum, Trend, Volatility, Volume, Support/Resistance, Pattern |
| **Financial** | 30% | Growth, Profitability, Valuation, Quality, Health |
| **Confidence** | 30% | Data Quality, Model Consistency, Regime Stability, Historical Match |

**Sector Adjustment:** Applied post-composite — normalizes scores within sector

**Normalization:** All sub-scores normalized to 0-100, then weighted sum

---

## DETAILED COMPONENT BREAKDOWN

### 1. TECHNICAL (40%)

| Sub-Component | Weight in Technical | Source |
|---------------|---------------------|--------|
| Momentum | 20% | RSI, MACD, Rate of Change, Stochastic |
| Trend | 20% | MA alignment, ADX, Supertrend, Ichimoku |
| Volatility | 15% | ATR, Bollinger Width, Historical Vol |
| Volume | 15% | OBV, VWAP, Volume Profile, MFI |
| Support/Resistance | 15% | Pivot points, Fibonacci, Market Structure |
| Pattern | 15% | Candlestick, Chart patterns, Harmonics |

**Score Calculation:** Each sub-component 0-100 → Weighted average → 0-100

### 2. FINANCIAL (30%)

| Sub-Component | Weight in Financial | Source |
|---------------|---------------------|--------|
| Growth | 25% | Revenue/Net Income YoY, EPS growth |
| Profitability | 25% | ROE, ROA, ROIC, Margins |
| Valuation | 20% | P/E, P/B, EV/EBITDA, P/FCF vs sector |
| Quality | 15% | Accruals, Piotroski F-Score, Beneish M-Score |
| Health | 15% | Debt/Equity, Current Ratio, Interest Coverage, Altman Z |

**Data Source:** `FinancialStatement`, `FinancialRatio` (Prisma) — **Requires Fintables/Alpha Vantage API keys**

### 3. CONFIDENCE (30%)

| Sub-Component | Weight in Confidence | Source |
|---------------|---------------------|--------|
| Data Quality | 30% | Provider count, freshness, completeness |
| Model Consistency | 30% | Agreement across timeframes/models |
| Regime Stability | 20% | Market Regime engine (low volatility = higher) |
| Historical Match | 20% | Backtest win rate, prediction accuracy |

---

## SECTOR ADJUSTMENT

**Algorithm:**
1. Compute raw composite for all symbols
2. Group by sector
3. Calculate sector mean and std dev
4. Normalize: `adjusted = 50 + (raw - sectorMean) / sectorStd * 15`
5. Clamp to 0-100

**Purpose:** Fair comparison across sectors with different characteristics

---

## OUTPUT: EliteScoreResult

| Field | Type | Description |
|-------|------|-------------|
| `technical` | 0-100 | Technical pillar score |
| `financial` | 0-100 | Financial pillar score |
| `confidence` | 0-100 | Confidence pillar score |
| `composite` | 0-100 | Final weighted score |
| `rank` | int | Rank within universe |
| `positiveFactors` | string[] | Top contributing factors |
| `negativeFactors` | string[] | Top detracting factors |
| `reasoning` | string | Turkish explanation |
| `regime` | MarketRegimeType | Current market regime |

---

## DATA DEPENDENCIES

| Pillar | Data Required | Available Without API Keys? |
|--------|---------------|----------------------------|
| Technical | Price/Volume history | ✅ YES (Yahoo Finance) |
| Financial | Financial statements, ratios | ❌ NO (needs Fintables/Alpha Vantage) |
| Confidence | Provider metadata, backtest | ⚠️ PARTIAL (needs backtest history) |

**Critical:** **Financial pillar UNUSABLE without Fintables/Alpha Vantage keys**

---

## REGISTRY & CACHING

**EliteScoreRegistry:** In-memory `Map<symbol, EliteScoreResult>`  
**Cache:** `CacheService` namespace `elite-score`, TTL configurable  
**Persistence:** **NONE** — In-memory only, lost on restart

**Update Trigger:** Nightly scheduler job + manual refresh endpoint

---

## API ENDPOINTS

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/elite-score/:ticker` | Single ticker elite score |
| GET | `/api/elite-score/:ticker/explain` | Turkish explanation |

---

## INTEGRATION POINTS

| Consumer | Usage |
|----------|-------|
| **EarlyOpportunityService** | Reads from `EliteScoreRegistry` for scoring |
| **EarlyOpportunityIntelligenceEngine** | Includes in intelligence bundle |
| **Dashboard Top 10** | Displays elite score per card |
| **Dashboard Top Lists** | "Elite Score" leaderboard |
| **Portfolio Intelligence** | Position elite scores, portfolio breakdown |

---

## TESTS

| Test File | Tests | Status |
|-----------|-------|--------|
| `elite-score.engine.spec.ts` | Unknown | ✅ Part of early-opportunity suite |

**Total:** Included in 68 early-opportunity tests (PASSING)

---

## DOUBLE COUNTING CHECK

| Component | Used in Elite Score? | Used Separately in Early Opportunity? | Double Count Risk |
|-----------|---------------------|--------------------------------------|-------------------|
| Technical Indicators | ✅ (40%) | ✅ (via Prediction) | ⚠️ YES |
| Financials | ✅ (30%) | ❌ Not directly | LOW |
| Smart Money | ❌ | ✅ (separate) | NONE |
| Catalyst | ❌ | ✅ (separate) | NONE |
| Verification | ❌ | ✅ (separate) | NONE |
| Backtest Win Rate | ❌ (in Confidence) | ✅ (in Early Opp) | ⚠️ PARTIAL |

**Mitigation:** Early Opportunity weights are independent; Elite Score is one component among 13.

---

## EVIDENCE

- `apps/api/src/modules/elite-score/elite-score.engine.ts`
- `apps/api/src/modules/elite-score/elite-score.registry.ts`
- `apps/api/src/common/elite-score/elite-score.engine.ts`
- `apps/api/src/modules/ai-early-opportunity/early-opportunity.engine.ts` (consumes)
- `apps/api/src/modules/ai-early-opportunity/early-opportunity.service.ts` (consumes)

---

## CONCLUSION

**ELITE SCORE: IMPLEMENTED** — 3-pillar formula, sector adjustment, Turkish explanations, registry, caching, API endpoints.

**CAVEATS:**
1. **Financial Pillar Unusable** — No Fintables/Alpha Vantage keys → 30% of score based on defaults/fallbacks
2. **No DB Persistence** — Registry lost on restart
3. **Technical Double Count** — Technical indicators used in both Elite Score (40%) and Prediction (via Early Opportunity)
3. **No Model Versioning** — Cannot track formula changes over time

**Recommendation:** Obtain financial data API keys; add DB persistence for registry; consider deduping technical component.