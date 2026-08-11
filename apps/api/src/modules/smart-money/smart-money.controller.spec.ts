import { Test, TestingModule } from '@nestjs/testing';
import { SmartMoneyController } from './smart-money.controller';
import { SmartMoneyService } from './smart-money.service';
import { SmartMoneyScoreResult } from './smart-money.types';

const makeResult = (ticker: string): SmartMoneyScoreResult => ({
  ticker,
  timeframe: '1d',
  smartMoneyScore: 93,
  liquidityScore: 78,
  volumeScore: 85,
  accumulationScore: 90,
  distributionScore: 15,
  relativeVolume: 2.4,
  volumeSpike: 2.1,
  volumeSmaTrend: 0.35,
  moneyFlow: 'strong_positive',
  moneyFlowScore: 82,
  institutionalActivity: 'accumulating',
  confidence: 91,
  risk: 'low',
  riskScore: 22,
  liquidity: 'high',
  accumulationLevel: 'very_strong',
  distributionLevel: 'low',
  avgDailyVolume: 2_500_000,
  accumulationDays: 8,
  distributionDays: 2,
  breakoutVolume: true,
  signals: [],
  verification: 'TRUE',
  catalystScore: 90,
  metadata: {},
  generatedAt: new Date().toISOString(),
  isValid: true,
});

describe('SmartMoneyController', () => {
  let controller: SmartMoneyController;
  let service: SmartMoneyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmartMoneyController],
      providers: [
        {
          provide: SmartMoneyService,
          useValue: {
            getSmartMoney: jest.fn().mockResolvedValue(makeResult('ASELS.IS')),
            getTop: jest.fn().mockReturnValue([makeResult('ASELS.IS')]),
            refreshSmartMoney: jest.fn().mockResolvedValue(makeResult('ASELS.IS')),
          },
        },
      ],
    }).compile();

    controller = module.get(SmartMoneyController);
    service = module.get(SmartMoneyService);
  });

  it('returns a smart money score DTO for a ticker', async () => {
    const result = await controller.getSmartMoney('ASELS.IS');

    expect(result.ticker).toBe('ASELS.IS');
    expect(result.smartMoneyScore).toBe(93);
    expect(result.relativeVolume).toBe(2.4);
    expect(service.getSmartMoney).toHaveBeenCalledWith('ASELS.IS');
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
    expect(result.result.smartMoneyScore).toBe(93);
    expect(service.refreshSmartMoney).toHaveBeenCalledWith('ASELS.IS');
  });
});
