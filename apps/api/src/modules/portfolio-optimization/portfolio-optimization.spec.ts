import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioOptimizationEngine } from './portfolio-optimization.engine';
import { PortfolioOptimizationRegistry } from './portfolio-optimization.registry';
import { PortfolioOptimizationService } from './portfolio-optimization.service';
import { PortfolioOptimizationController } from './portfolio-optimization.controller';

describe('PortfolioOptimizationEngine', () => {
  let engine: PortfolioOptimizationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortfolioOptimizationEngine],
    }).compile();

    engine = module.get<PortfolioOptimizationEngine>(PortfolioOptimizationEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should calculate portfolio score', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result).toBeDefined();
    expect(result.ticker).toBe('THYAO');
    expect(result.company).toBe('Türk Hava Yolları');
    expect(result.portfolioScore).toBeGreaterThanOrEqual(0);
    expect(result.portfolioScore).toBeLessThanOrEqual(100);
  });

  it('should calculate risk score', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });

  it('should calculate diversification score', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.diversificationScore).toBeGreaterThanOrEqual(0);
    expect(result.diversificationScore).toBeLessThanOrEqual(100);
  });

  it('should calculate expected return', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.expectedReturn).toBeGreaterThanOrEqual(0);
    expect(result.expectedReturn).toBeLessThanOrEqual(100);
  });

  it('should calculate expected risk', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.expectedRisk).toBeGreaterThanOrEqual(0);
    expect(result.expectedRisk).toBeLessThanOrEqual(100);
  });

  it('should calculate volatility', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.volatility).toBeGreaterThanOrEqual(0);
    expect(result.volatility).toBeLessThanOrEqual(100);
  });

  it('should calculate max drawdown estimate', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.maxDrawdownEstimate).toBeGreaterThanOrEqual(0);
    expect(result.maxDrawdownEstimate).toBeLessThanOrEqual(100);
  });

  it('should calculate Sharpe estimate', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(typeof result.sharpeEstimate).toBe('number');
  });

  it('should calculate beta estimate', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.betaEstimate).toBeGreaterThanOrEqual(0);
  });

  it('should calculate position weights', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.positionWeights).toBeDefined();
    expect(Array.isArray(result.positionWeights)).toBe(true);
  });

  it('should generate AI comment', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.aiComment).toBeDefined();
    expect(typeof result.aiComment).toBe('string');
  });

  it('should return warnings array', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('should return strengths array', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.strengths).toBeDefined();
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it('should return weaknesses array', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.weaknesses).toBeDefined();
    expect(Array.isArray(result.weaknesses)).toBe(true);
  });

  it('should return recommended actions array', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.recommendedActions).toBeDefined();
    expect(Array.isArray(result.recommendedActions)).toBe(true);
  });

  it('should return evaluatedAt timestamp', () => {
    const input = {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      analystResult: null,
      decisionResult: null,
      opportunityResult: null,
      eliteScoreResult: null,
      tomorrowResult: null,
      verificationResult: null,
      catalysts: [],
      indicators: [],
      sector: null,
    };

    const result = engine.optimize(input);

    expect(result.evaluatedAt).toBeDefined();
    expect(typeof result.evaluatedAt).toBe('string');
  });
});

describe('PortfolioOptimizationRegistry', () => {
  let registry: PortfolioOptimizationRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortfolioOptimizationRegistry],
    }).compile();

    registry = module.get<PortfolioOptimizationRegistry>(PortfolioOptimizationRegistry);
  });

  it('should be defined', () => {
    expect(registry).toBeDefined();
  });

  it('should set and get entries', () => {
    const entry = {
      ticker: 'THYAO',
      input: {},
      result: { portfolioScore: 85 } as any,
      evaluatedAt: new Date().toISOString(),
    };

    registry.set(entry);
    const retrieved = registry.get('THYAO');

    expect(retrieved).toBeDefined();
    expect(retrieved!.ticker).toBe('THYAO');
  });

  it('should return null for missing ticker', () => {
    const retrieved = registry.get('NONEXISTENT');
    expect(retrieved).toBeNull();
  });

  it('should return all entries', () => {
    registry.set({
      ticker: 'THYAO',
      input: {},
      result: { portfolioScore: 85 } as any,
      evaluatedAt: new Date().toISOString(),
    });

    registry.set({
      ticker: 'GARAN',
      input: {},
      result: { portfolioScore: 72 } as any,
      evaluatedAt: new Date().toISOString(),
    });

    const all = registry.getAll();
    expect(all.length).toBe(2);
  });

  it('should return count', () => {
    registry.clear();
    registry.set({
      ticker: 'THYAO',
      input: {},
      result: { portfolioScore: 85 } as any,
      evaluatedAt: new Date().toISOString(),
    });

    expect(registry.count()).toBe(1);
  });

  it('should clear all entries', () => {
    registry.clear();
    expect(registry.count()).toBe(0);
  });
});

describe('PortfolioOptimizationController', () => {
  let controller: PortfolioOptimizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioOptimizationController],
      providers: [
        PortfolioOptimizationEngine,
        PortfolioOptimizationRegistry,
        {
          provide: PortfolioOptimizationService,
          useValue: {
            optimize: jest.fn().mockResolvedValue(null),
            getByTicker: jest.fn().mockResolvedValue(null),
            top: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<PortfolioOptimizationController>(PortfolioOptimizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});