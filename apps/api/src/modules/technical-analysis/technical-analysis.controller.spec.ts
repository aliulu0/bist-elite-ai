import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TechnicalAnalysisController } from './technical-analysis.controller';
import { TechnicalAnalysisService } from './technical-analysis.service';
import { TechnicalAnalysisInputDto } from './dto';

const mockAnalysisResult = {
  symbol: 'THYAO',
  timeframe: '1d',
  indicatorSummary: [
    { indicator: 'RSI', timeframe: '1d', timestamp: '2025-01-12', value: 55, metadata: {}, isValid: true },
  ],
  marketStructure: {
    timeframe: '1d',
    trend: 'uptrend',
    structure: [],
    swingHighs: [],
    swingLows: [],
    supportZones: [],
    resistanceZones: [],
    breakOfStructure: [],
    changeOfCharacter: [],
    metadata: {},
    isValid: true,
  },
  smartMoney: {
    timeframe: '1d',
    accumulationScore: 0.7,
    distributionScore: 0.3,
    institutionalActivity: 'accumulating',
    smartMoneyConfidence: 0.65,
    trendAlignment: 'uptrend',
    signals: [],
    metadata: {},
    isValid: true,
  },
  technicalRules: {
    timeframe: '1d',
    rules: [
      { rule: 'EMA_ALIGNMENT', category: 'trend', status: 'PASS', description: 'Bullish', value: null, metadata: {} },
    ],
    isValid: true,
  },
  technicalScore: {
    timeframe: '1d',
    score: 72,
    grade: 'B',
    confidence: 0.85,
    ruleBreakdown: [],
    metadata: {},
    isValid: true,
  },
  technicalSummary: {
    timeframe: '1d',
    summary: 'Technical grade: B (72/100).',
    overallOpinion: 'Neutral-to-bullish.',
    strengths: ['EMA bullish'],
    weaknesses: [],
    risks: [],
    recommendations: ['Wait for confirmation'],
    metadata: {},
    isValid: true,
  },
};

const mockService = {
  analyze: jest.fn().mockResolvedValue(mockAnalysisResult),
};

describe('TechnicalAnalysisController', () => {
  let controller: TechnicalAnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TechnicalAnalysisController],
      providers: [
        { provide: TechnicalAnalysisService, useValue: mockService },
      ],
    }).compile();

    controller = module.get(TechnicalAnalysisController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('analyze', () => {
    it('should return analysis for valid symbol', async () => {
      const result = await controller.analyze('THYAO', {});
      expect(result.symbol).toBe('THYAO');
      expect(result.timeframe).toBe('1d');
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('should pass symbol and timeframe to service', async () => {
      await controller.analyze('THYAO', { timeframe: '1w' });
      expect(mockService.analyze).toHaveBeenCalledWith('THYAO', '1w');
    });

    it('should default to 1d timeframe', async () => {
      await controller.analyze('THYAO', {});
      expect(mockService.analyze).toHaveBeenCalledWith('THYAO', '1d');
    });

    it('should uppercase symbol', async () => {
      await controller.analyze('thyao', {});
      expect(mockService.analyze).toHaveBeenCalledWith('THYAO', '1d');
    });

    it('should trim symbol', async () => {
      await controller.analyze('  THYAO  ', {});
      expect(mockService.analyze).toHaveBeenCalledWith('THYAO', '1d');
    });

    it('should throw BadRequestException for empty symbol', async () => {
      await expect(controller.analyze('', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace symbol', async () => {
      await expect(controller.analyze('   ', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid timeframe', async () => {
      await expect(
        controller.analyze('THYAO', { timeframe: '2h' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept all valid timeframes', async () => {
      for (const tf of ['4h', '1d', '1w', '1m', '3m', '6m']) {
        await controller.analyze('THYAO', { timeframe: tf });
        expect(mockService.analyze).toHaveBeenCalledWith('THYAO', tf);
      }
    });

    it('should include full result from service', async () => {
      const result = await controller.analyze('THYAO', {});
      expect(result.indicatorSummary).toEqual(mockAnalysisResult.indicatorSummary);
      expect(result.marketStructure).toEqual(mockAnalysisResult.marketStructure);
      expect(result.smartMoney).toEqual(mockAnalysisResult.smartMoney);
      expect(result.technicalRules).toEqual(mockAnalysisResult.technicalRules);
      expect(result.technicalScore).toEqual(mockAnalysisResult.technicalScore);
      expect(result.technicalSummary).toEqual(mockAnalysisResult.technicalSummary);
    });

    it('should include timestamp in response', async () => {
      const before = new Date().toISOString();
      const result = await controller.analyze('THYAO', {});
      const after = new Date().toISOString();
      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });

    it('should include success: true in response', async () => {
      const result = await controller.analyze('THYAO', {});
      expect(result.success).toBe(true);
    });
  });
});
