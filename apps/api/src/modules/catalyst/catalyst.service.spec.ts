import { Test, TestingModule } from '@nestjs/testing';
import { CatalystService } from './catalyst.service';
import { AIResearchHubService } from '../ai-research/ai-research-hub.service';
import { VerificationAIService } from '../verification-ai/verification-ai.service';
import { CatalystEngine } from './catalyst-engine';
import { CatalystScoreEngine } from './catalyst-score-engine';
import { CatalystRegistry } from './catalyst-registry';
import { CacheService } from '../../common/cache/cache.service';
import { CatalystResult } from './catalyst.types';

const makeResult = (ticker: string): CatalystResult => ({
  ticker,
  catalystScore: 94,
  confidence: 91,
  expectedImpact: 'very_bullish',
  events: [],
  verifiedCount: 0,
  totalCount: 0,
  rawSources: [],
  generatedAt: new Date().toISOString(),
});

describe('CatalystService', () => {
  let service: CatalystService;
  let researchHub: AIResearchHubService;
  let verificationAI: VerificationAIService;
  let registry: CatalystRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalystService,
        {
          provide: AIResearchHubService,
          useValue: {
            getConsensus: jest.fn().mockResolvedValue({ ticker: 'ASELS.IS', researchSources: [] }),
          },
        },
        {
          provide: VerificationAIService,
          useValue: {
            getVerification: jest.fn().mockResolvedValue({ ticker: 'ASELS.IS', verified: 'TRUE', verificationScore: 92 }),
          },
        },
        {
          provide: CatalystEngine,
          useValue: { detect: jest.fn().mockReturnValue([]) },
        },
        {
          provide: CatalystScoreEngine,
          useValue: { resultFor: jest.fn().mockReturnValue(makeResult('ASELS.IS')) },
        },
        {
          provide: CatalystRegistry,
          useValue: {
            get: jest.fn(),
            save: jest.fn((r) => r),
            getTop: jest.fn().mockReturnValue([]),
            getAll: jest.fn().mockReturnValue([]),
          },
        },
        CacheService,
      ],
    }).compile();

    service = module.get(CatalystService);
    researchHub = module.get(AIResearchHubService);
    verificationAI = module.get(VerificationAIService);
    registry = module.get(CatalystRegistry);
  });

  it('reuses AI Research Hub AND Verification AI in parallel', async () => {
    const result = await service.refreshCatalyst('ASELS.IS');

    expect(researchHub.getConsensus).toHaveBeenCalledWith('ASELS.IS');
    expect(verificationAI.getVerification).toHaveBeenCalledWith('ASELS.IS');
    expect(registry.save).toHaveBeenCalledWith(result);
    expect(result.ticker).toBe('ASELS.IS');
  });

  it('caches results and reuses them', async () => {
    const first = await service.getCatalyst('ASELS.IS');
    const second = await service.getCatalyst('ASELS.IS');

    expect(first).toBe(second);
    expect(researchHub.getConsensus).toHaveBeenCalledTimes(1);
    expect(verificationAI.getVerification).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache when useCache is false', async () => {
    await service.getCatalyst('ASELS.IS', false);
    await service.getCatalyst('ASELS.IS', false);

    expect(researchHub.getConsensus).toHaveBeenCalledTimes(2);
    expect(verificationAI.getVerification).toHaveBeenCalledTimes(2);
  });

  it('normalizes ticker casing', async () => {
    await service.getCatalyst('asels.is');

    expect(researchHub.getConsensus).toHaveBeenCalledWith('ASELS.IS');
  });

  it('getTop delegates to registry', () => {
    service.getTop(5);

    expect(registry.getTop).toHaveBeenCalledWith(5);
  });

  it('builds a dashboard from a catalyst result', async () => {
    const dashboard = await service.getDashboard('ASELS.IS');

    expect(dashboard.ticker).toBe('ASELS.IS');
    expect(dashboard.catalystScore).toBe(94);
    expect(dashboard.expectedImpact).toBe('very_bullish');
  });
});
