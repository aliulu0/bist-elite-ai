import { Test, TestingModule } from '@nestjs/testing';
import { CatalystController } from './catalyst.controller';
import { CatalystService } from './catalyst.service';
import { CatalystResult } from './catalyst.types';
import { ResearchImportance } from '../ai-research/ai-research.types';

const makeResult = (ticker: string): CatalystResult => ({
  ticker,
  catalystScore: 94,
  confidence: 91,
  expectedImpact: 'very_bullish',
  events: [
    {
      id: `cat-${ticker}-0-1a2b`,
      ticker,
      category: 'defense_contract',
      title: 'Yeni savunma ihalesi kazanıldı',
      description: 'Şirket yeni bir savunma sözleşmesi kazandı.',
      importance: ResearchImportance.CRITICAL,
      verified: true,
      verificationScore: 92,
      date: new Date().toISOString(),
      source: 'KAP',
      provider: 'kap',
      url: 'https://kap.org.tr/1',
      expectedImpact: 'very_bullish',
      timeHorizon: '1_week',
      confidence: 0.91,
      catalystScore: 95,
      keywords: ['savunma ihale'],
    },
  ],
  verifiedCount: 1,
  totalCount: 1,
  rawSources: [],
  generatedAt: new Date().toISOString(),
});

describe('CatalystController', () => {
  let controller: CatalystController;
  let service: CatalystService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalystController],
      providers: [
        {
          provide: CatalystService,
          useValue: {
            getCatalyst: jest.fn().mockResolvedValue(makeResult('ASELS.IS')),
            getTop: jest.fn().mockReturnValue([makeResult('ASELS.IS')]),
            refreshCatalyst: jest.fn().mockResolvedValue(makeResult('ASELS.IS')),
          },
        },
      ],
    }).compile();

    controller = module.get(CatalystController);
    service = module.get(CatalystService);
  });

  it('returns a catalyst result DTO for a ticker', async () => {
    const result = await controller.getCatalyst('ASELS.IS');

    expect(result.ticker).toBe('ASELS.IS');
    expect(result.catalystScore).toBe(94);
    expect(result.events[0].category).toBe('defense_contract');
    expect(service.getCatalyst).toHaveBeenCalledWith('ASELS.IS');
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
    expect(result.result.catalystScore).toBe(94);
    expect(service.refreshCatalyst).toHaveBeenCalledWith('ASELS.IS');
  });
});
