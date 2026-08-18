import { OpportunityRadarService } from './opportunity-radar.service';
import {
  ScannerRankingSnapshot,
  ScannerRankingResultEntry,
  OpportunityRadarEvent,
} from './daily-scan.types';
import { DEFAULT_DAILY_SCAN_CONFIG } from './daily-scan.config';

function makeEntry(overrides: Partial<ScannerRankingResultEntry>): ScannerRankingResultEntry {
  const symbol = overrides.symbol ?? 'THYAO';
  return {
    symbol,
    currentPrice: 100,
    eliteScore: 60,
    financialScore: 50,
    technicalScore: 50,
    confluenceScore: 50,
    smartMoneyScore: 0,
    marketStructureScore: 50,
    multiTimeframeConfluence: 'MODERATE',
    multiTimeframeScore: 60,
    earlyOpportunityClassification: 'NO_SIGNAL',
    scannerSignalQuality: 'MEDIUM',
    marketRegime: 'BULL',
    volumeStatus: 'MODERATE',
    relativeVolume20: 1.0,
    volumeSpike: false,
    breakoutStatus: 'NO_BREAKOUT',
    momentumStatus: 'NEUTRAL',
    momentum5D: 0.01,
    relativeStrength: null,
    rank: 1,
    status: 'REJECTED',
    dataStatus: 'AVAILABLE',
    sourceProvenance: {
      symbol,
      provider: 'Yahoo',
      timeframe: '1d',
      retrievedAt: '2026-01-01T00:00:00.000Z',
      marketTimestamp: '2026-01-01T00:00:00.000Z',
      source: 'REAL',
      validationStatus: 'VALID',
    },
    ...overrides,
  };
}

function makeSnapshot(
  entries: ScannerRankingResultEntry[],
  overrides: Partial<ScannerRankingSnapshot> = {},
): ScannerRankingSnapshot {
  return {
    scanId: 'scan-1',
    scanTimestamp: '2026-01-01T00:00:00.000Z',
    marketTimestamp: '2026-01-01T00:00:00.000Z',
    version: '1.0.0',
    schemaVersion: 1,
    status: 'COMPLETE',
    universeSize: 10,
    equityCandidateCount: 10,
    evaluatedCount: entries.length,
    eligibleCount: 0,
    signalCount: 0,
    availableCount: entries.length,
    unavailableCount: 0,
    rateLimitedCount: 0,
    failedCount: 0,
    results: entries,
    providerSummary: [],
    dataQuality: 'VALID',
    coverage: 'FULL',
    executionDurationMs: 100,
    ...overrides,
  };
}

const CONFIG = { radarEventThresholds: DEFAULT_DAILY_SCAN_CONFIG.radarEventThresholds };

describe('OpportunityRadarService', () => {
  let radar: OpportunityRadarService;

  beforeEach(() => {
    radar = new OpportunityRadarService();
  });

  describe('rankEntries', () => {
    it('sorts by eliteScore descending', () => {
      const a = makeEntry({ symbol: 'A', eliteScore: 70 });
      const b = makeEntry({ symbol: 'B', eliteScore: 85 });
      const c = makeEntry({ symbol: 'C', eliteScore: 40 });
      const ranked = radar.rankEntries([a, b, c]);
      expect(ranked.map((r) => r.symbol)).toEqual(['B', 'A', 'C']);
    });

    it('breaks ties by multiTimeframeScore', () => {
      const a = makeEntry({ symbol: 'A', eliteScore: 70, multiTimeframeScore: 50 });
      const b = makeEntry({ symbol: 'B', eliteScore: 70, multiTimeframeScore: 80 });
      const ranked = radar.rankEntries([a, b]);
      expect(ranked.map((r) => r.symbol)).toEqual(['B', 'A']);
    });

    it('does not mutate the input array order (returns a new sorted copy)', () => {
      const a = makeEntry({ symbol: 'A', eliteScore: 70 });
      const b = makeEntry({ symbol: 'B', eliteScore: 85 });
      const input = [a, b];
      radar.rankEntries(input);
      expect(input.map((r) => r.symbol)).toEqual(['A', 'B']);
    });
  });

  describe('compareSnapshots', () => {
    it('marks PRESENT / NOT_PRESENT / REMOVED transitions', () => {
      const prev = makeSnapshot(
        [makeEntry({ symbol: 'A', rank: 1 }), makeEntry({ symbol: 'B', rank: 2 })],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot(
        [makeEntry({ symbol: 'A', rank: 2 }), makeEntry({ symbol: 'C', rank: 1 })],
        { scanId: 'curr-1' },
      );

      const comparison = radar.compareSnapshots(prev, curr);
      const bySymbol = new Map(comparison.entries.map((e) => [e.symbol, e]));
      expect(bySymbol.get('A')!.transition).toBe('PRESENT');
      expect(bySymbol.get('B')!.transition).toBe('REMOVED');
      expect(bySymbol.get('C')!.transition).toBe('NOT_PRESENT');
    });

    it('computes rankDelta and eliteScoreDelta for PRESENT symbols', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', rank: 1, eliteScore: 60 })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', rank: 3, eliteScore: 75 })], {
        scanId: 'curr-1',
      });

      const comparison = radar.compareSnapshots(prev, curr);
      const entry = comparison.entries[0];
      expect(entry.rankDelta).toBe(2);
      expect(entry.eliteScoreDelta).toBe(15);
    });

    it('returns null deltas when a symbol only exists in one scan', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', rank: 1 })], { scanId: 'prev-1' });
      const curr = makeSnapshot([], { scanId: 'curr-1' });
      const comparison = radar.compareSnapshots(prev, curr);
      expect(comparison.entries[0].rankDelta).toBeNull();
      expect(comparison.entries[0].eliteScoreDelta).toBeNull();
    });
  });

  describe('detectRadarEvents', () => {
    it('emits NEW_OPPORTUNITY when a symbol enters an opportunity state', () => {
      const prev = makeSnapshot(
        [makeEntry({ symbol: 'A', earlyOpportunityClassification: 'NO_SIGNAL' })],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot(
        [makeEntry({ symbol: 'A', earlyOpportunityClassification: 'MOMENTUM' })],
        { scanId: 'curr-1' },
      );

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'NEW_OPPORTUNITY' && e.symbol === 'A')).toBe(true);
    });

    it('does not emit NEW_OPPORTUNITY on the first scan (no previous)', () => {
      const curr = makeSnapshot(
        [makeEntry({ symbol: 'A', earlyOpportunityClassification: 'MOMENTUM' })],
        { scanId: 'curr-1' },
      );

      const events = radar.detectRadarEvents(null, curr, CONFIG);
      expect(events.some((e) => e.type === 'NEW_OPPORTUNITY')).toBe(false);
    });

    it('emits SCORE_SURGE when eliteScore rises above the surge threshold', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 50, rank: 1 })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 70, rank: 1 })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'SCORE_SURGE' && e.symbol === 'A')).toBe(true);
    });

    it('does not emit SCORE_SURGE for a small rise', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 50, rank: 1 })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 54, rank: 1 })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'SCORE_SURGE')).toBe(false);
    });

    it('emits OPPORTUNITY_STRENGTHENING on a meaningful score rise with same/better class', () => {
      const prev = makeSnapshot(
        [
          makeEntry({
            symbol: 'A',
            eliteScore: 60,
            earlyOpportunityClassification: 'MOMENTUM',
            rank: 1,
          }),
        ],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot(
        [
          makeEntry({
            symbol: 'A',
            eliteScore: 68,
            earlyOpportunityClassification: 'MOMENTUM',
            rank: 1,
          }),
        ],
        { scanId: 'curr-1' },
      );

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'OPPORTUNITY_STRENGTHENING')).toBe(true);
    });

    it('emits RANK_IMPROVEMENT and RANK_DETERIORATION with position deltas', () => {
      const prev = makeSnapshot(
        [makeEntry({ symbol: 'A', rank: 5 }), makeEntry({ symbol: 'B', rank: 1 })],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot(
        [makeEntry({ symbol: 'A', rank: 1 }), makeEntry({ symbol: 'B', rank: 8 })],
        { scanId: 'curr-1' },
      );

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'RANK_IMPROVEMENT' && e.symbol === 'A')).toBe(true);
      expect(events.some((e) => e.type === 'RANK_DETERIORATION' && e.symbol === 'B')).toBe(true);
    });

    it('emits VOLUME_EXPANSION when relativeVolume20 crosses the threshold', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', relativeVolume20: 1.2 })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', relativeVolume20: 1.8 })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'VOLUME_EXPANSION')).toBe(true);
    });

    it('does not emit VOLUME_EXPANSION without real relativeVolume20', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', relativeVolume20: null })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', relativeVolume20: null })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'VOLUME_EXPANSION')).toBe(false);
    });

    it('emits MOMENTUM_ACCELERATION when momentum5D accelerates', () => {
      const prev = makeSnapshot(
        [makeEntry({ symbol: 'A', momentum5D: 0.01, momentumStatus: 'POSITIVE' })],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot(
        [makeEntry({ symbol: 'A', momentum5D: 0.05, momentumStatus: 'ACCELERATING' })],
        { scanId: 'curr-1' },
      );

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'MOMENTUM_ACCELERATION')).toBe(true);
    });

    it('emits BREAKOUT_DEVELOPING when breakout status develops', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', breakoutStatus: 'NO_BREAKOUT' })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', breakoutStatus: 'PRE_BREAKOUT' })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'BREAKOUT_DEVELOPING')).toBe(true);
    });

    it('emits MULTI_TIMEFRAME_ALIGNMENT when confluence reaches the target', () => {
      const prev = makeSnapshot(
        [makeEntry({ symbol: 'A', multiTimeframeConfluence: 'MODERATE' })],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot([makeEntry({ symbol: 'A', multiTimeframeConfluence: 'STRONG' })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'MULTI_TIMEFRAME_ALIGNMENT')).toBe(true);
    });

    it('emits SIGNAL_WEAKENING on a large score drop', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 80, rank: 1 })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 60, rank: 2 })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'SIGNAL_WEAKENING')).toBe(true);
    });

    it('emits SIGNAL_LOST when an opportunity falls out of the opportunity states', () => {
      const prev = makeSnapshot(
        [makeEntry({ symbol: 'A', earlyOpportunityClassification: 'MOMENTUM', rank: 1 })],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot(
        [makeEntry({ symbol: 'A', earlyOpportunityClassification: 'NO_SIGNAL', rank: 2 })],
        { scanId: 'curr-1' },
      );

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'SIGNAL_LOST')).toBe(true);
    });

    it('emits DATA_QUALITY_DETERIORATION when data status degrades', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', dataStatus: 'AVAILABLE' })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', dataStatus: 'PARTIALLY_AVAILABLE' })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'DATA_QUALITY_DETERIORATION')).toBe(true);
    });

    it('emits DATA_BECAME_UNAVAILABLE when data is lost', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', dataStatus: 'AVAILABLE' })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', dataStatus: 'UNAVAILABLE' })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'DATA_BECAME_UNAVAILABLE')).toBe(true);
    });

    it('emits DATA_BECAME_AVAILABLE only when a previous scan exists', () => {
      const prev = makeSnapshot([], { scanId: 'prev-1' });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', dataStatus: 'AVAILABLE' })], {
        scanId: 'curr-1',
      });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'DATA_BECAME_AVAILABLE' && e.symbol === 'A')).toBe(true);

      const firstScanEvents = radar.detectRadarEvents(null, curr, CONFIG);
      expect(firstScanEvents.some((e) => e.type === 'DATA_BECAME_AVAILABLE')).toBe(false);
    });

    it('never emits DNA_RELEVANCE (AHT/DNA engine not implemented)', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A' })], { scanId: 'prev-1' });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 99, rank: 1 })], {
        scanId: 'curr-1',
      });
      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(events.some((e) => e.type === 'DNA_RELEVANCE')).toBe(false);
    });

    it('produces no duplicate (symbol, type) pairs within a single scan', () => {
      const prev = makeSnapshot(
        [
          makeEntry({ symbol: 'A', eliteScore: 40, rank: 10 }),
          makeEntry({ symbol: 'B', eliteScore: 40, rank: 11 }),
        ],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot(
        [
          makeEntry({ symbol: 'A', eliteScore: 90, rank: 1 }),
          makeEntry({ symbol: 'B', eliteScore: 90, rank: 2 }),
        ],
        { scanId: 'curr-1' },
      );

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      const seen = new Set<string>();
      for (const event of events) {
        const key = `${event.symbol}:${event.type}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });

    it('is deterministic: identical inputs produce identical outputs', () => {
      const prev = makeSnapshot(
        [
          makeEntry({ symbol: 'A', eliteScore: 40, rank: 10 }),
          makeEntry({ symbol: 'B', eliteScore: 50, rank: 9 }),
        ],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot(
        [
          makeEntry({ symbol: 'A', eliteScore: 90, rank: 1 }),
          makeEntry({ symbol: 'B', eliteScore: 60, rank: 5 }),
        ],
        { scanId: 'curr-1' },
      );

      const first = radar.detectRadarEvents(prev, curr, CONFIG);
      const second = radar.detectRadarEvents(prev, curr, CONFIG);
      expect(second).toEqual(first);
    });

    it('sets LOW confidence for single-source (Yahoo-only) real data', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 40, rank: 10 })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 90, rank: 1 })], {
        scanId: 'curr-1',
      });
      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      const surge = events.find((e) => e.type === 'SCORE_SURGE');
      expect(surge?.confidence).toBe('LOW');
    });

    it('sets UNAVAILABLE confidence when provenance source is UNAVAILABLE', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 40, rank: 10 })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot(
        [
          makeEntry({
            symbol: 'A',
            eliteScore: 90,
            rank: 1,
            dataStatus: 'UNAVAILABLE',
            sourceProvenance: {
              symbol: 'A',
              provider: 'Yahoo',
              timeframe: '1d',
              retrievedAt: '2026-01-01T00:00:00.000Z',
              marketTimestamp: '2026-01-01T00:00:00.000Z',
              source: 'UNAVAILABLE',
              validationStatus: 'INVALID',
            },
          }),
        ],
        { scanId: 'curr-1' },
      );

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      const event = events.find((e) => e.type === 'DATA_BECAME_UNAVAILABLE');
      expect(event?.confidence).toBe('UNAVAILABLE');
    });

    it('preserves the scanId on every emitted event', () => {
      const prev = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 40, rank: 10 })], {
        scanId: 'prev-1',
      });
      const curr = makeSnapshot([makeEntry({ symbol: 'A', eliteScore: 90, rank: 1 })], {
        scanId: 'curr-1',
      });
      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      for (const event of events) {
        expect(event.scanId).toBe('curr-1');
      }
    });

    it('marks removed opportunities with SIGNAL_LOST when they vanish from results', () => {
      const prev = makeSnapshot(
        [makeEntry({ symbol: 'A', earlyOpportunityClassification: 'MOMENTUM', rank: 1 })],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot([makeEntry({ symbol: 'B', rank: 1 })], { scanId: 'curr-1' });

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      const lost = events.find((e) => e.type === 'SIGNAL_LOST' && e.symbol === 'A');
      expect(lost).toBeDefined();
      expect(lost!.currentState).toBeNull();
    });

    it('sorts events by symbol then type', () => {
      const prev = makeSnapshot(
        [
          makeEntry({ symbol: 'B', eliteScore: 40, rank: 10 }),
          makeEntry({ symbol: 'A', eliteScore: 40, rank: 10 }),
        ],
        { scanId: 'prev-1' },
      );
      const curr = makeSnapshot(
        [
          makeEntry({ symbol: 'A', eliteScore: 90, rank: 1 }),
          makeEntry({ symbol: 'B', eliteScore: 90, rank: 1 }),
        ],
        { scanId: 'curr-1' },
      );

      const events = radar.detectRadarEvents(prev, curr, CONFIG);
      const sorted = [...events].sort((a, b) => {
        if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
        return a.type.localeCompare(b.type);
      });
      expect(events).toEqual(sorted);
    });
  });
});
