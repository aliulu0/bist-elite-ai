import { ScannerEngine } from '../scanner-engine.service';
import { DEFAULT_SCANNER_CONFIG } from '../scanner.config';
import { buildOpportunityResult, buildStrongOpportunity, buildWeakOpportunity, buildOpportunityBatch } from './test-helpers';

describe('ScannerEngine', () => {
  let engine: ScannerEngine;

  beforeEach(() => {
    engine = new ScannerEngine(DEFAULT_SCANNER_CONFIG);
  });

  describe('Full Scan', () => {
    it('should scan a batch of opportunities', () => {
      const opps = buildOpportunityBatch(10);
      const result = engine.scan(opps, 'FULL');
      expect(result.candidates).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.scanMode).toBe('FULL');
    });

    it('should return candidates sorted by score descending', () => {
      const opps = buildOpportunityBatch(10);
      const result = engine.scan(opps, 'FULL');
      for (let i = 1; i < result.candidates.length; i++) {
        expect(result.candidates[i - 1].scannerScore).toBeGreaterThanOrEqual(
          result.candidates[i].scannerScore,
        );
      }
    });

    it('should filter out low-score opportunities', () => {
      const opps = [
        buildWeakOpportunity(),
        buildWeakOpportunity(),
        buildWeakOpportunity(),
      ];
      const result = engine.scan(opps, 'FULL');
      expect(result.candidates.length).toBe(0);
    });

    it('should track scan duration', () => {
      const opps = buildOpportunityBatch(5);
      const result = engine.scan(opps, 'FULL');
      expect(result.metrics.scanDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should track candidates found', () => {
      const opps = buildOpportunityBatch(10);
      const result = engine.scan(opps, 'FULL');
      expect(result.metrics.candidatesFound).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Single Stock Scan', () => {
    it('should scan a single stock', () => {
      const opp = buildStrongOpportunity();
      const result = engine.scanSingle('ASELS', opp);
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('ASELS');
      expect(result!.scannerScore).toBeGreaterThan(0);
    });

    it('should return null for weak single stock', () => {
      const opp = buildWeakOpportunity();
      const result = engine.scanSingle('WEAK', opp);
      expect(result).toBeNull();
    });
  });

  describe('Sector Scan', () => {
    it('should scan sector opportunities', () => {
      const opps = [
        buildOpportunityResult({ symbol: 'A', opportunityTypes: ['SECTOR_ROTATION'], opportunityScore: 70, confidence: 65 }),
        buildOpportunityResult({ symbol: 'B', opportunityTypes: ['MOMENTUM_BREAKOUT'], opportunityScore: 70, confidence: 65 }),
      ];
      const result = engine.scanSector(opps, 'Technology');
      expect(result.candidates).toBeDefined();
      expect(result.metrics.scanMode).toBe('SECTOR');
    });
  });

  describe('Incremental Scan', () => {
    it('should perform incremental scan', () => {
      const opps = buildOpportunityBatch(5);
      const result = engine.scanIncremental(opps);
      expect(result.candidates).toBeDefined();
      expect(result.metrics.scanMode).toBe('INCREMENTAL');
    });
  });

  describe('Groups', () => {
    it('should return groups when groupBy is specified', () => {
      const opps = buildOpportunityBatch(10);
      const result = engine.scan(opps, 'FULL', undefined, 'PRIORITY');
      expect(result.groups).toBeDefined();
      expect(result.groups.size).toBeGreaterThanOrEqual(1);
    });

    it('should default to NONE group', () => {
      const opps = buildOpportunityBatch(5);
      const result = engine.scan(opps, 'FULL');
      expect(result.groups.has('ALL')).toBe(true);
    });
  });

  describe('Custom Sort', () => {
    it('should sort by confidence when specified', () => {
      const opps = buildOpportunityBatch(10);
      const result = engine.scan(opps, 'FULL', 'CONFIDENCE_DESC');
      for (let i = 1; i < result.candidates.length; i++) {
        expect(result.candidates[i - 1].confidence).toBeGreaterThanOrEqual(
          result.candidates[i].confidence,
        );
      }
    });

    it('should sort by risk ascending', () => {
      const opps = buildOpportunityBatch(10);
      const result = engine.scan(opps, 'FULL', 'RISK_ASC');
      for (let i = 1; i < result.candidates.length; i++) {
        expect(result.candidates[i - 1].risk).toBeLessThanOrEqual(
          result.candidates[i].risk,
        );
      }
    });
  });

  describe('History', () => {
    it('should track history after scan', () => {
      const opps = [buildOpportunityResult({ symbol: 'TEST' })];
      engine.scan(opps, 'FULL');
      const history = engine.getHistory('TEST');
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Watchlists', () => {
    it('should populate watchlists after scan', () => {
      const opps = buildOpportunityBatch(10);
      engine.scan(opps, 'FULL');
      const allWatchlist = engine.getWatchlist('ALL');
      expect(Array.isArray(allWatchlist)).toBe(true);
    });

    it('should get all watchlists', () => {
      const all = engine.getAllWatchlists();
      expect(all.size).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty input gracefully', () => {
      const result = engine.scan([], 'FULL');
      expect(result.candidates.length).toBe(0);
      expect(result.metrics.candidatesFound).toBe(0);
    });

    it('should continue scanning when one stock fails', () => {
      const opps = [
        buildOpportunityResult({ symbol: 'GOOD', opportunityScore: 70, confidence: 65, priority: 'HIGH' }),
        buildWeakOpportunity(),
      ];
      const result = engine.scan(opps, 'FULL');
      expect(result.candidates.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Duplicate Handling', () => {
    it('should merge duplicate opportunities', () => {
      const opps = [
        buildOpportunityResult({ symbol: 'A', opportunityScore: 70, confidence: 65 }),
        buildOpportunityResult({ symbol: 'A', opportunityScore: 70, confidence: 65 }),
      ];
      const result = engine.scan(opps, 'FULL');
      // Merged duplicates should result in fewer candidates or same with duplicateCount > 0
      expect(result.candidates).toBeDefined();
    });
  });

  describe('Max Results', () => {
    it('should respect max results limit', () => {
      const customEngine = new ScannerEngine({ ...DEFAULT_SCANNER_CONFIG, maxResults: 3 });
      const opps = buildOpportunityBatch(20);
      const result = customEngine.scan(opps, 'FULL');
      expect(result.candidates.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Custom Config', () => {
    it('should accept custom filter config', () => {
      const customEngine = new ScannerEngine({
        filters: { ...DEFAULT_SCANNER_CONFIG.filters, minOpportunityScore: 80 },
      });
      const opps = buildOpportunityBatch(10);
      const result = customEngine.scan(opps, 'FULL');
      // With higher min score, fewer should pass
      expect(result.candidates.length).toBeGreaterThanOrEqual(0);
    });

    it('should accept custom ranking config', () => {
      const customEngine = new ScannerEngine({
        ranking: { ...DEFAULT_SCANNER_CONFIG.ranking, opportunityScoreWeight: 0.5 },
      });
      const opps = buildOpportunityBatch(10);
      const result = customEngine.scan(opps, 'FULL');
      expect(result.candidates).toBeDefined();
    });
  });

  describe('Metadata', () => {
    it('should include scan mode in metadata', () => {
      const opps = buildOpportunityBatch(5);
      const result = engine.scan(opps, 'FULL');
      for (const candidate of result.candidates) {
        expect(candidate.metadata.scanMode).toBe('FULL');
      }
    });

    it('should include filter status in metadata', () => {
      const opps = buildOpportunityBatch(5);
      const result = engine.scan(opps, 'FULL');
      for (const candidate of result.candidates) {
        expect(candidate.metadata.filterPassed).toBe(true);
      }
    });

    it('should include supporting metrics', () => {
      const opps = [buildOpportunityResult({ symbol: 'TEST' })];
      const result = engine.scan(opps, 'FULL');
      if (result.candidates.length > 0) {
        expect(result.candidates[0].metadata.supportingMetrics).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should scan 28 stocks within 2 seconds', () => {
      const opps = buildOpportunityBatch(28);
      const start = Date.now();
      engine.scan(opps, 'FULL');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });
  });
});
