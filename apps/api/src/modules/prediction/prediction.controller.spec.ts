import { Test, TestingModule } from '@nestjs/testing';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';
import { PredictionResult } from './prediction.types';

const makeResult = (ticker: string, timeframe = '1d'): PredictionResult => ({
  ticker,
  timeframe: timeframe as PredictionResult['timeframe'],
  dataTimeframe: '1d',
  bullishProbability: 91,
  bearishProbability: 9,
  neutralProbability: 0,
  confidence: 92,
  trendStrength: 'strong',
  trendDirection: 'up',
  momentum: 'strong_bullish',
  expectedReturn: 6.4,
  expectedVolatility: 2.1,
  risk: 'low',
  riskScore: 22,
  liquidityQuality: 'high',
  expectedHoldingPeriod: { value: 4, unit: 'days' },
  entryZone: { min: 158, max: 161 },
  stopZone: 154,
  target1: 170,
  target2: 177,
  riskRewardRatio: 1.7,
  scenarios: [],
  signals: [],
  backtestAccuracy: { winRate: 68, totalTrades: 12, sharpeRatio: 1.4, isValid: true },
  verification: 'TRUE',
  catalystScore: 90,
  smartMoneyScore: 93,
  metadata: {},
  generatedAt: new Date().toISOString(),
  isValid: true,
});

describe('PredictionController', () => {
  let controller: PredictionController;
  let service: PredictionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PredictionController],
      providers: [
        {
          provide: PredictionService,
          useValue: {
            getPrediction: jest.fn().mockResolvedValue(makeResult('ASELS.IS')),
            getTop: jest.fn().mockReturnValue([makeResult('ASELS.IS')]),
            refreshPrediction: jest.fn().mockResolvedValue(makeResult('ASELS.IS')),
          },
        },
      ],
    }).compile();

    controller = module.get(PredictionController);
    service = module.get(PredictionService);
  });

  it('returns a prediction DTO for a ticker with default timeframe', async () => {
    const result = await controller.getPrediction('ASELS.IS');

    expect(result.ticker).toBe('ASELS.IS');
    expect(result.bullishProbability).toBe(91);
    expect(service.getPrediction).toHaveBeenCalledWith('ASELS.IS', '1d');
  });

  it('passes a requested timeframe', async () => {
    await controller.getPrediction('ASELS.IS', '1w');

    expect(service.getPrediction).toHaveBeenCalledWith('ASELS.IS', '1w');
  });

  it('falls back to 1d for an unsupported timeframe', async () => {
    await controller.getPrediction('ASELS.IS', 'invalid');

    expect(service.getPrediction).toHaveBeenCalledWith('ASELS.IS', '1d');
  });

  it('returns top results with a default limit', async () => {
    const result = await controller.getTop();

    expect(result.results).toHaveLength(1);
    expect(service.getTop).toHaveBeenCalledWith(10);
  });

  it('parses a numeric limit', async () => {
    await controller.getTop('5');

    expect(service.getTop).toHaveBeenCalledWith(5);
  });

  it('forces a refresh for a ticker', async () => {
    const result = await controller.refresh('ASELS.IS');

    expect(result.ticker).toBe('ASELS.IS');
    expect(result.result.bullishProbability).toBe(91);
    expect(service.refreshPrediction).toHaveBeenCalledWith('ASELS.IS', '1d');
  });
});
