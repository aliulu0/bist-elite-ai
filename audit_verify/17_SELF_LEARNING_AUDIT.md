# BIST ELITE AI — SELF-LEARNING AUDIT

**Audit Date:** 2026-08-08  
**Auditor:** Principal AI Developer (R2-FINAL-AUDIT)

---

## SELF-LEARNING OVERVIEW

**Module:** `apps/api/src/modules/ai-early-opportunity/self-learning/`  
**Engine:** `SelfLearningEngine`  
**Service:** `SelfLearningService`  
**Registry:** `SelfLearningRegistry` (in-memory)

---

## LEARNING MECHANISM

### Core Algorithm: Confidence Modifier

```typescript
// SelfLearningEngine.calculateModifier()
1. Get cached prediction for ticker
2. Get backtest win rate: BacktestService.getReport(ticker, '1d', 'indicator')
3. Compare predicted direction vs actual (from market data)
4. Calculate accuracy = correct_predictions / total_predictions
5. Modifier = f(winRate, accuracy) → range [0.85, 1.15]
6. Store in SelfLearningRegistry
```

**Modifier Range:** 0.85 – 1.15  
**Application:** `finalScore = baseScore × modifier` in `EarlyOpportunityIntelligenceEngine.rankByAdjusted()`

---

## LEARNING CYCLE

**Trigger:** 
- Nightly scheduler job (`learning-cycle.job.ts` at 03:00)
- Every `GET /early-opportunities` call (optional, default true)

**Process:**
```typescript
async runLearningCycle():
  For each ticker with cached prediction:
    1. Get prediction from PredictionRegistry
    2. Get actual market outcome (price change)
    3. Get backtest win rate for 'indicator' strategy
    4. Calculate directional accuracy
    5. Compute modifier = lerp(0.85, 1.15, combinedScore)
    6. Registry.set(ticker, { modifier, accuracy, winRate, timestamp })
```

**Frequency:** Daily (nightly) + on-demand

---

## REGISTRY

**SelfLearningRegistry:** In-memory `Map<ticker, LearningEntry>`

| Field | Type |
|-------|------|
| `ticker` | string |
| `modifier` | number (0.85-1.15) |
| `accuracy` | number (0-1) |
| `winRate` | number (0-1) |
| `sampleCount` | number |
| `lastUpdated` | Date |

**Persistence:** **NONE** — Pure in-memory Map  
**Survives Restart:** **NO** — All modifiers lost on restart

---

## INTEGRATION POINTS

| Integration Point | How Used |
|-------------------|----------|
| **EarlyOpportunityIntelligenceService.getEarlyOpportunities()** | Calls `runLearningCycle()` then `rankByAdjusted(modifiers)` |
| **EarlyOpportunityIntelligenceService.getEarlyOpportunity()** | Reads modifiers for single ticker |
| **PortfolioIntelligenceService.getLearning()** | Exposes modifiers + accuracy metrics |
| **Dashboard Performance** | Shows learning progress, modifier count |

---

## BACKTEST INTEGRATION

**Win Rate Source:** `BacktestService.getReport(ticker, '1d', 'indicator')`

```typescript
const report = await this.backtestService.getReport(ticker, '1d', 'indicator');
const winRate = report?.result?.performance?.winRate ?? 0;
```

**Strategy:** 'indicator' (default technical strategy)  
**Timeframe:** '1d' (daily)  
**Metric:** `winRate` from `BacktestReportDto.result.performance.winRate`

---

## MODIFIER CALCULATION

**File:** `self-learning.engine.ts`

```typescript
calculateModifier(winRate: number, accuracy: number): number {
  // Combine win rate (backtest) and accuracy (live prediction)
  const combined = (winRate * 0.6) + (accuracy * 0.4);
  // Map to [0.85, 1.15]
  return 0.85 + (combined * 0.3);
}
```

**Range:** 0.85 (poor) → 1.15 (excellent)  
**Neutral:** 1.0 (at ~50% combined)

---

## NIGHTLY JOB

**File:** `apps/api/src/modules/scheduler/jobs/nightly-backtest.job.ts`

```typescript
@Cron('0 3 * * *') // 03:00 daily
async runNightlyLearningCycle() {
  await this.selfLearningService.runLearningCycle();
}
```

**Also Runs:** Backtest validation, portfolio snapshots, market data sync

---

## PERSISTENCE GAP

**Current:** In-memory Map only  
**Prisma Model:** None for learning modifiers  
**Survives Restart:** **NO**

**Impact:** 
- Modifiers reset to 1.0 on every restart
- Learning progress lost
- No audit trail of modifier history
- Cannot audit why modifier changed

**Required:** Prisma model `LearningModifier` with history table

---

## TESTS

| Test File | Tests | Status |
|-----------|-------|--------|
| `self-learning.engine.spec.ts` | 10 | ✅ PASS |
| `self-learning.service.spec.ts` | 9 | ✅ PASS |

**Total: 19 tests PASSING**

---

## GENUINE LEARNING vs STATIC RULES

| Aspect | Assessment |
|--------|------------|
| **Adaptive Weights** | ❌ No — Modifier only scales final score |
| **Feature Weights Learning** | ❌ No — Feature weights fixed in EarlyOpportunityEngine |
| **Strategy Selection** | ❌ No — Strategy fixed per engine |
| **Hyperparameter Optimization** | ❌ No — Backtest params fixed |
| **Directional Accuracy Learning** | ✅ Yes — Modifier based on win rate + accuracy |
| **Regime Adaptation** | ❌ No — No regime-specific modifiers |
| **Online Learning** | ❌ No — Batch nightly only |

**Verdict:** **STATIC RULES WITH DYNAMIC SCALING** — Not genuine ML learning. Single scalar modifier based on historical performance.

---

## EVIDENCE

- `apps/api/src/modules/ai-early-opportunity/self-learning/self-learning.engine.ts`
- `apps/api/src/modules/ai-early-opportunity/self-learning/self-learning.service.ts`
- `apps/api/src/modules/ai-early-opportunity/self-learning/self-learning.registry.ts`
- `apps/api/src/modules/ai-early-opportunity/self-learning/self-learning.engine.spec.ts`
- `apps/api/src/modules/scheduler/jobs/nightly-backtest.job.ts`
- `apps/api/src/modules/ai-early-opportunity/early-opportunity.intelligence.service.ts` (integration)

---

## CONCLUSION

**SELF-LEARNING: PARTIALLY IMPLEMENTED**

**✅ IMPLEMENTED:**
- Nightly learning cycle
- Modifier calculation (win rate + accuracy)
- Integration with Early Opportunity ranking
- Portfolio Intelligence learning exposure
- Nightly scheduler job

**❌ MISSING / LIMITED:**
- **NO DB PERSISTENCE** — Modifiers lost on restart (CRITICAL)
- **NOT TRUE ML** — Single scalar modifier, no feature learning
- **NO REGIME ADAPTATION** — Same modifier regardless of market regime
- **NO FEATURE WEIGHT LEARNING** — Engine weights fixed
- **NO HYPERPARAMETER OPTIMIZATION** — Backtest params static
- **NO AUDIT TRAIL** — Cannot trace why modifier changed
- **SAMPLE SIZE SMALL** — Daily data, limited history

**Verdict:** **STATIC RULES WITH DYNAMIC SCALING** — Not genuine self-learning. Better described as "Performance-Based Confidence Adjustment."

**Recommendation:** Add Prisma persistence for modifiers; implement regime-aware modifiers; consider bandit/RL for weight optimization.