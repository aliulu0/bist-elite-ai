import { Test, TestingModule } from '@nestjs/testing';
import { AiAnalysisPipeline } from './ai-analysis-pipeline.service';
import { TechnicalAnalysisHandler } from './modules/technical-analysis.handler';
import { FundamentalAnalysisHandler } from './modules/fundamental-analysis.handler';
import { FinancialHealthHandler } from './modules/financial-health.handler';
import { GrowthAnalysisHandler } from './modules/growth-analysis.handler';
import { MomentumAnalysisHandler } from './modules/momentum-analysis.handler';
import { RiskAnalysisHandler } from './modules/risk-analysis.handler';
import { LiquidityAnalysisHandler } from './modules/liquidity-analysis.handler';
import { VolatilityAnalysisHandler } from './modules/volatility-analysis.handler';
import { TrendAnalysisHandler } from './modules/trend-analysis.handler';
import { ValuationAnalysisHandler } from './modules/valuation-analysis.handler';
import { ScoreAggregator } from './score-aggregator.service';
import { ConfidenceCalculator } from './confidence-calculator.service';
import { SignalGenerator } from './signal-generator.service';
import { ExplanationBuilder } from './explanation-builder.service';
import { PipelineInput, AnalysisResult, AI_ANALYSIS_VERSION } from './ai-analysis.types';
import { AggregatedResult } from '../market-data/aggregation/aggregation.types';
import { Company } from '../market-data/interfaces/unified-domain.types';

function buildMockInput(overrides?: Partial<PipelineInput>): PipelineInput {
  const company: AggregatedResult<Company> = {
    data: {
      symbol: 'THYAO',
      name: 'Turkish Airlines',
      sector: 'Aviation',
      marketCap: 500000000,
      sharesOutstanding: 1000000000,
      currency: 'TRY',
      exchange: 'BIST',
      lastUpdated: new Date().toISOString(),
      source: 'fintables',
    },
    metadata: {
      providersQueried: ['fintables', 'finnhub'],
      providersUsed: ['fintables', 'finnhub'],
      providersFailed: [],
      providerConfidence: { fintables: 90, finnhub: 70 },
      qualityScore: 85,
      lastUpdated: new Date().toISOString(),
      cacheStatus: 'miss',
      aggregationDurationMs: 100,
      validationWarnings: [],
      conflictCount: 0,
      conflicts: [],
    },
  };

  return {
    company,
    ...overrides,
  };
}

describe('AiAnalysisPipeline', () => {
  let pipeline: AiAnalysisPipeline;
  let mockTechnicalHandler: jest.Mocked<TechnicalAnalysisHandler>;

  beforeEach(async () => {
    const mockHandler = (name: string) => ({
      name,
      weight: 1,
      enabled: true,
      analyze: jest.fn().mockResolvedValue({
        module: name,
        score: 70,
        confidence: 80,
        signals: [],
        strengths: [`${name} strength`],
        weaknesses: [],
        risks: [],
        warnings: [],
        metrics: { [`${name}Metric`]: 50 },
        explanation: `${name} analysis complete.`,
        metadata: {},
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAnalysisPipeline,
        { provide: TechnicalAnalysisHandler, useValue: mockHandler('technical') },
        { provide: FundamentalAnalysisHandler, useValue: mockHandler('fundamental') },
        { provide: FinancialHealthHandler, useValue: mockHandler('financialHealth') },
        { provide: GrowthAnalysisHandler, useValue: mockHandler('growth') },
        { provide: MomentumAnalysisHandler, useValue: mockHandler('momentum') },
        { provide: RiskAnalysisHandler, useValue: mockHandler('risk') },
        { provide: LiquidityAnalysisHandler, useValue: mockHandler('liquidity') },
        { provide: VolatilityAnalysisHandler, useValue: mockHandler('volatility') },
        { provide: TrendAnalysisHandler, useValue: mockHandler('trend') },
        { provide: ValuationAnalysisHandler, useValue: mockHandler('valuation') },
        ScoreAggregator,
        ConfidenceCalculator,
        SignalGenerator,
        ExplanationBuilder,
      ],
    }).compile();

    pipeline = module.get(AiAnalysisPipeline);
    mockTechnicalHandler = module.get(TechnicalAnalysisHandler) as jest.Mocked<TechnicalAnalysisHandler>;
  });

  describe('analyze', () => {
    it('should return a valid AnalysisResult', async () => {
      const result = await pipeline.analyze(buildMockInput());
      expect(result).toBeDefined();
      expect(result.symbol).toBe('THYAO');
      expect(result.version).toBe(AI_ANALYSIS_VERSION);
      expect(result.timestamp).toBeTruthy();
    });

    it('should have all required fields', async () => {
      const result = await pipeline.analyze(buildMockInput());
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('signal');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('weaknesses');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('supportingMetrics');
      expect(result).toHaveProperty('providerMetadata');
      expect(result).toHaveProperty('moduleResults');
    });

    it('should execute all enabled modules', async () => {
      const result = await pipeline.analyze(buildMockInput());
      expect(result.moduleResults.length).toBe(10);
    });

    it('should aggregate module scores into overall score', async () => {
      const result = await pipeline.analyze(buildMockInput());
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should produce a valid signal', async () => {
      const result = await pipeline.analyze(buildMockInput());
      const validSignals = ['STRONG_BUY', 'BUY', 'ACCUMULATE', 'NEUTRAL', 'REDUCE', 'SELL', 'STRONG_SELL'];
      expect(validSignals).toContain(result.signal);
    });

    it('should set recommendation equal to signal', async () => {
      const result = await pipeline.analyze(buildMockInput());
      expect(result.recommendation).toBe(result.signal);
    });

    it('should collect supporting metrics from all modules', async () => {
      const result = await pipeline.analyze(buildMockInput());
      expect(result.supportingMetrics.length).toBeGreaterThan(0);
    });

    it('should include providerMetadata', async () => {
      const result = await pipeline.analyze(buildMockInput());
      expect(result.providerMetadata).toBeDefined();
      expect(result.providerMetadata.qualityScore).toBe(85);
    });
  });

  describe('module failure handling', () => {
    it('should handle module failure gracefully', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiAnalysisPipeline,
          {
            provide: TechnicalAnalysisHandler,
            useValue: {
              name: 'technical',
              weight: 1,
              enabled: true,
              analyze: jest.fn().mockRejectedValue(new Error('Provider down')),
            },
          },
          {
            provide: FundamentalAnalysisHandler,
            useValue: {
              name: 'fundamental',
              weight: 1,
              enabled: true,
              analyze: jest.fn().mockResolvedValue({
                module: 'fundamental',
                score: 80,
                confidence: 90,
                signals: [],
                strengths: [],
                weaknesses: [],
                risks: [],
                warnings: [],
                metrics: {},
                explanation: '',
                metadata: {},
              }),
            },
          },
          { provide: FinancialHealthHandler, useValue: { name: 'financialHealth', weight: 1, enabled: true, analyze: jest.fn().mockResolvedValue({ module: 'financialHealth', score: 70, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} }) } },
          { provide: GrowthAnalysisHandler, useValue: { name: 'growth', weight: 1, enabled: true, analyze: jest.fn().mockResolvedValue({ module: 'growth', score: 70, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} }) } },
          { provide: MomentumAnalysisHandler, useValue: { name: 'momentum', weight: 1, enabled: true, analyze: jest.fn().mockResolvedValue({ module: 'momentum', score: 70, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} }) } },
          { provide: RiskAnalysisHandler, useValue: { name: 'risk', weight: 1, enabled: true, analyze: jest.fn().mockResolvedValue({ module: 'risk', score: 70, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} }) } },
          { provide: LiquidityAnalysisHandler, useValue: { name: 'liquidity', weight: 1, enabled: true, analyze: jest.fn().mockResolvedValue({ module: 'liquidity', score: 70, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} }) } },
          { provide: VolatilityAnalysisHandler, useValue: { name: 'volatility', weight: 1, enabled: true, analyze: jest.fn().mockResolvedValue({ module: 'volatility', score: 70, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} }) } },
          { provide: TrendAnalysisHandler, useValue: { name: 'trend', weight: 1, enabled: true, analyze: jest.fn().mockResolvedValue({ module: 'trend', score: 70, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} }) } },
          { provide: ValuationAnalysisHandler, useValue: { name: 'valuation', weight: 1, enabled: true, analyze: jest.fn().mockResolvedValue({ module: 'valuation', score: 70, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} }) } },
          ScoreAggregator,
          ConfidenceCalculator,
          SignalGenerator,
          ExplanationBuilder,
        ],
      }).compile();

      const failPipeline = module.get(AiAnalysisPipeline);
      const result = await failPipeline.analyze(buildMockInput());

      expect(result).toBeDefined();
      expect(result.symbol).toBe('THYAO');
      const failedModule = result.moduleResults.find((r) => r.module === 'technical');
      expect(failedModule).toBeDefined();
      expect(failedModule!.score).toBe(0);
      expect(failedModule!.metadata).toHaveProperty('failed', true);
    });

    it('should produce valid result even when all modules fail', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiAnalysisPipeline,
          { provide: TechnicalAnalysisHandler, useValue: { name: 'technical', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          { provide: FundamentalAnalysisHandler, useValue: { name: 'fundamental', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          { provide: FinancialHealthHandler, useValue: { name: 'financialHealth', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          { provide: GrowthAnalysisHandler, useValue: { name: 'growth', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          { provide: MomentumAnalysisHandler, useValue: { name: 'momentum', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          { provide: RiskAnalysisHandler, useValue: { name: 'risk', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          { provide: LiquidityAnalysisHandler, useValue: { name: 'liquidity', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          { provide: VolatilityAnalysisHandler, useValue: { name: 'volatility', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          { provide: TrendAnalysisHandler, useValue: { name: 'trend', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          { provide: ValuationAnalysisHandler, useValue: { name: 'valuation', weight: 1, enabled: true, analyze: jest.fn().mockRejectedValue(new Error('fail')) } },
          ScoreAggregator,
          ConfidenceCalculator,
          SignalGenerator,
          ExplanationBuilder,
        ],
      }).compile();

      const failPipeline = module.get(AiAnalysisPipeline);
      const result = await failPipeline.analyze(buildMockInput());
      expect(result.overallScore).toBe(0);
      expect(result.signal).toBe('STRONG_SELL');
      expect(result.moduleResults.length).toBe(10);
    });
  });

  describe('parallel execution', () => {
    it('should execute all modules concurrently', async () => {
      const analyzeOrder: string[] = [];
      const mockModule = (name: string) => ({
        name,
        weight: 1,
        enabled: true,
        analyze: jest.fn().mockImplementation(async () => {
          analyzeOrder.push(`${name}-start`);
          await new Promise((r) => setTimeout(r, 10));
          analyzeOrder.push(`${name}-end`);
          return {
            module: name,
            score: 70,
            confidence: 80,
            signals: [],
            strengths: [],
            weaknesses: [],
            risks: [],
            warnings: [],
            metrics: {},
            explanation: '',
            metadata: {},
          };
        }),
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiAnalysisPipeline,
          { provide: TechnicalAnalysisHandler, useValue: mockModule('technical') },
          { provide: FundamentalAnalysisHandler, useValue: mockModule('fundamental') },
          { provide: FinancialHealthHandler, useValue: mockModule('financialHealth') },
          { provide: GrowthAnalysisHandler, useValue: mockModule('growth') },
          { provide: MomentumAnalysisHandler, useValue: mockModule('momentum') },
          { provide: RiskAnalysisHandler, useValue: mockModule('risk') },
          { provide: LiquidityAnalysisHandler, useValue: mockModule('liquidity') },
          { provide: VolatilityAnalysisHandler, useValue: mockModule('volatility') },
          { provide: TrendAnalysisHandler, useValue: mockModule('trend') },
          { provide: ValuationAnalysisHandler, useValue: mockModule('valuation') },
          ScoreAggregator,
          ConfidenceCalculator,
          SignalGenerator,
          ExplanationBuilder,
        ],
      }).compile();

      const parallelPipeline = module.get(AiAnalysisPipeline);
      await parallelPipeline.analyze(buildMockInput());

      expect(analyzeOrder.length).toBe(20);
      const starts = analyzeOrder.filter((x) => x.endsWith('-start'));
      const ends = analyzeOrder.filter((x) => x.endsWith('-end'));
      expect(starts.length).toBe(10);
      expect(ends.length).toBe(10);
    });
  });
});
