import { MarketScannerEngine } from './market-scanner.engine';
import { SymbolAnalysis, RankedSymbol } from './market-scanner.types';
import { DEFAULT_MARKET_SCANNER_CONFIG } from './market-scanner.config';

function makeSymbol(overrides?: Partial<SymbolAnalysis>): SymbolAnalysis {
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
    riskFactors: ['High beta'],
    ...overrides,
  };
}

function makeSymbols(count: number, baseOverrides?: Partial<SymbolAnalysis>): SymbolAnalysis[] {
  const symbols = ['THYAO', 'GARAN', 'ASELS', 'EREGL', 'TUPRS', 'SISE', 'BIMAS', 'KCHOL', 'SAHOL', 'AKBNK'];
  return Array.from({ length: count }, (_, i) =>
    makeSymbol({
      symbol: symbols[i % symbols.length] + (i >= symbols.length ? i : ''),
      eliteScore: 90 - i * 8,
      eliteRating: (['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'] as const)[Math.min(i, 7)],
      opportunityScore: 80 - i * 7,
      candidateScore: 75 - i * 6,
      financialScore: 80 - i * 5,
      technicalScore: 70 - i * 5,
      smartMoneyScore: 65 - i * 5,
      ...baseOverrides,
    }),
  );
}

describe('MarketScannerEngine', () => {
  let engine: MarketScannerEngine;

  beforeEach(() => {
    engine = new MarketScannerEngine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('empty and null data', () => {
    it('should return empty result for null input', () => {
      const result = engine.scan(null as any);
      expect(result.topCandidates).toEqual([]);
      expect(result.watchlist).toEqual([]);
      expect(result.rejected).toEqual([]);
      expect(result.statistics.totalSymbols).toBe(0);
    });

    it('should return empty result for empty array', () => {
      const result = engine.scan([]);
      expect(result.topCandidates).toEqual([]);
      expect(result.statistics.totalSymbols).toBe(0);
    });
  });

  describe('ranking and classification', () => {
    it('should classify high-scoring symbols as top candidates', () => {
      const result = engine.scan([makeSymbol({ eliteScore: 90, opportunityLevel: 'VERY_HIGH', candidateScore: 85 })]);
      expect(result.topCandidates.length).toBe(1);
      expect(result.topCandidates[0].status).toBe('TOP_CANDIDATE');
    });

    it('should classify medium symbols as watchlist', () => {
      const result = engine.scan([makeSymbol({ eliteScore: 50, opportunityLevel: 'MEDIUM', candidateScore: 30 })]);
      expect(result.watchlist.length).toBe(1);
      expect(result.watchlist[0].status).toBe('WATCHLIST');
    });

    it('should classify low symbols as rejected', () => {
      const result = engine.scan([makeSymbol({ eliteScore: 20, opportunityLevel: 'NONE', candidateScore: 15 })]);
      expect(result.rejected.length).toBe(1);
      expect(result.rejected[0].status).toBe('REJECTED');
    });

    it('should rank by composite score descending', () => {
      const result = engine.scan(makeSymbols(5));
      for (let i = 1; i < result.topCandidates.length; i++) {
        expect(result.topCandidates[i - 1].compositeScore).toBeGreaterThanOrEqual(
          result.topCandidates[i].compositeScore,
        );
      }
    });

    it('should assign sequential ranks', () => {
      const result = engine.scan(makeSymbols(3));
      result.topCandidates.forEach((s, i) => {
        expect(s.rank).toBe(i + 1);
      });
    });
  });

  describe('filtering', () => {
    it('should respect maxTopCandidates limit', () => {
      const config = { maxTopCandidates: 3 };
      const eng = new MarketScannerEngine(config);
      const result = eng.scan(makeSymbols(8));
      expect(result.topCandidates.length).toBeLessThanOrEqual(3);
    });

    it('should respect maxWatchlist limit', () => {
      const config = { maxWatchlist: 2 };
      const eng = new MarketScannerEngine(config);
      const result = eng.scan(makeSymbols(10));
      expect(result.watchlist.length).toBeLessThanOrEqual(2);
    });

    it('should overflow to rejected when lists are full', () => {
      const config = { maxTopCandidates: 1, maxWatchlist: 1 };
      const eng = new MarketScannerEngine(config);
      const result = eng.scan(makeSymbols(5));
      expect(result.rejected.length).toBeGreaterThan(0);
    });
  });

  describe('statistics', () => {
    it('should compute total symbols', () => {
      const result = engine.scan(makeSymbols(5));
      expect(result.statistics.totalSymbols).toBe(5);
    });

    it('should compute counts per category', () => {
      const result = engine.scan(makeSymbols(10));
      expect(result.statistics.topCandidateCount + result.statistics.watchlistCount + result.statistics.rejectedCount).toBe(10);
    });

    it('should compute average elite score', () => {
      const result = engine.scan(makeSymbols(3));
      expect(result.statistics.avgEliteScore).toBeGreaterThan(0);
    });

    it('should compute average opportunity score', () => {
      const result = engine.scan(makeSymbols(3));
      expect(result.statistics.avgOpportunityScore).toBeGreaterThan(0);
    });

    it('should compute average candidate score', () => {
      const result = engine.scan(makeSymbols(3));
      expect(result.statistics.avgCandidateScore).toBeGreaterThan(0);
    });

    it('should compute score distribution by rating', () => {
      const result = engine.scan(makeSymbols(5));
      const total = Object.values(result.statistics.scoreDistribution).reduce((a, b) => a + b, 0);
      expect(total).toBe(5);
    });
  });

  describe('composite score', () => {
    it('should weight elite score highest by default', () => {
      const highElite = makeSymbol({ symbol: 'A', eliteScore: 95, opportunityScore: 80, candidateScore: 80 });
      const highOpp = makeSymbol({ symbol: 'B', eliteScore: 30, opportunityScore: 95, candidateScore: 80 });
      const result = engine.scan([highOpp, highElite]);
      expect(result.topCandidates[0].symbol).toBe(highElite.symbol);
    });

    it('should use configurable weights', () => {
      const eng = new MarketScannerEngine({
        compositeWeights: { elite: 0.1, opportunity: 0.5, candidate: 0.1, financial: 0.1, technical: 0.1, smartMoney: 0.1 },
        minEliteScore: 20,
        minCandidateScore: 20,
        minOpportunityScore: 20,
      });
      const highElite = makeSymbol({ symbol: 'A', eliteScore: 95, opportunityScore: 30, candidateScore: 30 });
      const highOpp = makeSymbol({ symbol: 'B', eliteScore: 30, opportunityScore: 95, candidateScore: 30 });
      const result = eng.scan([highOpp, highElite]);
      const allRanked = [...result.topCandidates, ...result.watchlist, ...result.rejected];
      expect(allRanked[0].symbol).toBe(highOpp.symbol);
    });
  });

  describe('edge cases', () => {
    it('should handle single symbol', () => {
      const result = engine.scan([makeSymbol()]);
      expect(result.topCandidates.length + result.watchlist.length + result.rejected.length).toBe(1);
    });

    it('should handle all symbols rejected', () => {
      const result = engine.scan([
        makeSymbol({ eliteScore: 5, opportunityLevel: 'NONE', candidateScore: 5 }),
        makeSymbol({ eliteScore: 10, opportunityLevel: 'NONE', candidateScore: 8 }),
      ]);
      expect(result.topCandidates.length).toBe(0);
      expect(result.watchlist.length).toBe(0);
      expect(result.rejected.length).toBe(2);
    });

    it('should handle all symbols as top candidates', () => {
      const eng = new MarketScannerEngine({ maxTopCandidates: 100 });
      const symbols = Array.from({ length: 5 }, (_, i) =>
        makeSymbol({ symbol: `SYM${i}`, eliteScore: 90, opportunityScore: 80, candidateScore: 75 }),
      );
      const result = eng.scan(symbols);
      expect(result.topCandidates.length).toBe(5);
    });

    it('should produce deterministic results', () => {
      const input = makeSymbols(5);
      const r1 = engine.scan(input);
      const r2 = engine.scan(input);
      expect(r1.topCandidates.map((s) => s.symbol)).toEqual(r2.topCandidates.map((s) => s.symbol));
      expect(r1.statistics.avgEliteScore).toBe(r2.statistics.avgEliteScore);
    });

    it('should include metadata with scannedAt timestamp', () => {
      const result = engine.scan(makeSymbols(2));
      expect(result.metadata.scannedAt).toBeDefined();
    });
  });

  describe('config profiles', () => {
    it('should accept custom minEliteScore threshold', () => {
      const eng = new MarketScannerEngine({ minEliteScore: 95 });
      const result = eng.scan([makeSymbol({ eliteScore: 80, opportunityLevel: 'HIGH', candidateScore: 70 })]);
      expect(result.topCandidates.length).toBe(0);
    });

    it('should accept custom minOpportunityScore threshold', () => {
      const eng = new MarketScannerEngine({ minOpportunityScore: 90 });
      const result = eng.scan([makeSymbol({ eliteScore: 80, opportunityLevel: 'HIGH', opportunityScore: 70, candidateScore: 70 })]);
      expect(result.topCandidates.length).toBe(0);
    });
  });
});
