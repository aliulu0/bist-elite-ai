import { AggregationEngine } from './aggregation-engine.service';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { MarketDataCacheService } from '../cache/market-data-cache.service';
import { QualityScorer } from './quality-scorer.service';
import { ConflictResolver } from './conflict-resolver.service';
import { DataValidator } from './data-validator.service';
import { AggregatedResult } from './aggregation.types';
import { Company } from '../interfaces/unified-domain.types';

describe('AggregationEngine', () => {
  let engine: AggregationEngine;
  let mockOrchestrator: jest.Mocked<MarketDataOrchestrator>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreakerService>;
  let mockCacheService: jest.Mocked<MarketDataCacheService>;
  let mockQualityScorer: jest.Mocked<QualityScorer>;
  let mockConflictResolver: jest.Mocked<ConflictResolver>;
  let mockDataValidator: jest.Mocked<DataValidator>;

  const mockCompany: Company = {
    symbol: 'THYAO',
    name: 'Turkish Airlines',
    sector: 'Aviation',
    marketCap: 500000000,
    sharesOutstanding: 1000000000,
    currency: 'TRY',
    exchange: 'BIST',
    lastUpdated: new Date().toISOString(),
    source: 'fintables',
  };

  beforeEach(() => {
    mockOrchestrator = {
      getAvailableProviders: jest.fn().mockReturnValue(['fintables', 'yahoo']),
      fetchCompany: jest.fn(),
      fetchFinancials: jest.fn(),
      fetchBalanceSheet: jest.fn(),
      fetchIncomeStatement: jest.fn(),
      fetchCashFlow: jest.fn(),
      fetchSector: jest.fn(),
      fetchDisclosures: jest.fn(),
    } as unknown as jest.Mocked<MarketDataOrchestrator>;

    mockCircuitBreaker = {
      isCircuitOpen: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<CircuitBreakerService>;

    mockCacheService = {
      get: jest.fn().mockReturnValue(undefined),
      set: jest.fn(),
    } as unknown as jest.Mocked<MarketDataCacheService>;

    mockQualityScorer = {
      calculate: jest.fn().mockReturnValue(85),
    } as unknown as jest.Mocked<QualityScorer>;

    mockConflictResolver = {
      resolve: jest.fn(),
      resolveNumeric: jest.fn(),
      buildConflictRecord: jest.fn(),
    } as unknown as jest.Mocked<ConflictResolver>;

    mockDataValidator = {
      validateCompany: jest.fn().mockReturnValue([]),
      validateFinancialStatement: jest.fn().mockReturnValue([]),
      validateBalanceSheet: jest.fn().mockReturnValue([]),
      validateIncomeStatement: jest.fn().mockReturnValue([]),
      validateCashFlow: jest.fn().mockReturnValue([]),
      validateSector: jest.fn().mockReturnValue([]),
      deduplicateDisclosures: jest.fn().mockImplementation((d) => d),
    } as unknown as jest.Mocked<DataValidator>;

    engine = new AggregationEngine(
      mockOrchestrator,
      mockCircuitBreaker,
      mockCacheService,
      mockQualityScorer,
      mockConflictResolver,
      mockDataValidator,
    );
  });

  describe('aggregateCompany', () => {
    it('should return cached result when available', async () => {
      const cached: AggregatedResult<Company> = {
        data: mockCompany,
        metadata: {
          providersQueried: ['fintables'],
          providersUsed: ['fintables'],
          providersFailed: [],
          providerConfidence: { fintables: 90 },
          qualityScore: 90,
          lastUpdated: '2026-01-01T00:00:00Z',
          cacheStatus: 'miss',
          aggregationDurationMs: 0,
          validationWarnings: [],
          conflictCount: 0,
          conflicts: [],
        },
      };
      mockCacheService.get.mockReturnValue(cached);

      const result = await engine.aggregateCompany('THYAO');
      expect(result).not.toBeNull();
      expect(result!.metadata.cacheStatus).toBe('hit');
      expect(mockOrchestrator.fetchCompany).not.toHaveBeenCalled();
    });

    it('should return null when all providers fail', async () => {
      mockOrchestrator.fetchCompany.mockRejectedValue(new Error('Network error'));

      const result = await engine.aggregateCompany('THYAO');
      expect(result).toBeNull();
    });

    it('should return null when no data returned', async () => {
      mockOrchestrator.fetchCompany.mockResolvedValue({
        data: null,
        provider: 'fintables',
        cached: false,
        timestamp: new Date().toISOString(),
      } as any);

      const result = await engine.aggregateCompany('THYAO');
      expect(result).toBeNull();
    });

    it('should aggregate from single provider', async () => {
      mockOrchestrator.fetchCompany.mockResolvedValue({
        data: mockCompany,
        provider: 'fintables',
        cached: false,
        timestamp: new Date().toISOString(),
      });

      const result = await engine.aggregateCompany('THYAO');
      expect(result).not.toBeNull();
      expect(result!.data.symbol).toBe('THYAO');
      expect(result!.metadata.providersUsed).toContain('fintables');
      expect(result!.metadata.qualityScore).toBe(85);
    });

    it('should merge data from multiple providers', async () => {
      const companyA = { ...mockCompany, name: 'THY A.O.' };
      const companyB = { ...mockCompany, name: 'Turkish Airlines' };

      mockOrchestrator.fetchCompany
        .mockResolvedValueOnce({
          data: companyA,
          provider: 'fintables',
          cached: false,
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          data: companyB,
          provider: 'yahoo',
          cached: false,
          timestamp: new Date().toISOString(),
        });

      mockConflictResolver.resolve.mockReturnValue({
        value: 'Turkish Airlines',
        resolution: 'highest_priority',
      });
      mockConflictResolver.buildConflictRecord.mockReturnValue({
        field: 'name',
        values: [],
        resolution: 'highest_priority',
        chosenValue: 'Turkish Airlines',
      });

      const result = await engine.aggregateCompany('THYAO');
      expect(result).not.toBeNull();
      expect(result!.metadata.providersUsed).toContain('fintables');
      expect(result!.metadata.providersUsed).toContain('yahoo');
    });

    it('should handle provider failure gracefully', async () => {
      mockOrchestrator.fetchCompany
        .mockResolvedValueOnce({
          data: mockCompany,
          provider: 'fintables',
          cached: false,
          timestamp: new Date().toISOString(),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await engine.aggregateCompany('THYAO');
      expect(result).not.toBeNull();
      expect(result!.metadata.providersFailed).toContain('yahoo');
    });

    it('should include validation warnings from data validator', async () => {
      mockDataValidator.validateCompany.mockReturnValue([
        { field: 'sector', message: 'Sector is Unknown', severity: 'info', provider: 'fintables' },
      ]);
      mockOrchestrator.fetchCompany.mockResolvedValue({
        data: { ...mockCompany, sector: 'Unknown' },
        provider: 'fintables',
        cached: false,
        timestamp: new Date().toISOString(),
      });

      const result = await engine.aggregateCompany('THYAO');
      expect(result).not.toBeNull();
      expect(result!.metadata.validationWarnings.length).toBeGreaterThanOrEqual(1);
      expect(result!.metadata.validationWarnings[0].field).toBe('sector');
    });

    it('should calculate provider confidence', async () => {
      mockOrchestrator.fetchCompany.mockResolvedValue({
        data: mockCompany,
        provider: 'fintables',
        cached: false,
        timestamp: new Date().toISOString(),
      });

      const result = await engine.aggregateCompany('THYAO');
      expect(result).not.toBeNull();
      expect(result!.metadata.providerConfidence).toHaveProperty('fintables');
      expect(result!.metadata.providerConfidence['fintables']).toBeGreaterThan(0);
    });

    it('should record quality score', async () => {
      mockOrchestrator.fetchCompany.mockResolvedValue({
        data: mockCompany,
        provider: 'fintables',
        cached: false,
        timestamp: new Date().toISOString(),
      });

      const result = await engine.aggregateCompany('THYAO');
      expect(result).not.toBeNull();
      expect(mockQualityScorer.calculate).toHaveBeenCalled();
      expect(result!.metadata.qualityScore).toBe(85);
    });

    it('should cache the result', async () => {
      mockOrchestrator.fetchCompany.mockResolvedValue({
        data: mockCompany,
        provider: 'fintables',
        cached: false,
        timestamp: new Date().toISOString(),
      });

      await engine.aggregateCompany('THYAO');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'aggregated',
        'company',
        'THYAO',
        expect.any(Object),
        12 * 60 * 60 * 1000,
      );
    });
  });

  describe('aggregateDisclosures', () => {
    const mockDisclosures = [
      {
        title: 'Important Notice',
        date: '2026-01-01',
        source: 'kap',
        url: 'http://example.com',
        symbol: 'THYAO',
        category: 'general',
      },
      {
        title: 'Financial Report',
        date: '2026-01-02',
        source: 'kap',
        url: 'http://example.com',
        symbol: 'THYAO',
        category: 'financial',
      },
    ];

    it('should return cached result when available', async () => {
      const cached: AggregatedResult<typeof mockDisclosures> = {
        data: mockDisclosures,
        metadata: {
          providersQueried: ['kap'],
          providersUsed: ['kap'],
          providersFailed: [],
          providerConfidence: {},
          qualityScore: 90,
          lastUpdated: '2026-01-01T00:00:00Z',
          cacheStatus: 'miss',
          aggregationDurationMs: 0,
          validationWarnings: [],
          conflictCount: 0,
          conflicts: [],
        },
      };
      mockCacheService.get.mockReturnValue(cached);

      const result = await engine.aggregateDisclosures('THYAO');
      expect(result).not.toBeNull();
      expect(result!.metadata.cacheStatus).toBe('hit');
    });

    it('should fetch and deduplicate disclosures', async () => {
      mockDataValidator.deduplicateDisclosures.mockImplementation(
        (disclosures: Array<{ title: string; date: string; source: string }>) => {
          const seen = new Set<string>();
          const unique: Array<{ title: string; date: string; source: string }> = [];
          for (const d of disclosures) {
            const key = `${d.title}:${d.date}`;
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(d);
            }
          }
          return unique;
        },
      );

      mockOrchestrator.fetchDisclosures.mockResolvedValue({
        data: mockDisclosures,
        provider: 'kap',
        cached: false,
        timestamp: new Date().toISOString(),
      });

      const result = await engine.aggregateDisclosures('THYAO');
      expect(result).not.toBeNull();
      expect(result!.data).toHaveLength(2);
      expect(mockDataValidator.deduplicateDisclosures).toHaveBeenCalled();
    });

    it('should handle empty disclosure results', async () => {
      mockOrchestrator.fetchDisclosures.mockResolvedValue({
        data: [],
        provider: 'kap',
        cached: false,
        timestamp: new Date().toISOString(),
      });

      const result = await engine.aggregateDisclosures('THYAO');
      expect(result).not.toBeNull();
      expect(result!.data).toHaveLength(0);
    });

    it('should handle provider failure', async () => {
      mockOrchestrator.fetchDisclosures.mockRejectedValue(new Error('Network error'));

      const result = await engine.aggregateDisclosures('THYAO');
      expect(result).not.toBeNull();
      expect(result!.metadata.providersFailed).toContain('fintables');
      expect(result!.metadata.providersFailed).toContain('yahoo');
    });

    it('should cache result with 15 minute TTL', async () => {
      mockOrchestrator.fetchDisclosures.mockResolvedValue({
        data: mockDisclosures,
        provider: 'kap',
        cached: false,
        timestamp: new Date().toISOString(),
      });

      await engine.aggregateDisclosures('THYAO');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'aggregated',
        'disclosures',
        'THYAO',
        expect.any(Object),
        15 * 60 * 1000,
      );
    });
  });

  describe('circuit breaker integration', () => {
    it('should mark unhealthy providers in metadata', async () => {
      mockCircuitBreaker.isCircuitOpen.mockImplementation((name: string) => name === 'yahoo');

      mockOrchestrator.fetchCompany
        .mockResolvedValueOnce({
          data: mockCompany,
          provider: 'fintables',
          cached: false,
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          data: mockCompany,
          provider: 'yahoo',
          cached: false,
          timestamp: new Date().toISOString(),
        });

      const result = await engine.aggregateCompany('THYAO');
      expect(result).not.toBeNull();
      expect(result!.metadata.providerConfidence['fintables']).toBeGreaterThan(
        result!.metadata.providerConfidence['yahoo'],
      );
    });
  });

  describe('conflict resolution', () => {
    it('should record conflicts from conflicting data', async () => {
      const companyA = { ...mockCompany, marketCap: 500000000 };
      const companyB = { ...mockCompany, marketCap: 600000000 };

      mockOrchestrator.fetchCompany
        .mockResolvedValueOnce({
          data: companyA,
          provider: 'fintables',
          cached: false,
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          data: companyB,
          provider: 'yahoo',
          cached: false,
          timestamp: new Date().toISOString(),
        });

      mockConflictResolver.resolveNumeric.mockReturnValue({
        value: 550000000,
        resolution: 'average',
      });
      mockConflictResolver.buildConflictRecord.mockReturnValue({
        field: 'marketCap',
        values: [
          {
            provider: 'fintables',
            value: 500000000,
            priority: 1,
            timestamp: '2026-01-01T00:00:00Z',
          },
          { provider: 'yahoo', value: 600000000, priority: 2, timestamp: '2026-01-01T00:00:00Z' },
        ],
        resolution: 'average',
        chosenValue: 550000000,
      });

      const result = await engine.aggregateCompany('THYAO');
      expect(result).not.toBeNull();
      expect(result!.metadata.conflictCount).toBeGreaterThan(0);
      expect(mockConflictResolver.resolveNumeric).toHaveBeenCalled();
    });
  });
});
