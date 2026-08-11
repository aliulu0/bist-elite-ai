# R2-019 Portfolio Optimization Engine

## Architecture

The Portfolio Optimization Engine follows the existing engine pattern used by AnalystEngine, EliteScoreEngine, DecisionEngine, and OpportunityEngine.

### Components

| Component | File | Purpose |
|-----------|------|---------|
| PortfolioOptimizationEngine | `portfolio-optimization.engine.ts` | Core optimization logic |
| PortfolioOptimizationService | `portfolio-optimization.service.ts` | Service layer with data aggregation |
| PortfolioOptimizationRegistry | `portfolio-optimization.registry.ts` | In-memory registry for caching results |
| PortfolioOptimizationController | `portfolio-optimization.controller.ts` | REST API controller |
| PortfolioOptimizationModule | `portfolio-optimization.module.ts` | NestJS module wiring |
| PortfolioOptimizationDTO | `portfolio-optimization.dto.ts` | Data transfer objects |
| PortfolioOptimizationTypes | `portfolio-optimization.types.ts` | Type definitions |

### Reused Production Engines

The Portfolio Optimization Engine reuses the following production engines without duplication:

- **AnalystEngine** - For analyst analysis and explanations
- **DecisionEngine** - For investment decisions (BUY/HOLD/SELL)
- **OpportunityEngine** - For opportunity level and scoring
- **EliteScoreEngine** - For elite score calculations
- **TomorrowEngine** - For tomorrow opportunity predictions
- **VerificationEngine** - For verification and evidence checking
- **CatalystEngine** - For catalyst detection and analysis
- **IndicatorEngine** - For technical indicator calculations
- **SymbolRegistryService** - For symbol lookup and validation
- **MarketDataCacheService** - For caching market data

### Optimization Rules

#### Portfolio Score Calculation
- Weighted average of: Analyst Elite Score (40%), Decision Score (30%), Opportunity Score (30%)
- Range: 0-100
- Higher scores indicate stronger portfolio candidates

#### Risk Score Calculation
- Weighted average of: Opportunity Risk, Analyst Risk Analysis, Elite Score inverse
- Range: 0-100
- Lower scores indicate lower risk

#### Diversification Score Calculation
- Based on: Tag diversity, sector distribution, strength count
- Range: 0-100
- Higher scores indicate better diversification

#### Expected Return Calculation
- Based on: Opportunity momentum, analyst momentum analysis, decision confidence
- Range: 0-100

#### Expected Risk Calculation
- Based on: Opportunity risk, analyst risk analysis, elite score inverse
- Range: 0-100

#### Volatility Calculation
- Based on: ATR (Average True Range), opportunity momentum
- Range: 5-100

#### Maximum Drawdown Estimate
- Based on: Opportunity risk, ATR
- Range: 5-80

#### Sharpe Estimate
- Formula: (Expected Return - 5) / Expected Risk
- Range: -10 to 10

#### Beta Estimate
- Based on: Relative Volume, opportunity momentum
- Range: 0.1 - 3.0

#### Position Weight Calculation
- Formula: (PortfolioScore * 0.4 + DiversificationScore * 0.3 + (100 - RiskScore) * 0.3)
- Max weight: 25% per position
- Min weight: 1% per position

#### Cash Ratio Calculation
- Base: 20%
- Adjustments based on: Risk level, decision type, verification conflicts
- Range: 5-60%

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/portfolio/optimize/:ticker` | Get portfolio optimization for a ticker |
| GET | `/portfolio/top` | Get top portfolio optimization results |
| POST | `/portfolio/optimize` | Calculate portfolio optimization |

### Output Structure

```typescript
interface PortfolioOptimizationResult {
  ticker: string;
  company: string | null;
  portfolioScore: number;
  riskScore: number;
  diversificationScore: number;
  sectorDistribution: SectorAllocation[];
  expectedReturn: number;
  expectedRisk: number;
  volatility: number;
  maxDrawdownEstimate: number;
  sharpeEstimate: number;
  betaEstimate: number;
  correlationMatrix: Record<string, number>;
  positionWeights: PositionWeight[];
  suggestedAllocation: Record<string, number>;
  cashRatio: number;
  sectorLimits: Record<string, number>;
  aiComment: string;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
  recommendedActions: string[];
  evaluatedAt: string;
}
```

### Localization

All user-visible text is in Turkish. Indicator names (RSI, MACD, EMA, etc.) remain in English.

### Performance

- Reuses existing registries for caching
- Reuses existing indicator calculations via IndicatorEngine
- Never calculates indicators twice
- Never requests provider data twice
- Results are cached in PortfolioOptimizationRegistry