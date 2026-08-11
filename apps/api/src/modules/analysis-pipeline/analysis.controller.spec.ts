import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { BadRequestException } from '@nestjs/common';

const mockAnalysisResult = {
  symbol: 'THYAO',
  timeframe: '1d' as const,
  indicators: [],
  marketStructure: { timeframe: '1d', trend: 'uptrend', structure: [], swingHighs: [], swingLows: [], supportZones: [], resistanceZones: [], breakOfStructure: [], changeOfCharacter: [], metadata: {}, isValid: true },
  smartMoney: { timeframe: '1d', accumulationScore: 70, distributionScore: 20, institutionalActivity: 'accumulating', smartMoneyConfidence: 0.7, trendAlignment: 'uptrend', signals: [], metadata: {}, isValid: true },
  technicalRules: { timeframe: '1d', rules: [], isValid: true },
  technicalScore: { timeframe: '1d', score: 72, grade: 'B', confidence: 0.75, ruleBreakdown: [], metadata: {}, isValid: true },
  technicalSummary: { timeframe: '1d', summary: 'Good', overallOpinion: 'Bullish', strengths: [], weaknesses: [], risks: [], recommendations: [], metadata: {}, isValid: true },
  financialRules: { symbol: 'THYAO', rules: [] },
  financialScore: { symbol: 'THYAO', score: 75, grade: 'A', passedRules: 4, warningRules: 1, failedRules: 1, confidence: 0.85, breakdown: { items: [], totalWeight: 6 } },
  financialSummary: { summary: 'Good', strengths: [], weaknesses: [], risks: [], positives: [], overallOpinion: 'Healthy' },
  confluence: { confluenceScore: 70, agreement: 'HIGH', financialAlignment: { score: 75, direction: 'bullish', confidence: 0.8, factors: [] }, technicalAlignment: { score: 72, direction: 'bullish', confidence: 0.75, factors: [] }, smartMoneyAlignment: { score: 65, direction: 'bullish', confidence: 0.7, factors: [] }, trendAlignment: { score: 70, direction: 'bullish', confidence: 0.8, factors: [] }, confidence: 0.8, metadata: {}, isValid: true },
  candidate: { candidate: true, candidateScore: 72, priority: 'HIGH', reasons: [], confidence: 0.8, metadata: {}, isValid: true },
  opportunity: { opportunityScore: 68, earlyOpportunity: false, opportunityLevel: 'HIGH', confidence: 0.75, strengths: [], riskFactors: [], reasons: [], metadata: {}, isValid: true },
  eliteScore: { eliteScore: 75, rating: 'A', priority: 'HIGH', confidence: 0.8, earlyOpportunity: false, summary: 'Strong', breakdown: { financial: { score: 75, weight: 25, contribution: 18.75 }, technical: { score: 72, weight: 25, contribution: 18 }, opportunity: { score: 68, weight: 20, contribution: 13.6 }, confluence: { score: 70, weight: 15, contribution: 10.5 }, candidate: { score: 72, weight: 15, contribution: 10.8 } }, metadata: {}, isValid: true },
  pipelineSteps: [{ step: 'indicators', durationMs: 5, success: true }],
  metadata: { totalDurationMs: 5, stepsCompleted: 1, stepsSuccessful: 1, analyzedAt: '2025-01-15T12:00:00.000Z' },
  isValid: true,
};

const mockService = {
  analyzeSymbol: jest.fn().mockResolvedValue(mockAnalysisResult),
  analyzeTechnical: jest.fn().mockResolvedValue(mockAnalysisResult),
  analyzeFinancial: jest.fn().mockResolvedValue(mockAnalysisResult),
  analyzeSmartMoney: jest.fn().mockResolvedValue(mockAnalysisResult),
  analyzeOpportunity: jest.fn().mockResolvedValue(mockAnalysisResult),
  analyzeEliteScore: jest.fn().mockResolvedValue(mockAnalysisResult),
};

describe('AnalysisController', () => {
  let controller: AnalysisController;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockService.analyzeSymbol.mockResolvedValue(mockAnalysisResult);
    mockService.analyzeTechnical.mockResolvedValue(mockAnalysisResult);
    mockService.analyzeFinancial.mockResolvedValue(mockAnalysisResult);
    mockService.analyzeSmartMoney.mockResolvedValue(mockAnalysisResult);
    mockService.analyzeOpportunity.mockResolvedValue(mockAnalysisResult);
    mockService.analyzeEliteScore.mockResolvedValue(mockAnalysisResult);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [{ provide: AnalysisService, useValue: mockService }],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /analysis/:symbol', () => {
    it('should return full analysis', async () => {
      const result = await controller.analyze('THYAO', {});
      expect(result.success).toBe(true);
      expect(result.symbol).toBe('THYAO');
      expect(result.timestamp).toBeDefined();
    });

    it('should uppercase symbol', async () => {
      await controller.analyze('thyao', {});
      expect(mockService.analyzeSymbol).toHaveBeenCalledWith('THYAO', '1d');
    });

    it('should use default timeframe', async () => {
      await controller.analyze('THYAO', {});
      expect(mockService.analyzeSymbol).toHaveBeenCalledWith('THYAO', '1d');
    });

    it('should pass custom timeframe', async () => {
      await controller.analyze('THYAO', { timeframe: '1w' });
      expect(mockService.analyzeSymbol).toHaveBeenCalledWith('THYAO', '1w');
    });

    it('should throw for empty symbol', async () => {
      await expect(controller.analyze('', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw for whitespace symbol', async () => {
      await expect(controller.analyze('   ', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw for invalid timeframe', async () => {
      await expect(controller.analyze('THYAO', { timeframe: '2h' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /analysis/:symbol/technical', () => {
    it('should return technical analysis', async () => {
      const result = await controller.analyzeTechnical('THYAO', {});
      expect(result.success).toBe(true);
      expect(mockService.analyzeTechnical).toHaveBeenCalled();
    });
  });

  describe('GET /analysis/:symbol/financial', () => {
    it('should return financial analysis', async () => {
      const result = await controller.analyzeFinancial('THYAO', {});
      expect(result.success).toBe(true);
      expect(mockService.analyzeFinancial).toHaveBeenCalled();
    });
  });

  describe('GET /analysis/:symbol/smart-money', () => {
    it('should return smart money analysis', async () => {
      const result = await controller.analyzeSmartMoney('THYAO', {});
      expect(result.success).toBe(true);
      expect(mockService.analyzeSmartMoney).toHaveBeenCalled();
    });
  });

  describe('GET /analysis/:symbol/opportunity', () => {
    it('should return opportunity analysis', async () => {
      const result = await controller.analyzeOpportunity('THYAO', {});
      expect(result.success).toBe(true);
      expect(mockService.analyzeOpportunity).toHaveBeenCalled();
    });
  });

  describe('GET /analysis/:symbol/elite-score', () => {
    it('should return elite score analysis', async () => {
      const result = await controller.analyzeEliteScore('THYAO', {});
      expect(result.success).toBe(true);
      expect(mockService.analyzeEliteScore).toHaveBeenCalled();
    });
  });

  describe('all endpoints', () => {
    it('should include timestamp in all responses', async () => {
      const r1 = await controller.analyze('THYAO', {});
      const r2 = await controller.analyzeTechnical('THYAO', {});
      const r3 = await controller.analyzeFinancial('THYAO', {});
      const r4 = await controller.analyzeSmartMoney('THYAO', {});
      const r5 = await controller.analyzeOpportunity('THYAO', {});
      const r6 = await controller.analyzeEliteScore('THYAO', {});
      expect(r1.timestamp).toBeDefined();
      expect(r2.timestamp).toBeDefined();
      expect(r3.timestamp).toBeDefined();
      expect(r4.timestamp).toBeDefined();
      expect(r5.timestamp).toBeDefined();
      expect(r6.timestamp).toBeDefined();
    });
  });
});
