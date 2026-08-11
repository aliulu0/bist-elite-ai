import { ScoreCalculator } from '../score-calculator.service';
import { ScorePipeline } from '../score-pipeline.service';
import { ScoreEngine } from '../score-engine.service';
import { ScoreRegistry } from '../score-registry.service';
import {
  ScorePipelineInput,
  ScoreWeights,
  HistoricalPricePoint,
  FinancialSnapshot,
  VerificationSnapshot,
  CatalystSnapshot,
  IndicatorSnapshot,
} from '../scoring-types';
import {
  DEFAULT_SCORE_WEIGHTS,
  VALUE_HUNTER_WEIGHTS,
  MOMENTUM_WEIGHTS,
} from '../score-weights';

describe('ScoreCalculator', () => {
  let calculator: ScoreCalculator;

  beforeEach(() => {
    calculator = new ScoreCalculator();
  });

  describe('calculateTechnical', () => {
    it('should return null when no historical prices', () => {
      const input: ScorePipelineInput = { ticker: 'THYAO', company: 'THY', sector: null, price: 300, volume: 1000000, marketCap: 1000, provider: 'yahoo', lastUpdate: '2025-01-15' };
      const result = calculator.calculateTechnical(input);
      expect(result.score).toBeNull();
      expect(result.dimension).toBe('technical');
    });

    it('should calculate score from historical prices', () => {
      const prices: HistoricalPricePoint[] = Array.from({ length: 60 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        close: 100 + i * 0.5,
        volume: 100000,
      }));
      const input: ScorePipelineInput = { ticker: 'THYAO', company: 'THY', sector: null, price: 130, volume: 1000000, marketCap: 1000, provider: 'yahoo', lastUpdate: '2025-02-01', historicalPrices: prices };
      const result = calculator.calculateTechnical(input);
      expect(result.score).not.toBeNull();
      expect(result.score!).toBeGreaterThanOrEqual(0);
      expect(result.score!).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateFundamental', () => {
    it('should return null when no financials', () => {
      const input: ScorePipelineInput = { ticker: 'THYAO', company: 'THY', sector: null, price: 300, volume: 1000000, marketCap: 1000, provider: 'yahoo', lastUpdate: '2025-01-15' };
      const result = calculator.calculateFundamental(input);
      expect(result.score).toBeNull();
    });

    it('should calculate score from financials', () => {
      const financials: FinancialSnapshot = { peRatio: 15, pbRatio: 2, debtToEquity: 0.3, revenueGrowth: 0.12, netMargin: 0.15, roe: 0.18, dividendYield: 0.02, revenue: 1000000000, netIncome: 100000000, totalAssets: 5000000000, totalDebt: 1000000000, ebitda: 200000000, freeCashFlow: 150000000 };
      const input: ScorePipelineInput = { ticker: 'THYAO', company: 'THY', sector: null, price: 300, volume: 1000000, marketCap: 1000, provider: 'yahoo', lastUpdate: '2025-01-15', financials };
      const result = calculator.calculateFundamental(input);
      expect(result.score).not.toBeNull();
      expect(result.score!).toBeGreaterThanOrEqual(0);
      expect(result.score!).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateVerification', () => {
    it('should return null when no verification data', () => {
      const input: ScorePipelineInput = { ticker: 'THYAO', company: 'THY', sector: null, price: 300, volume: 1000000, marketCap: 1000, provider: 'yahoo', lastUpdate: '2025-01-15' };
      const result = calculator.calculateVerification(input);
      expect(result.score).toBeNull();
    });

    it('should calculate score from verification data', () => {
      const verification: VerificationSnapshot = { sourceCount: 5, verifiedCount: 4, likelyCount: 1, confidence: 0.85, evidenceCount: 4 };
      const input: ScorePipelineInput = { ticker: 'THYAO', company: 'THY', sector: null, price: 300, volume: 1000000, marketCap: 1000, provider: 'yahoo', lastUpdate: '2025-01-15', verificationData: verification };
      const result = calculator.calculateVerification(input);
      expect(result.score).not.toBeNull();
      expect(result.score!).toBeGreaterThanOrEqual(0);
      expect(result.score!).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateCatalyst', () => {
    it('should return 0 when no catalysts found', () => {
      const catalyst: CatalystSnapshot = { count: 0, bullishCount: 0, bearishCount: 0, neutralCount: 0, strongestType: null, strongestDirection: null };
      const input: ScorePipelineInput = { ticker: 'THYAO', company: 'THY', sector: null, price: 300, volume: 1000000, marketCap: 1000, provider: 'yahoo', lastUpdate: '2025-01-15', catalystData: catalyst };
      const result = calculator.calculateCatalyst(input);
      expect(result.score).toBe(0);
    });

    it('should calculate score from catalyst data', () => {
      const catalyst: CatalystSnapshot = { count: 3, bullishCount: 2, bearishCount: 0, neutralCount: 1, strongestType: 'new_investment', strongestDirection: 'Bullish' };
      const input: ScorePipelineInput = { ticker: 'THYAO', company: 'THY', sector: null, price: 300, volume: 1000000, marketCap: 1000, provider: 'yahoo', lastUpdate: '2025-01-15', catalystData: catalyst };
      const result = calculator.calculateCatalyst(input);
      expect(result.score).not.toBeNull();
      expect(result.score!).toBeGreaterThan(0);
    });
  });

  describe('calculateAll', () => {
    it('should return all null scores when no data', () => {
      const input: ScorePipelineInput = { ticker: 'THYAO', company: 'THY', sector: null, price: null, volume: null, marketCap: null, provider: 'yahoo', lastUpdate: null };
      const results = calculator.calculateAll(input);
      expect(results).toHaveLength(10);
      expect(results.every((r: { score: number | null }) => r.score === null)).toBe(true);
    });
  });
});

describe('ScorePipeline', () => {
  let pipeline: ScorePipeline;
  let calculator: ScoreCalculator;

  beforeEach(() => {
    calculator = new ScoreCalculator();
    pipeline = new ScorePipeline(calculator);
  });

  it('should run pipeline and produce AI result', async () => {
    const financials: FinancialSnapshot = { peRatio: 15, pbRatio: 2, debtToEquity: 0.3, revenueGrowth: 0.12, netMargin: 0.15, roe: 0.18, dividendYield: 0.02, revenue: 1000000000, netIncome: 100000000, totalAssets: 5000000000, totalDebt: 1000000000, ebitda: 200000000, freeCashFlow: 150000000 };
    const verification: VerificationSnapshot = { sourceCount: 5, verifiedCount: 4, likelyCount: 1, confidence: 0.85, evidenceCount: 4 };
    const catalyst: CatalystSnapshot = { count: 3, bullishCount: 2, bearishCount: 0, neutralCount: 1, strongestType: 'new_investment', strongestDirection: 'Bullish' };
    const prices: HistoricalPricePoint[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      close: 100 + i * 0.5,
      volume: 100000,
    }));

    const input: ScorePipelineInput = {
      ticker: 'THYAO',
      company: 'TÃ¼rk Hava YollarÄ±',
      sector: 'UlaÅŸtÄ±rma',
      price: 300,
      volume: 1000000,
      marketCap: 400000000000,
      provider: 'yahoo',
      lastUpdate: '2025-01-15T00:00:00.000Z',
      historicalPrices: prices,
      financials,
      verificationData: verification,
      catalystData: catalyst,
    };

    const output = await pipeline.run(input, DEFAULT_SCORE_WEIGHTS);
    expect(output.scores).toHaveLength(10);
    expect(output.aiResult.aiScore).not.toBeNull();
    expect(output.aiResult.aiConfidence).not.toBeNull();
    expect(output.aiResult.weightedScore).not.toBeNull();
    expect(output.aiResult.availableDimensionCount).toBeGreaterThan(0);
    expect(output.aiResult.totalDimensions).toBe(10);
  });

  it('should handle missing data gracefully', async () => {
    const input: ScorePipelineInput = {
      ticker: 'THYAO',
      company: 'TÃ¼rk Hava YollarÄ±',
      sector: null,
      price: null,
      volume: null,
      marketCap: null,
      provider: 'yahoo',
      lastUpdate: null,
    };

    const output = await pipeline.run(input, DEFAULT_SCORE_WEIGHTS);
    expect(output.scores).toHaveLength(10);
    expect(output.aiResult.aiScore).toBeNull();
    expect(output.aiResult.aiConfidence).toBe(0);
  });
});

describe('ScoreEngine', () => {
  let engine: ScoreEngine;
  let registry: ScoreRegistry;

  beforeEach(() => {
    registry = new ScoreRegistry();
    const calculator = new ScoreCalculator();
    const pipeline = new ScorePipeline(calculator);
    engine = new ScoreEngine(pipeline, registry);
  });

  it('should list all strategy weight profiles', () => {
    const profiles = engine.listStrategies();
    expect(profiles.length).toBeGreaterThanOrEqual(9);
    expect(profiles.some((p: { strategyId: string }) => p.strategyId === 'value-hunter')).toBe(true);
    expect(profiles.some((p: { strategyId: string }) => p.strategyId === 'momentum')).toBe(true);
  });

  it('should get weight profile for a strategy', () => {
    const profile = engine.getWeightProfile('value-hunter');
    expect(profile).not.toBeNull();
    expect(profile!.strategyId).toBe('value-hunter');
    expect(profile!.weights.fundamental).toBe(40);
  });

  it('should throw for unknown strategy', async () => {
    const input = {
      ticker: 'THYAO',
      strategyId: 'unknown-strategy',
      pipelineInput: { ticker: 'THYAO', company: 'THY', sector: null, price: 300, volume: 1000000, marketCap: 1000, provider: 'yahoo', lastUpdate: '2025-01-15' },
    };
    await expect(engine.score(input)).rejects.toThrow();
  });

  it('should score a stock with full data', async () => {
    const financials: FinancialSnapshot = { peRatio: 15, pbRatio: 2, debtToEquity: 0.3, revenueGrowth: 0.12, netMargin: 0.15, roe: 0.18, dividendYield: 0.02, revenue: 1000000000, netIncome: 100000000, totalAssets: 5000000000, totalDebt: 1000000000, ebitda: 200000000, freeCashFlow: 150000000 };
    const verification: VerificationSnapshot = { sourceCount: 5, verifiedCount: 4, likelyCount: 1, confidence: 0.85, evidenceCount: 4 };
    const catalyst: CatalystSnapshot = { count: 3, bullishCount: 2, bearishCount: 0, neutralCount: 1, strongestType: 'new_investment', strongestDirection: 'Bullish' };
    const prices: HistoricalPricePoint[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      close: 100 + i * 0.5,
      volume: 100000,
    }));

    const input = {
      ticker: 'THYAO',
      strategyId: 'value-hunter',
      pipelineInput: {
        ticker: 'THYAO',
        company: 'TÃ¼rk Hava YollarÄ±',
        sector: 'UlaÅŸtÄ±rma',
        price: 300,
        volume: 1000000,
        marketCap: 400000000000,
        provider: 'yahoo',
        lastUpdate: '2025-01-15T00:00:00.000Z',
        historicalPrices: prices,
        financials,
        verificationData: verification,
        catalystData: catalyst,
      },
    };

    const output = await engine.score(input);
    expect(output.ticker).toBe('THYAO');
    expect(output.strategyId).toBe('value-hunter');
    expect(output.pipeline.aiResult.aiScore).not.toBeNull();
    expect(output.pipeline.aiResult.aiConfidence).not.toBeNull();
    expect(output.pipeline.aiResult.weightedScore).not.toBeNull();
    expect(output.pipeline.pipelineDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('should produce different scores for different weight profiles', async () => {
    const financials: FinancialSnapshot = { peRatio: 15, pbRatio: 2, debtToEquity: 0.3, revenueGrowth: 0.12, netMargin: 0.15, roe: 0.18, dividendYield: 0.02, revenue: 1000000000, netIncome: 100000000, totalAssets: 5000000000, totalDebt: 1000000000, ebitda: 200000000, freeCashFlow: 150000000 };
    const verification: VerificationSnapshot = { sourceCount: 5, verifiedCount: 4, likelyCount: 1, confidence: 0.85, evidenceCount: 4 };
    const catalyst: CatalystSnapshot = { count: 3, bullishCount: 2, bearishCount: 0, neutralCount: 1, strongestType: 'new_investment', strongestDirection: 'Bullish' };
    const prices: HistoricalPricePoint[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      close: 100 + i * 0.5,
      volume: 100000,
    }));

    const baseInput = {
      ticker: 'THYAO',
      strategyId: 'value-hunter',
      pipelineInput: {
        ticker: 'THYAO',
        company: 'TÃ¼rk Hava YollarÄ±',
        sector: 'UlaÅŸtÄ±rma',
        price: 300,
        volume: 1000000,
        marketCap: 400000000000,
        provider: 'yahoo',
        lastUpdate: '2025-01-15T00:00:00.000Z',
        historicalPrices: prices,
        financials,
        verificationData: verification,
        catalystData: catalyst,
      },
    };

    const valueHunterOutput = await engine.score({ ...baseInput, strategyId: 'value-hunter' });
    const momentumOutput = await engine.score({ ...baseInput, strategyId: 'momentum' });

    expect(valueHunterOutput.pipeline.aiResult.aiScore).not.toBeNull();
    expect(momentumOutput.pipeline.aiResult.aiScore).not.toBeNull();
    // Different weights should produce different scores
    expect(valueHunterOutput.pipeline.aiResult.aiScore).not.toEqual(momentumOutput.pipeline.aiResult.aiScore);
  });
});

describe('ScoreRegistry', () => {
  let registry: ScoreRegistry;

  beforeEach(() => {
    registry = new ScoreRegistry();
  });

  it('should have all 9 strategy profiles', () => {
    const profiles = registry.listWeightProfiles();
    expect(profiles.length).toBe(9);
  });

  it('should have correct weights for Value Hunter', () => {
    const profile = registry.getWeightProfile('value-hunter');
    expect(profile).not.toBeNull();
    expect(profile!.weights.fundamental).toBe(40);
    expect(profile!.weights.technical).toBe(10);
    expect(profile!.weights.risk).toBe(20);
  });

  it('should have correct weights for Momentum', () => {
    const profile = registry.getWeightProfile('momentum');
    expect(profile).not.toBeNull();
    expect(profile!.weights.momentum).toBe(35);
    expect(profile!.weights.trend).toBe(30);
    expect(profile!.weights.fundamental).toBe(5);
  });

  it('should support registering custom profiles', () => {
    const customWeights: ScoreWeights = {
      technical: 50, fundamental: 50, verification: 0, catalyst: 0,
      liquidity: 0, risk: 0, volume: 0, momentum: 0, trend: 0, quality: 0,
    };
    registry.register({ strategyId: 'custom', strategyName: 'Ã–zel', weights: customWeights });
    const profile = registry.getWeightProfile('custom');
    expect(profile).not.toBeNull();
    expect(profile!.weights.technical).toBe(50);
  });

  it('should return null for unknown strategy', () => {
    expect(registry.getWeightProfile('nonexistent')).toBeNull();
  });
});
