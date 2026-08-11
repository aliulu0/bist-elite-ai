import { Test, TestingModule } from '@nestjs/testing';
import { VerificationAIService } from './verification-ai.service';
import { AIResearchHubService } from '../ai-research/ai-research-hub.service';
import { VerificationRuleEngine } from './verification-rule-engine';
import { VerificationRegistry } from './verification-registry';
import { CacheService } from '../../common/cache/cache.service';
import { VerificationResult } from './verification-ai.types';

const makeResult = (ticker: string, verified: VerificationResult['verified'] = 'TRUE'): VerificationResult => ({
  ticker,
  verified,
  verificationScore: 80,
  evidenceCount: 3,
  sourceCount: 3,
  trustedSources: ['KAP'],
  conflictingSources: [],
  lastVerified: new Date().toISOString(),
  verificationReason: 'doğrulandı',
  claims: [],
  rawSources: [],
});

describe('VerificationAIService', () => {
  let service: VerificationAIService;
  let researchHub: AIResearchHubService;
  let ruleEngine: VerificationRuleEngine;
  let registry: VerificationRegistry;
  let cache: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationAIService,
        {
          provide: AIResearchHubService,
          useValue: {
            getConsensus: jest.fn().mockResolvedValue({ ticker: 'THYAO.IS', researchSources: [] }),
          },
        },
        {
          provide: VerificationRuleEngine,
          useValue: { verifyConsensus: jest.fn().mockReturnValue(makeResult('THYAO.IS')) },
        },
        {
          provide: VerificationRegistry,
          useValue: {
            get: jest.fn(),
            save: jest.fn((r) => r),
            getAll: jest.fn().mockReturnValue([]),
          },
        },
        CacheService,
      ],
    }).compile();

    service = module.get(VerificationAIService);
    researchHub = module.get(AIResearchHubService);
    ruleEngine = module.get(VerificationRuleEngine);
    registry = module.get(VerificationRegistry);
    cache = module.get(CacheService);
  });

  it('reuses AI Research Hub consensus for verification', async () => {
    const result = await service.refreshVerification('THYAO.IS');

    expect(researchHub.getConsensus).toHaveBeenCalledWith('THYAO.IS');
    expect(ruleEngine.verifyConsensus).toHaveBeenCalled();
    expect(registry.save).toHaveBeenCalledWith(result);
    expect(result.ticker).toBe('THYAO.IS');
  });

  it('caches results and reuses them', async () => {
    const first = await service.getVerification('THYAO.IS');
    const second = await service.getVerification('THYAO.IS');

    expect(first).toBe(second);
    expect(researchHub.getConsensus).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache when useCache is false', async () => {
    await service.getVerification('THYAO.IS', false);
    await service.getVerification('THYAO.IS', false);

    expect(researchHub.getConsensus).toHaveBeenCalledTimes(2);
  });

  it('normalizes ticker casing before hub lookup', async () => {
    await service.getVerification('thyao.is');

    expect(researchHub.getConsensus).toHaveBeenCalledWith('THYAO.IS');
  });

  it('builds a report from a verification result', async () => {
    const report = await service.getReport('THYAO.IS');

    expect(report.ticker).toBe('THYAO.IS');
    expect(report.summary.verified).toBe('TRUE');
    expect(report.claims).toEqual([]);
    expect(report.generatedAt).toBeTruthy();
  });

  it('getDashboard delegates to registry', () => {
    service.getDashboard();

    expect(registry.getAll).toHaveBeenCalled();
  });

  it('shares the global cache instance', () => {
    expect(cache).toBeInstanceOf(CacheService);
  });
});
