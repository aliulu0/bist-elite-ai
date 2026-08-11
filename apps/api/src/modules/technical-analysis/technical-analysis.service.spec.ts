import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalAnalysisService } from './technical-analysis.service';
import { MarketDataService } from '../market-data/market-data.service';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { MarketStructureEngine } from '../market-structure/market-structure.engine';
import { SmartMoneyEngine } from '../smart-money/smart-money.engine';
import { TechnicalRulesEngine } from '../technical-rules/technical-rules.engine';
import { TechnicalScoreEngine } from '../technical-score/technical-score.engine';
import { TechnicalSummaryGenerator } from '../technical-summary/technical-summary.generator';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { Timeframe } from '../indicators/indicator.types';

const mockOHLCV: MarketDataPoint[] = [
  { symbol: 'THYAO', timeframe: '1d' as Timeframe, open: 95, high: 97, low: 94, close: 96, volume: 1000000, timestamp: '2025-01-10', validationStatus: 'valid' },
  { symbol: 'THYAO', timeframe: '1d' as Timeframe, open: 96, high: 98, low: 95, close: 97, volume: 1100000, timestamp: '2025-01-11', validationStatus: 'valid' },
  { symbol: 'THYAO', timeframe: '1d' as Timeframe, open: 97, high: 99, low: 96, close: 98, volume: 1200000, timestamp: '2025-01-12', validationStatus: 'valid' },
];

const mockIndicators = [
  { indicator: 'RSI', timeframe: '1d' as Timeframe, timestamp: '2025-01-12', value: 55, metadata: {}, isValid: true },
  { indicator: 'MACD', timeframe: '1d' as Timeframe, timestamp: '2025-01-12', value: { macd: 0.5, signal: 0.3, histogram: 0.2 }, metadata: {}, isValid: true },
];

const mockMarketStructure = {
  timeframe: '1d' as Timeframe,
  trend: 'uptrend' as const,
  structure: [],
  swingHighs: [],
  swingLows: [],
  supportZones: [],
  resistanceZones: [],
  breakOfStructure: [],
  changeOfCharacter: [],
  metadata: {},
  isValid: true,
};

const mockSmartMoney = {
  timeframe: '1d' as Timeframe,
  accumulationScore: 0.7,
  distributionScore: 0.3,
  institutionalActivity: 'accumulating' as const,
  smartMoneyConfidence: 0.65,
  trendAlignment: 'uptrend' as const,
  signals: [],
  metadata: {},
  isValid: true,
};

const mockTechnicalRules = {
  timeframe: '1d' as Timeframe,
  rules: [
    { rule: 'EMA_ALIGNMENT', category: 'trend' as const, status: 'PASS' as const, description: 'Bullish', value: null, metadata: {} },
    { rule: 'RSI', category: 'momentum' as const, status: 'WARNING' as const, description: 'High', value: 72, metadata: {} },
  ],
  isValid: true,
};

const mockTechnicalScore = {
  timeframe: '1d' as Timeframe,
  score: 65,
  grade: 'B' as const,
  confidence: 0.75,
  ruleBreakdown: [],
  metadata: {},
  isValid: true,
};

const mockTechnicalSummary = {
  timeframe: '1d' as Timeframe,
  summary: 'Technical grade: B (65/100).',
  overallOpinion: 'Neutral-to-bullish.',
  strengths: ['EMA bullish'],
  weaknesses: ['RSI high'],
  risks: [],
  recommendations: ['Wait for confirmation'],
  metadata: {},
  isValid: true,
};

describe('TechnicalAnalysisService', () => {
  let service: TechnicalAnalysisService;

  const mockMarketDataService = {
    fetchData: jest.fn().mockResolvedValue(mockOHLCV),
  };

  const mockIndicatorEngine = {
    calculateAll: jest.fn().mockReturnValue(mockIndicators),
  };

  const mockMarketStructureEngine = {
    analyze: jest.fn().mockReturnValue(mockMarketStructure),
  };

  const mockSmartMoneyEngine = {
    evaluate: jest.fn().mockReturnValue(mockSmartMoney),
  };

  const mockTechnicalRulesEngine = {
    evaluate: jest.fn().mockReturnValue(mockTechnicalRules),
  };

  const mockTechnicalScoreEngine = {
    calculate: jest.fn().mockReturnValue(mockTechnicalScore),
  };

  const mockTechnicalSummaryGenerator = {
    generate: jest.fn().mockReturnValue(mockTechnicalSummary),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicalAnalysisService,
        { provide: MarketDataService, useValue: mockMarketDataService },
        { provide: IndicatorEngine, useValue: mockIndicatorEngine },
        { provide: MarketStructureEngine, useValue: mockMarketStructureEngine },
        { provide: SmartMoneyEngine, useValue: mockSmartMoneyEngine },
        { provide: TechnicalRulesEngine, useValue: mockTechnicalRulesEngine },
        { provide: TechnicalScoreEngine, useValue: mockTechnicalScoreEngine },
        { provide: TechnicalSummaryGenerator, useValue: mockTechnicalSummaryGenerator },
      ],
    }).compile();

    service = module.get(TechnicalAnalysisService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyze', () => {
    it('should return full pipeline result', async () => {
      const result = await service.analyze('THYAO', '1d');
      expect(result.symbol).toBe('THYAO');
      expect(result.timeframe).toBe('1d');
      expect(result.indicatorSummary).toEqual(mockIndicators);
      expect(result.marketStructure).toEqual(mockMarketStructure);
      expect(result.smartMoney).toEqual(mockSmartMoney);
      expect(result.technicalRules).toEqual(mockTechnicalRules);
      expect(result.technicalScore).toEqual(mockTechnicalScore);
      expect(result.technicalSummary).toEqual(mockTechnicalSummary);
    });

    it('should uppercase symbol', async () => {
      await service.analyze('thyao', '1d');
      expect(mockMarketDataService.fetchData).toHaveBeenCalledWith('THYAO', '1d');
    });

    it('should trim symbol', async () => {
      await service.analyze('  THYAO  ', '1d');
      expect(mockMarketDataService.fetchData).toHaveBeenCalledWith('THYAO', '1d');
    });

    it('should call MarketDataService.fetchData with correct args', async () => {
      await service.analyze('THYAO', '1w');
      expect(mockMarketDataService.fetchData).toHaveBeenCalledWith('THYAO', '1w');
    });

    it('should convert MarketDataPoint to OHLCV for indicator engine', async () => {
      await service.analyze('THYAO', '1d');
      expect(mockIndicatorEngine.calculateAll).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ open: 95, high: 97, low: 94, close: 96, volume: 1000000 }),
        ]),
        '1d',
      );
    });

    it('should pass OHLCV to market structure engine', async () => {
      await service.analyze('THYAO', '1d');
      expect(mockMarketStructureEngine.analyze).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ open: 95 })]),
        '1d',
      );
    });

    it('should pass indicators and structure to smart money engine', async () => {
      await service.analyze('THYAO', '1d');
      expect(mockSmartMoneyEngine.evaluate).toHaveBeenCalledWith(
        mockIndicators,
        mockMarketStructure,
        '1d',
      );
    });

    it('should pass all results to technical rules engine', async () => {
      await service.analyze('THYAO', '1d');
      expect(mockTechnicalRulesEngine.evaluate).toHaveBeenCalledWith(
        mockIndicators,
        mockMarketStructure,
        mockSmartMoney,
        '1d',
      );
    });

    it('should pass rules to technical score engine', async () => {
      await service.analyze('THYAO', '1d');
      expect(mockTechnicalScoreEngine.calculate).toHaveBeenCalledWith(
        mockTechnicalRules.rules,
        '1d',
      );
    });

    it('should pass score and rules to summary generator', async () => {
      await service.analyze('THYAO', '1d');
      expect(mockTechnicalSummaryGenerator.generate).toHaveBeenCalledWith(
        mockTechnicalScore,
        mockTechnicalRules.rules,
        '1d',
      );
    });

    it('should support all timeframes', async () => {
      for (const tf of ['4h', '1d', '1w', '1m', '3m', '6m'] as const) {
        await service.analyze('THYAO', tf);
        expect(mockMarketDataService.fetchData).toHaveBeenCalledWith('THYAO', tf);
      }
    });
  });

  describe('empty data', () => {
    it('should return empty result when no data', async () => {
      mockMarketDataService.fetchData.mockResolvedValueOnce([]);
      const result = await service.analyze('INVALID', '1d');
      expect(result.symbol).toBe('INVALID');
      expect(result.indicatorSummary).toEqual([]);
      expect(result.marketStructure.isValid).toBe(false);
      expect(result.smartMoney.isValid).toBe(false);
      expect(result.technicalRules.isValid).toBe(false);
      expect(result.technicalScore.isValid).toBe(false);
      expect(result.technicalSummary.isValid).toBe(false);
    });

    it('should not call any engines when no data', async () => {
      mockMarketDataService.fetchData.mockResolvedValueOnce([]);
      await service.analyze('INVALID', '1d');
      expect(mockIndicatorEngine.calculateAll).not.toHaveBeenCalled();
      expect(mockMarketStructureEngine.analyze).not.toHaveBeenCalled();
      expect(mockSmartMoneyEngine.evaluate).not.toHaveBeenCalled();
      expect(mockTechnicalRulesEngine.evaluate).not.toHaveBeenCalled();
      expect(mockTechnicalScoreEngine.calculate).not.toHaveBeenCalled();
      expect(mockTechnicalSummaryGenerator.generate).not.toHaveBeenCalled();
    });
  });
});
