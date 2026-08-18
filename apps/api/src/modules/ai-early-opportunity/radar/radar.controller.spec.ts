import { RadarController } from './radar.controller';
import { RadarService } from './radar.service';
import { OpportunityRadarSnapshot, OpportunityRadarItem } from './radar.types';
import { RadarState } from './radar.types';

const FIXED_TIMESTAMP = '2026-08-12T15:00:00.000Z';

function makeItem(overrides: Partial<OpportunityRadarItem> = {}): OpportunityRadarItem {
  return {
    ticker: 'THYAO',
    company: 'Türk Hava Yolları',
    sector: 'Industrials',
    state: 'NEW',
    current: {
      earlyOpportunityScore: 65,
      eliteScore: 70,
      signalConvergence: 70,
      confidence: 60,
      expectedReturn: 12,
      risk: 'medium',
      smartMoneyScore: 65,
      catalystScore: 70,
      fundamentalScore: 80,
      dataQualityScore: 90,
      predictionConfidence: 65,
      timeframeAgreement: 70,
      entryZone: { min: 95, max: 105 },
      decisionScore: 65,
      decisionStatus: 'EARLY_OPPORTUNITY',
      earlyOpportunity: true,
      dataTimestamp: FIXED_TIMESTAMP,
    },
    previous: null,
    scoreChange: null,
    changes: [],
    reasons: ['Yeni erken fırsat: skor 65, karar EARLY_OPPORTUNITY.'],
    radarPriority: 65,
    dataFreshness: 'fresh',
    providerStatus: 'yahoo',
    decision: null,
    evaluatedAt: FIXED_TIMESTAMP,
    ...overrides,
  };
}

function makeSnapshot(
  items: Record<string, OpportunityRadarItem> = { THYAO: makeItem() },
): OpportunityRadarSnapshot {
  return {
    timestamp: FIXED_TIMESTAMP,
    marketSession: 'OPEN',
    marketSessionLabel: 'Açık',
    freshnessNote: 'Piyasa açık.',
    symbolsEvaluated: 1,
    activeOpportunities: 1,
    newOpportunities: ['THYAO'],
    strengtheningOpportunities: [],
    weakeningOpportunities: [],
    invalidatedOpportunities: [],
    confirmedOpportunities: [],
    items,
    providerCallStats: {
      providerCalls: 1,
      cacheHits: 0,
      cheapScans: 1,
      deepAnalyses: 1,
      symbolsEvaluated: 1,
      candidates: 1,
      skipped: 0,
      errors: 0,
    },
    dataQualitySummary: { averageScore: 90, warnings: [] },
    executionDurationMs: 100,
    generatedAt: FIXED_TIMESTAMP,
  };
}

describe('RadarController', () => {
  let controller: RadarController;
  let mockService: jest.Mocked<RadarService>;

  beforeEach(() => {
    mockService = {
      runRadar: jest.fn(),
      getTop: jest.fn(),
      getStatus: jest.fn(),
      getTickerDetail: jest.fn(),
      getTickerExplain: jest.fn(),
      getTicker: jest.fn(),
      hasSnapshot: jest.fn(),
      getEvents: jest.fn(),
    } as any;
    controller = new RadarController(mockService);
  });

  describe('run', () => {
    it('returns run summary with provider stats', async () => {
      const snap = makeSnapshot();
      mockService.runRadar.mockResolvedValue(snap);
      const res = await controller.run({ forceRefresh: true });
      expect(res.success).toBe(true);
      expect(res.symbolsEvaluated).toBe(1);
      expect(res.providerCallStats.providerCalls).toBe(1);
    });
  });

  describe('getTop', () => {
    it('returns filtered items with pagination', () => {
      mockService.getTop.mockReturnValue({
        items: [makeItem()],
        total: 1,
        hasSnapshot: true,
      });
      const res = controller.getTop(
        '10',
        '50',
        'NEW',
        'Industrials',
        '80',
        '60',
        '50',
        'medium',
        '10',
        '1d',
      );
      expect(res.items.length).toBe(1);
      expect(res.hasSnapshot).toBe(true);
    });

    it('returns empty when no snapshot', () => {
      mockService.getTop.mockReturnValue({ items: [], total: 0, hasSnapshot: false });
      const res = controller.getTop();
      expect(res.items).toEqual([]);
      expect(res.hasSnapshot).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('returns status with hasSnapshot and recent events', () => {
      mockService.getStatus.mockReturnValue({
        running: false,
        lastRun: FIXED_TIMESTAMP,
        lastSuccessfulRun: FIXED_TIMESTAMP,
        lastDurationMs: 100,
        symbolsEvaluated: 1,
        candidates: 1,
        opportunities: { NEW: 1, STRENGTHENING: 0, CONFIRMED: 0, WEAKENING: 0, INVALIDATED: 0 },
        providerCalls: 1,
        cacheHits: 0,
        dataQualityWarnings: [],
        errors: 0,
        hasSnapshot: false,
      });
      mockService.hasSnapshot.mockReturnValue(true);
      mockService.getEvents.mockReturnValue([]);
      const res = controller.getStatus();
      expect(res.hasSnapshot).toBe(true);
      expect(res.running).toBe(false);
    });
  });

  describe('explain', () => {
    it('returns Turkish explanation for ticker', () => {
      mockService.getTickerExplain.mockReturnValue(
        'THYAO erken fırsatı YENİ. Skor 65. Yeni erken fırsat: skor 65, karar EARLY_OPPORTUNITY.',
      );
      const res = controller.explain('THYAO');
      expect(res.ticker).toBe('THYAO');
      expect(res.explanation).toContain('THYAO erken fırsatı YENİ');
    });
  });

  describe('getTicker', () => {
    it('returns ticker detail with score history', () => {
      const detail = {
        item: makeItem(),
        previousState: null,
        scoreHistory: [
          { timestamp: '2026-08-10T00:00:00.000Z', score: 60, state: 'NEW' as RadarState },
          { timestamp: '2026-08-11T00:00:00.000Z', score: 65, state: 'NEW' as RadarState },
        ],
      };
      mockService.getTickerDetail.mockReturnValue(detail);
      const res = controller.getTicker('THYAO');
      expect(res.item.ticker).toBe('THYAO');
      expect(res.scoreHistory.length).toBe(2);
    });
  });
});
