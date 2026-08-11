import { Test, TestingModule } from '@nestjs/testing';
import { BacktestController } from './backtest.controller';
import { BacktestService } from './backtest.service';
import { BacktestResponseDto } from './dto/backtest-response.dto';
import {
  StrategyRankingDto,
  PortfolioSignalDto,
  TomorrowFeedbackResultDto,
  EliteScoreWeightDeltaDto,
  BacktestReportDto,
} from './dto/strategy-ranking.dto';
import { LearningReportDto } from './dto/learning-report.dto';
import { BacktestRequestDto } from './dto/backtest-request.dto';
import { stubResponse, stubRanking, stubSignal, stubFeedback, stubEliteDelta, stubReport, stubLearning } from './backtest-test-helpers';

describe('BacktestController', () => {
  let controller: BacktestController;
  const service = {
    runBacktest: jest.fn(),
    getReport: jest.fn(),
    getLearning: jest.fn(),
    getStrategyRankings: jest.fn(),
    getPortfolioSignals: jest.fn(),
    applyTomorrowFeedback: jest.fn(),
    getEliteScoreWeightDelta: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BacktestController],
      providers: [{ provide: BacktestService, useValue: service }],
    }).compile();
    controller = module.get(BacktestController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('runBacktestGet', () => {
    it('delegates to service.runBacktest', async () => {
      const expected: BacktestResponseDto = stubResponse();
      service.runBacktest.mockResolvedValue(expected);
      const dto = { symbol: 'thyao.is' } as BacktestRequestDto;
      const result = await controller.runBacktestGet(dto);
      expect(service.runBacktest).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('runBacktestPost', () => {
    it('delegates to service.runBacktest', async () => {
      const expected: BacktestResponseDto = stubResponse();
      service.runBacktest.mockResolvedValue(expected);
      const dto = { symbol: 'thyao.is' } as BacktestRequestDto;
      const result = await controller.runBacktestPost(dto);
      expect(result).toBe(expected);
    });
  });

  describe('getReport', () => {
    it('returns the stored report', () => {
      const expected: BacktestReportDto = stubReport();
      service.getReport.mockReturnValue(expected);
      expect(controller.getReport('THYAO.IS')).toBe(expected);
      expect(service.getReport).toHaveBeenCalledWith('THYAO.IS', '1d', 'indicator');
    });
  });

  describe('getLearning', () => {
    it('returns the learning report', () => {
      const expected: LearningReportDto = stubLearning();
      service.getLearning.mockReturnValue(expected);
      expect(controller.getLearning('THYAO.IS')).toBe(expected);
    });
  });

  describe('getStrategyRankings', () => {
    it('returns rankings', () => {
      const expected: StrategyRankingDto[] = [stubRanking()];
      service.getStrategyRankings.mockReturnValue(expected);
      expect(controller.getStrategyRankings()).toBe(expected);
    });
  });

  describe('getPortfolioSignals', () => {
    it('returns portfolio signals', () => {
      const expected: PortfolioSignalDto[] = [stubSignal()];
      service.getPortfolioSignals.mockReturnValue(expected);
      expect(controller.getPortfolioSignals('THYAO.IS')).toBe(expected);
    });
  });

  describe('getTomorrowFeedback', () => {
    it('parses query numbers and delegates', () => {
      const expected: TomorrowFeedbackResultDto = stubFeedback();
      service.applyTomorrowFeedback.mockReturnValue(expected);
      expect(controller.getTomorrowFeedback('THYAO.IS', '5', '7')).toBe(expected);
      expect(service.applyTomorrowFeedback).toHaveBeenCalledWith('THYAO.IS', 5, 7);
    });
  });

  describe('getEliteScoreWeightDelta', () => {
    it('returns the weight delta', () => {
      const expected: EliteScoreWeightDeltaDto = stubEliteDelta();
      service.getEliteScoreWeightDelta.mockReturnValue(expected);
      expect(controller.getEliteScoreWeightDelta('THYAO.IS')).toBe(expected);
    });
  });
});
