# 08. REGISTRIES

## 8.1 Pattern

Every engine-backed module owns a `*Registry` service that stores computed results in an in-memory `Map` with a uniform surface:

```ts
class XRegistry {
  private store = new Map<string, XResult>();
  set(id, value): XRegistry        // upsert
  get(id): XResult | undefined
  getAll(): XResult[]               // spread of values
  has(id): boolean
  count(): number
  clear(): void
  top(n?): XResult[]                // sorted desc by score
}
```

## 8.2 Inventory of registries

| Registry | Module | Value type | Notes |
|---|---|---|---|
| `ScannerRegistry` | scanner | ScannerResult | overview/all |
| `StrategyRegistry` | scanner | strategy results | 9 strategies |
| `DecisionRegistry` | decision | DecisionResult | 26 specs |
| `OpportunityRegistry` | ai-opportunity | OpportunityResult | |
| `OpportunityCenterRegistry` | opportunity-center | aggregated | |
| `EliteScoreRegistry` | ai-elite-score | EliteScoreResult | |
| `TomorrowRegistry` | tomorrow | TomorrowResult | |
| `AnalystRegistry` | analyst | AnalystResult | 47 specs |
| `EntryRegistry` | entry | EntryResult | |
| `PortfolioOptimizationRegistry` | portfolio-optimization | OptimizationResult | 24 specs |
| `ScoreRegistry` | scoring | ScoreResult | |
| `TCMBDecisionStore` | macro | macro decisions | |

## 8.3 Quality observations

1. **Consistency is high** — the set/get/getAll/has/count/clear/top surface is repeated across all 12+ registries with identical semantics; tests cover each.
2. **No TTL/expiry on registries** — entries live until `clear()` or process restart. For long-running scheduler processes this means stale results accumulate unless a job clears them.
3. **`top()` convention varies** — some registries sort desc on a `score` field, others accept a comparator; minor, but a shared base would remove drift.
4. **No global registry** — each module keeps its own; cross-module reads (portfolio-optimization reading analyst/decision registries) are done via the other module's public service methods, not shared storage.
5. **All in-memory** — results are lost on restart unless the persistence module (F11-005) is invoked; see `07_DATA_STORES.md`.

## 8.4 Verdict

Registry pattern is a clean, well-tested convention. Concerns are operational (volatility, no TTL) rather than structural.
