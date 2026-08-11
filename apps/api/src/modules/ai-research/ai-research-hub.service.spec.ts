import { Test, TestingModule } from '@nestjs/testing';
import { AIResearchHubService } from './ai-research-hub.service';
import { AIProviderRegistry } from './ai-provider-registry';
import { AIConsensusEngine } from './consensus/ai-consensus.engine';
import { AIConsensusRegistry } from './ai-consensus.registry';
import { CacheService } from '../../common/cache/cache.service';
import { NewsAggregationService } from '../research/news-aggregation.service';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { AIConsensus, AiProviderResult, ResearchImportance } from './ai-research.types';
import { ResearchArticle } from '../research/interfaces/research.types';

function makeArticle(provider: string, url: string): ResearchArticle {
  return {
    id: `id-${url}`,
    source: provider,
    provider,
    title: `${provider} haber`,
    summary: 'özet',
    publishedAt: new Date().toISOString(),
    url,
    country: 'TR',
    language: 'tr',
    importance: ResearchImportance.MEDIUM,
    tags: [],
  };
}

describe('AIResearchHubService', () => {
  let service: AIResearchHubService;
  let cache: CacheService;
  let registry: AIProviderRegistry;
  let consensusRegistry: AIConsensusRegistry;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIResearchHubService,
        {
          provide: AIProviderRegistry,
          useValue: {
            collectAll: jest.fn().mockResolvedValue([] as AiProviderResult[]),
            getEnabled: jest.fn().mockReturnValue([]),
            getStatus: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: AIConsensusEngine,
          useValue: { calculate: jest.fn().mockReturnValue(makeConsensus('THYAO.IS')) },
        },
        {
          provide: AIConsensusRegistry,
          useValue: {
            get: jest.fn(),
            save: jest.fn((c) => c),
            getTop: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: NewsAggregationService,
          useValue: { getCompanyNews: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: MarketDataOrchestrator,
          useValue: {
            fetchCompany: jest.fn().mockResolvedValue(null),
            fetchFinancials: jest.fn().mockResolvedValue(null),
            fetchDisclosures: jest.fn().mockResolvedValue(null),
            fetchMacroIndicators: jest.fn().mockResolvedValue([]),
          },
        },
        CacheService,
      ],
    }).compile();

    service = module.get(AIResearchHubService);
    cache = module.get(CacheService);
    registry = module.get(AIProviderRegistry);
    consensusRegistry = module.get(AIConsensusRegistry);
  });

  it('collects a bundle through orchestration and produces consensus', async () => {
    const consensus = await service.refreshConsensus('THYAO.IS');

    expect(consensus.ticker).toBe('THYAO.IS');
    expect(registry.collectAll).toHaveBeenCalled();
    expect(consensusRegistry.save).toHaveBeenCalled();
  });

  it('caches consensus and reuses it on subsequent getConsensus calls', async () => {
    const first = await service.getConsensus('THYAO.IS');
    const second = await service.getConsensus('THYAO.IS');

    expect(first).toBe(second);
    expect(registry.collectAll).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache when useCache is false', async () => {
    await service.getConsensus('THYAO.IS', false);
    await service.getConsensus('THYAO.IS', false);

    expect(registry.collectAll).toHaveBeenCalledTimes(2);
  });

  it('normalizes ticker casing', async () => {
    const spy = jest.spyOn(consensusRegistry, 'get').mockReturnValue(makeConsensus('THYAO.IS'));

    await service.getConsensus('thyao.is');

    expect(spy).toHaveBeenCalledWith('THYAO.IS');
  });

  it('getTop delegates to consensus registry', () => {
    service.getTop(5);

    expect(consensusRegistry.getTop).toHaveBeenCalledWith(5);
  });

  it('injects news articles and market data into the provider pipeline', async () => {
    const article = makeArticle('google-news', 'https://example.com/1');
    const module2: TestingModule = await Test.createTestingModule({
      providers: [
        AIResearchHubService,
        {
          provide: AIProviderRegistry,
          useValue: {
            collectAll: jest.fn().mockImplementation(async (bundle) => {
              expect(bundle.news).toEqual([article]);
              return [] as AiProviderResult[];
            }),
            getEnabled: jest.fn().mockReturnValue([]),
            getStatus: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: AIConsensusEngine,
          useValue: { calculate: jest.fn().mockReturnValue(makeConsensus('THYAO.IS')) },
        },
        {
          provide: AIConsensusRegistry,
          useValue: { get: jest.fn(), save: jest.fn((c) => c), getTop: jest.fn().mockReturnValue([]) },
        },
        {
          provide: NewsAggregationService,
          useValue: { getCompanyNews: jest.fn().mockResolvedValue([article]) },
        },
        {
          provide: MarketDataOrchestrator,
          useValue: {
            fetchCompany: jest.fn().mockResolvedValue(null),
            fetchFinancials: jest.fn().mockResolvedValue(null),
            fetchDisclosures: jest.fn().mockResolvedValue(null),
            fetchMacroIndicators: jest.fn().mockResolvedValue([]),
          },
        },
        CacheService,
      ],
    }).compile();

    const svc = module2.get(AIResearchHubService);
    await svc.getConsensus('THYAO.IS', false);
  });

  it('shares a single CacheService instance', () => {
    expect(cache).toBeInstanceOf(CacheService);
  });
});
