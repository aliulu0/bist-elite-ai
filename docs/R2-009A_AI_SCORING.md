# R2-009A AI Scoring Foundation

## Architecture

The AI Scoring Foundation is a universal, deterministic scoring engine built in `apps/api/src/modules/scoring/`. Every scanner strategy obtains its score from ONE engine — `ScoreEngine`. Strategies never calculate scores internally; they only define weight profiles.

### Core Principle

**Single scoring engine, strategy-specific weights.**

```
Raw Data
  ↓
Technical Score
  ↓
Fundamental Score
  ↓
Verification Score
  ↓
Catalyst Score
  ↓
Liquidity Score
  ↓
Risk Score
  ↓
Volume Score
  ↓
Momentum Score
  ↓
Trend Score
  ↓
Quality Score
  ↓
Weighted Score (AI Score)
  ↓
AI Confidence
```

### Components

| Component | Path | Responsibility |
|-----------|------|---------------|
| `ScoreEngine` | `score-engine.service.ts` | Single engine used by all strategies. Orchestrates pipeline + registry. |
| `ScorePipeline` | `score-pipeline.service.ts` | Runs all 10 scoring stages, computes weighted AI Score and AI Confidence. |
| `ScoreCalculator` | `score-calculator.service.ts` | Deterministic formulas for each dimension (technical, fundamental, verification, catalyst, liquidity, risk, volume, momentum, trend, quality). |
| `ScoreRegistry` | `score-registry.service.ts` | Registry of strategy weight profiles. Supports unlimited strategies. |
| `ScoreWeights` | `score-weights.ts` | Default + per-strategy weight profiles (Value Hunter, Momentum, Smart Money, etc.). |
| `scoring-types.ts` | `scoring-types.ts` | All type definitions (ScoreResult, ScorePipelineInput, AIScoreResult, etc.). |
| `score.dto.ts` | `score.dto.ts` | DTOs for scoring API responses. |

## Pipeline Formula

### Weighted Score (AI Score)

```
AI Score = Σ(score_i × weight_i) / Σ(weight_i)
```

Where:
- `score_i` = score for dimension i (0-100, null if data unavailable)
- `weight_i` = weight for dimension i from the strategy's weight profile
- Only non-null scores are included in the calculation

### AI Confidence

```
AI Confidence = (availableDimensions / totalDimensions) × freshnessFactor × coverageFactor × (1 - conflictPenalty)
```

Where:
- `availableDimensions` = count of non-null sub-scores
- `totalDimensions` = 10
- `freshnessFactor` = based on data recency (currently 1.0)
- `coverageFactor` = based on provider data coverage (currently 1.0)
- `conflictPenalty` = 0.1 if conflicting evidence detected

### Score Ranges

All scores are 0-100:
- **0** = worst possible
- **50** = neutral/baseline
- **100** = best possible

## Strategy Weight Profiles

Each strategy defines its own weight profile. Strategies only define weights — no business logic.

### Value Hunter
- Fundamental: 40
- Risk: 20
- Verification: 15
- Catalyst: 10
- Technical: 10
- Quality: 10
- Others: 5 or 0

### Momentum
- Momentum: 35
- Trend: 30
- Risk: 15
- Verification: 10
- Catalyst: 10
- Others: 5 or 0

### All 9 Strategies
1. Value Hunter (Değer Avcısı)
2. Smart Money (Akıllı Para)
3. Momentum
4. Swing
5. Dip Collector (Dip Toplayıcı)
6. Minervini
7. CANSLIM
8. William O'Neil
9. Qullamaggie

## Turkish UI Labels

| English | Turkish |
|---------|---------|
| Technical Score | Teknik Puan |
| Fundamental Score | Temel Puan |
| Verification Score | Doğrulama Puanı |
| Catalyst Score | Katalizör Puanı |
| Liquidity Score | Likidite Puanı |
| Risk Score | Risk Puanı |
| Volume Score | Hacim Puanı |
| Momentum Score | Momentum Puanı |
| Trend Score | Trend Puanı |
| Quality Score | Kalite Puanı |
| AI Score | Yapay Zeka Puanı |
| AI Confidence | Yapay Zeka Güveni |
| Weighted Score | Ağırlıklı Skor |

## Integration with Scanner

The `ScoreEngine` integrates with the Elite Scanner infrastructure:
- `ScannerResult` (from R2-009) is extended with AI scoring fields
- `ScoreEngine.score()` takes a `ScoreEngineInput` (ticker + strategyId + pipeline data)
- `ScoreEngine.scoreBatch()` scores multiple stocks asynchronously
- Pipeline data (historical prices, financials, verification, catalysts) is fetched from existing infrastructure (Verification Engine, Catalyst Engine, Research Repository)

## Future ML Integration

The architecture is designed for future ML integration:
1. **ScoreEngine** remains the single entry point
2. **ScoreCalculator** formulas can be replaced with ML models without changing the pipeline
3. **ScoreRegistry** weight profiles can be learned by ML instead of hand-crafted
4. **AI Confidence** can be enhanced with ML-derived uncertainty estimates
5. New dimensions can be added to the pipeline without breaking existing strategies

## Known Issues

- YahooUnifiedAdapter returns `marketCap: 0` and `sector: 'Unknown'` for BIST instruments
- Historical price data requires historical data endpoint (not yet integrated into scoring pipeline)
- Financial statement data requires financials endpoint (not yet integrated)
- Verification and Catalyst data require Research Repository integration (wired but not populated in placeholder)
- AI Confidence freshness/coverage factors are currently hardcoded to 1.0

## Next Recommended Sprint

R2-009B — Integrate real data sources into the scoring pipeline:
1. Connect HistoricalDataModule for historical prices → Technical, Momentum, Trend scores
2. Connect AggregationModule for financial statements → Fundamental, Quality scores
3. Connect VerificationEngine for verification evidence → Verification Score
4. Connect CatalystDetectionService for catalysts → Catalyst Score
5. Enhance AI Confidence with real data freshness and provider coverage metrics