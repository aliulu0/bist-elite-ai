import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HistoricalEarlyOpportunityBacktestController } from '../historical-early-opportunity-backtest.controller';
import { HistoricalEarlyOpportunityBacktestService } from '../historical-early-opportunity-backtest.service';
import { BacktestRunResult, BacktestSummary } from '../early-opportunity-backtest.types';

const RUN_ID = '9f8bc22e-1a2b-4c3d-8e4f-5a6b7c8d9e0f';

function makeRun(overrides: Partial<BacktestRunResult> = {}): BacktestRunResult {
  return {
    runId: RUN_ID,
    config: {
      symbols: ['AKBNK.IS'],
      timeframes: ['1d'],
      startDate: '2025-09-01',
      endDate: '2025-11-15',
      horizons: ['1M'],
      benchmark: 'XU100',
    },
    startedAt: '2026-08-12T00:00:00.000Z',
    completedAt: '2026-08-12T00:00:01.000Z',
    decisions: [],
    outcomes: [],
    successResults: [],
    benchmarkResults: [],
    expectedReturnValidation: [],
    confidenceCalibration: { buckets: [] } as never,
    leadTime: { averageDays: null, byScoreBucket: [], bySignalStrength: [] } as never,
    falsePositives: { count: 0, classified: [], byReason: {} } as never,
    missedOpportunities: { count: 0, opportunities: [] } as never,
    sampleQuality: 'INSUFFICIENT_SAMPLE' as never,
    survivorship: { possible: true, note: '' } as never,
    corporateActions: { unchecked: true, note: '' } as never,
    transactionCosts: { commission: 0, slippage: 0, note: '' } as never,
    performance: {
      decisionsEvaluated: 3,
      outcomesEvaluated: 3,
      skippedDates: 0,
      invalidDates: 0,
      historicalCoverage: 0.99,
      executionDurationMs: 12,
      averageDecisionDurationMs: 4,
      providerCalls: 5,
      cacheHits: 3,
      indicatorCacheHits: 2,
    },
    evaluationType: 'HISTORICAL_OUTCOME_VALIDATION',
    pointInTimeVerified: true,
    lookAheadTested: true,
    survivorshipBiasPossible: true,
    ...overrides,
  };
}

function makeSummary(): BacktestSummary {
  return {
    runId: RUN_ID,
    config: makeRun().config,
    startedAt: '2026-08-12T00:00:00.000Z',
    completedAt: '2026-08-12T00:00:01.000Z',
    decisionsEvaluated: 3,
    winRate: 33.3,
    averageReturn: -5.04,
    medianReturn: -3.56,
    benchmarkExcessReturn: null,
    maxDrawdown: 19.7,
    averageLeadTime: null,
    falsePositiveCount: 0,
    missedOpportunityCount: 0,
    sampleQuality: 'INSUFFICIENT_SAMPLE',
    survivorshipWarning: 'SURVIVORSHIP_BIAS_POSSIBLE',
    pointInTimeVerified: true,
    evaluationType: 'HISTORICAL_OUTCOME_VALIDATION',
  };
}

describe('HistoricalEarlyOpportunityBacktestController', () => {
  let controller: HistoricalEarlyOpportunityBacktestController;
  const service = {
    getRun: jest.fn(),
    getSummary: jest.fn(),
    getDecisions: jest.fn(),
    runBacktest: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoricalEarlyOpportunityBacktestController],
      providers: [
        {
          provide: HistoricalEarlyOpportunityBacktestService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(HistoricalEarlyOpportunityBacktestController);
  });

  describe('route metadata (UUID runId must not be shadowed by :ticker)', () => {
    it('declares class path backtest/early-opportunity', () => {
      expect(Reflect.getMetadata('path', HistoricalEarlyOpportunityBacktestController)).toBe(
        'backtest/early-opportunity',
      );
    });

    it('declares getRun with a UUID-constrained path segment', () => {
      const path = Reflect.getMetadata('path', controller.getRun) as string;
      expect(path).toMatch(
        /^:runId\(\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\)/,
      );
    });

    it('declares getTickerSummary with a plain :ticker segment (non-UUID still routed there)', () => {
      const path = Reflect.getMetadata('path', controller.getTickerSummary) as string;
      expect(path).toBe(':ticker');
    });
  });

  describe('getRun', () => {
    it('returns the run payload for a UUID runId', async () => {
      service.getRun.mockReturnValue(makeRun());
      service.getSummary.mockReturnValue(makeSummary());
      service.getDecisions.mockReturnValue([]);

      const result = await controller.getRun(RUN_ID);

      expect(service.getRun).toHaveBeenCalledWith(RUN_ID);
      expect(result.runId).toBe(RUN_ID);
      expect(result.completedAt).toBe('2026-08-12T00:00:01.000Z');
      expect(result.executionDurationMs).toBe(12);
      expect(result.providerCalls).toBe(5);
      expect(result.cacheHits).toBe(3);
      expect(result.summary.decisionsEvaluated).toBe(3);
    });

    it('throws NotFoundException when the run does not exist', async () => {
      service.getRun.mockReturnValue(null);

      await expect(controller.getRun('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTickerSummary', () => {
    it('still returns the helper message for non-UUID ticker values', async () => {
      const result = await controller.getTickerSummary('AKBNK.IS');
      expect(result.ticker).toBe('AKBNK.IS');
      expect(result.message).toContain('POST /backtest/early-opportunity/run');
    });
  });
});
