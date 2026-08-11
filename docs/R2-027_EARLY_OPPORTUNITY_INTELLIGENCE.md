# R2-027 — Early Opportunity Intelligence Engine (CORE)

> "Detect opportunities BEFORE the market."

The **Early Opportunity Intelligence Engine** is the **core intelligence layer** of the
BIST ELITE AI platform. It does **not** introduce a new scoring system; it reuses the
existing **`EarlyOpportunityEngine`** (R2-026) score and layers on:

- **Full early-opportunity intelligence output** (entry zone, stop, targets, holding period,
  catalyst, smart money, verification, research consensus, elite score, prediction).
- **Deterministic Turkish explanations** of *why* a stock was selected.
- A **filter system** over every required dimension.
- A **self-learning cycle** that reuses the **Backtest Engine** to compare predictions vs.
  real market performance and adjusts confidence / improves ranking.

## Architecture

```
EarlyOpportunityIntelligenceService  (CORE orchestrator)
   ├── EarlyOpportunityService          (R2-026 — scans ALL BIST symbols)
   │     ├── PredictionService          (cache-only reuse)
   │     ├── AIResearchHubService       (cached consensus)
   │     ├── EliteScoreRegistry / OpportunityRegistry / DecisionRegistry (read-only reuse)
   │     └── EarlyOpportunityEngine     (pure 0-100 scorer)
   ├── EarlyOpportunityIntelligenceEngine (pure — full output + filters + explain)
   ├── SelfLearningService              (nightly calibration)
   │     ├── PredictionRegistry         (cached predictions)
   │     ├── SelfLearningEngine         (pure modifier math)
   │     └── SelfLearningRegistry       (modifier store)
   └── MarketDataOrchestrator          (best-effort market-cap enrichment)
```

All engines are **reused**, never duplicated. Predictions are computed **once** and cached;
the scan consumes cache-only longer timeframes (no re-computation).

## Reuse map

| Required input | Engine reused | How |
|---|---|---|
| Prediction | Prediction Engine | `PredictionService.getPrediction(ticker,'1d')` (cache-first, compute-once) |
| Multi-timeframe | Prediction Engine | `PredictionRegistry.get(ticker, tf)` — cache-only peek |
| Smart Money | Smart Money Engine | via `PredictionResult.smartMoneyScore` |
| Catalyst | Catalyst Engine | via `PredictionResult.catalystScore` |
| Verification | Verification AI | via `PredictionResult.verification` |
| Research consensus | AI Research Hub | `AIResearchHubService.getConsensus(ticker)` (cache-first) |
| Elite Score | Elite Score Engine | `EliteScoreRegistry.get(ticker)?.result` |
| Decision | Decision Engine | `DecisionRegistry.get(ticker)?.result` |
| Opportunity | Opportunity Engine | `OpportunityRegistry.get(ticker)?.result` |
| Entry zone / stop / targets | Entry Zone Engine | via `PredictionResult` |
| Backtest accuracy | Backtest Engine | via `PredictionResult.backtestAccuracy` (zero re-run) |
| Market structure / indicators / trend / momentum / risk / liquidity | Market Structure / Indicator / Prediction Engines | via `PredictionResult` |
| Market cap | Market Data Orchestrator | `fetchCompany(ticker)` (best-effort, cached) |

## Early Opportunity Score (carried from R2-026)

0–100, deterministic. Components (weighted):

- bullish probability ×0.30
- confidence ×0.15  ← **confidence directly affects the score**
- risk-adjusted return ×0.12 (gated by confidence)
- smart money ×0.10
- research consensus ×0.08
- elite score ×0.08
- backtest win-rate ×0.05
- catalyst ×0.04
- decision ×0.03
- opportunity ×0.02
- timeframe agreement ×0.03
- verification bonus/penalty ±1

**Multi-timeframe weighting:** `1d=0.35, 1w=0.25, 1m=0.20, 3m=0.10, 6m=0.10`.

## Levels

| Score | Level |
|---|---|
| ≥ 80 | ÇOK_GÜÇLÜ_FIRSAT |
| ≥ 70 | GÜÇLÜ_FIRSAT |
| ≥ 60 | FIRSAT |
| ≥ 45 | İZLEME_LISTESI |
| < 45 | BEKLE |

## Self-learning

Every cycle, `SelfLearningService.runLearningCycle()`:

1. Reads all cached predictions from `PredictionRegistry.getAll()`.
2. For each valid prediction with a valid backtest (`totalTrades ≥ 3`), compares
   `predictedBullish` vs the Backtest Engine's `winRate` (realized market performance) and
   computes a confidence **modifier** in `[0.85, 1.15]`.
3. Stores the modifier in `SelfLearningRegistry`.
4. `IntelligenceService` ranks results by `earlyOpportunityScore × modifier` — **improving
   ranking without introducing a new score**.

This reuses the Backtest Engine (its `winRate`), introduces **zero** new scoring and **zero**
duplicated logic. Fully deterministic and network-free (cache-only).

## Output (top 10)

`GET /early-opportunities` returns the top 10 early opportunities, each containing:
Early Opportunity Score, Elite Score, Prediction (bullish %, confidence, expected return),
Risk, Entry Zone, Stop, Target 1, Target 2, Holding Period, Catalyst, Smart Money,
Verification Status, Research Consensus, and deterministic Turkish `reasons`.

## Filters

`GET /early-opportunities` supports query filters:
`minEarlyOpportunityScore`, `minConfidence`, `minExpectedReturn`, `maxRisk`, `sector`,
`marketCap[min/max]`, `liquidity`, `minSmartMoneyScore`, `minCatalystScore`, `minEliteScore`.

## Testing

100% deterministic, no randomness. **68 unit tests** in `ai-early-opportunity/`
(engine, intelligence engine, service, self-learning engine, self-learning service).
All green.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/early-opportunities` | Top 10 early opportunities (supports filters) |
| GET | `/early-opportunities/:ticker` | Single ticker intelligence |
| GET | `/early-opportunities/explain/:ticker` | Deterministic Turkish explanation |
| GET | `/early-opportunities/learning/run` | Run self-learning cycle |
