import { Test, TestingModule } from '@nestjs/testing';
import { AIResearchController } from './ai-research.controller';
import { AIResearchHubService } from './ai-research-hub.service';
import { AIConsensus } from './ai-research.types';

const makeConsensus = (ticker: string): AIConsensus => ({
  ticker,
  chatgptSummary: null,
  geminiSummary: null,
  perplexitySummary: null,
  grokSummary: null,
  newsSummary: 'haber',
  researchSources: [],
  agreementLevel: 0.6,
  conflicts: [],
  confidence: 0.6,
  consensusScore: 60,
  providerSummaries: {},
  totalEvidence: 1,
  duplicatesRemoved: 0,
  timestamp: new Date().toISOString(),
});

describe('AIResearchController', () => {
  let controller: AIResearchController;
  let service: AIResearchHubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIResearchController],
      providers: [
        {
          provide: AIResearchHubService,
          useValue: {
            getConsensus: jest.fn().mockResolvedValue(makeConsensus('THYAO.IS')),
            getTop: jest.fn().mockReturnValue([makeConsensus('THYAO.IS')]),
            getProviderStatus: jest.fn().mockReturnValue([]),
            refreshConsensus: jest.fn().mockResolvedValue(makeConsensus('THYAO.IS')),
          },
        },
      ],
    }).compile();

    controller = module.get(AIResearchController);
    service = module.get(AIResearchHubService);
  });

  it('returns consensus DTO for a ticker', async () => {
    const result = await controller.getConsensus('THYAO.IS');

    expect(result.ticker).toBe('THYAO.IS');
    expect(result.consensusScore).toBe(60);
    expect(service.getConsensus).toHaveBeenCalledWith('THYAO.IS');
  });

  it('returns top consensuses with a default limit of 10', async () => {
    const result = await controller.getTop();

    expect(result).toHaveLength(1);
    expect(service.getTop).toHaveBeenCalledWith(10);
  });

  it('parses a numeric limit query', async () => {
    await controller.getTop('5');

    expect(service.getTop).toHaveBeenCalledWith(5);
  });

  it('returns provider statuses', async () => {
    const result = await controller.getProviders();

    expect(result).toEqual([]);
    expect(service.getProviderStatus).toHaveBeenCalled();
  });

  it('refreshes consensus for a ticker', async () => {
    const result = await controller.refresh('THYAO.IS');

    expect(result.ticker).toBe('THYAO.IS');
    expect(result.consensus.ticker).toBe('THYAO.IS');
    expect(service.refreshConsensus).toHaveBeenCalledWith('THYAO.IS');
  });
});
