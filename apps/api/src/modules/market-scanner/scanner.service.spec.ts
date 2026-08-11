import { ScannerService } from './scanner.service';
import { MarketScannerEngine } from './market-scanner.engine';
import { SymbolAnalysis, RankedSymbol } from './market-scanner.types';

function makeSymbolAnalysis(overrides?: Partial<SymbolAnalysis>): SymbolAnalysis {
  return {
    symbol: 'THYAO',
    eliteScore: 80,
    eliteRating: 'AA',
    elitePriority: 'HIGH',
    opportunityLevel: 'HIGH',
    opportunityScore: 70,
    candidate: true,
    candidateScore: 65,
    candidatePriority: 'HIGH',
    financialScore: 75,
    technicalScore: 60,
    smartMoneyScore: 55,
    confluenceScore: 70,
    marketStructureScore: 50,
    confidence: 0.8,
    earlyOpportunity: false,
    reasons: ['Strong fundamentals'],
    riskFactors: ['Market risk'],
    ...overrides,
  };
}

function makeSymbols(count: number): SymbolAnalysis[] {
  const symbols = ['THYAO', 'GARAN', 'ASELS', 'EREGL', 'TUPRS'];
  return Array.from({ length: count }, (_, i) =>
    makeSymbolAnalysis({
      symbol: symbols[i % symbols.length],
      eliteScore: 90 - i * 8,
      opportunityScore: 80 - i * 7,
      candidateScore: 75 - i * 6,
    }),
  );
}

describe('ScannerService', () => {
  let service: ScannerService;
  let engine: MarketScannerEngine;

  beforeEach(() => {
    engine = new MarketScannerEngine();
    service = new ScannerService(engine);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runScan', () => {
    it('should run scan and store result', () => {
      const result = service.runScan(makeSymbols(5));
      expect(result.topCandidates).toBeDefined();
      expect(service.getResult()).toBeDefined();
    });

    it('should return scan result', () => {
      const result = service.runScan(makeSymbols(3));
      expect(result.statistics.totalSymbols).toBe(3);
    });
  });

  describe('getResult', () => {
    it('should return null before first scan', () => {
      expect(service.getResult()).toBeNull();
    });

    it('should return result after scan', () => {
      service.runScan(makeSymbols(2));
      expect(service.getResult()).not.toBeNull();
    });
  });

  describe('getTopCandidates', () => {
    it('should return paginated top candidates', () => {
      service.runScan(makeSymbols(5));
      const result = service.getTopCandidates(0, 2);
      expect(result.items.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeDefined();
    });

    it('should sort by compositeScore desc by default', () => {
      service.runScan(makeSymbols(5));
      const result = service.getTopCandidates();
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i - 1].compositeScore).toBeGreaterThanOrEqual(result.items[i].compositeScore);
      }
    });

    it('should sort by eliteScore asc when specified', () => {
      service.runScan(makeSymbols(5));
      const result = service.getTopCandidates(0, 10, 'eliteScore', 'asc');
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i - 1].eliteScore).toBeLessThanOrEqual(result.items[i].eliteScore);
      }
    });

    it('should return empty when no scan data', () => {
      const result = service.getTopCandidates();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getWatchlist', () => {
    it('should return paginated watchlist', () => {
      service.runScan(makeSymbols(5));
      const result = service.getWatchlist(0, 2);
      expect(result.items.length).toBeLessThanOrEqual(2);
    });

    it('should return empty when no scan data', () => {
      const result = service.getWatchlist();
      expect(result.items).toEqual([]);
    });
  });

  describe('getRejected', () => {
    it('should return paginated rejected', () => {
      service.runScan(makeSymbols(5));
      const result = service.getRejected(0, 2);
      expect(result.items.length).toBeLessThanOrEqual(2);
    });

    it('should return empty when no scan data', () => {
      const result = service.getRejected();
      expect(result.items).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics after scan', () => {
      service.runScan(makeSymbols(5));
      const stats = service.getStatistics();
      expect(stats).not.toBeNull();
      expect(stats!.totalSymbols).toBe(5);
    });

    it('should return null before scan', () => {
      expect(service.getStatistics()).toBeNull();
    });
  });

  describe('pagination', () => {
    it('should respect offset', () => {
      service.runScan(makeSymbols(5));
      const page1 = service.getTopCandidates(0, 2);
      const page2 = service.getTopCandidates(2, 2);
      expect(page1.items[0].symbol).not.toBe(page2.items[0]?.symbol);
    });

    it('should respect limit', () => {
      service.runScan(makeSymbols(5));
      const result = service.getTopCandidates(0, 1);
      expect(result.items.length).toBe(1);
    });
  });
});
