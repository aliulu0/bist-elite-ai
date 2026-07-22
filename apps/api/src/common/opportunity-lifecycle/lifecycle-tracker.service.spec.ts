import { LifecycleTrackerService } from './lifecycle-tracker.service';
import {
  TrackOpportunityInput,
  OpportunityStage,
  StageTransitionReason,
} from './types';

describe('LifecycleTrackerService', () => {
  let service: LifecycleTrackerService;

  beforeEach(() => {
    service = new LifecycleTrackerService();
  });

  function createInput(overrides: Partial<TrackOpportunityInput> = {}): TrackOpportunityInput {
    return {
      stockSymbol: 'THYAO',
      stockName: 'Turk Hava Yollari',
      currentPrice: 280,
      eliteScore: 72,
      confidence: 0.8,
      consensusScore: 0.7,
      riskScore: 0.3,
      momentumScore: 0.6,
      volumeScore: 0.5,
      volatilityScore: 0.4,
      strategyUsed: 'momentum',
      marketRegime: 'BULL',
      sector: 'Havacilik',
      ...overrides,
    };
  }

  describe('trackOpportunity', () => {
    it('should create a new opportunity record', () => {
      const input = createInput();
      const record = service.trackOpportunity(input);
      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(record.stockSymbol).toBe('THYAO');
      expect(record.stage).toBeDefined();
      expect(record.entryPrice).toBe(280);
    });

    it('should include initial snapshot', () => {
      const record = service.trackOpportunity(createInput());
      expect(record.snapshots.length).toBe(1);
      expect(record.snapshots[0].eliteScore).toBe(72);
    });

    it('should include initial stage transition', () => {
      const record = service.trackOpportunity(createInput());
      expect(record.stageHistory.length).toBeGreaterThanOrEqual(1);
      expect(record.stageHistory[0].from).toBeDefined();
    });

    it('should include health index', () => {
      const record = service.trackOpportunity(createInput());
      expect(record.healthIndex.overall).toBeGreaterThan(0);
      expect(record.healthIndex.level).toBeDefined();
    });

    it('should include early detection metrics', () => {
      const record = service.trackOpportunity(createInput());
      expect(record.earlyDetection.result).toBeDefined();
      expect(record.earlyDetection.firstDetectionTime).toBeDefined();
    });

    it('should include market context', () => {
      const record = service.trackOpportunity(createInput());
      expect(record.marketContext.regime).toBe('BULL');
      expect(record.marketContext.sector).toBe('Havacilik');
    });

    it('should auto-transition to EMERGING when confidence is high enough', () => {
      const input = createInput({ confidence: 0.5, eliteScore: 40 });
      const record = service.trackOpportunity(input);
      expect(record.stage).toBe(OpportunityStage.EMERGING);
    });
  });

  describe('updateOpportunity', () => {
    it('should update the opportunity', () => {
      const record = service.trackOpportunity(createInput());
      const updated = service.updateOpportunity(record.id, { eliteScore: 85 });
      expect(updated).not.toBeNull();
      expect(updated!.overallScore).toBe(85);
      expect(updated!.snapshots.length).toBe(2);
    });

    it('should return null for non-existent id', () => {
      const result = service.updateOpportunity('nonexistent', { eliteScore: 50 });
      expect(result).toBeNull();
    });

    it('should update current price', () => {
      const record = service.trackOpportunity(createInput());
      const updated = service.updateOpportunity(record.id, { currentPrice: 295 });
      expect(updated!.currentPrice).toBe(295);
    });

    it('should cap snapshots at maxSnapshots', () => {
      const record = service.trackOpportunity(createInput());
      for (let i = 0; i < 600; i++) {
        service.updateOpportunity(record.id, { eliteScore: 50 + i });
      }
      const updated = service.getOpportunity(record.id);
      expect(updated!.snapshots.length).toBeLessThanOrEqual(500);
    });
  });

  describe('getOpportunity', () => {
    it('should retrieve an existing opportunity', () => {
      const record = service.trackOpportunity(createInput());
      const retrieved = service.getOpportunity(record.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.stockSymbol).toBe('THYAO');
    });

    it('should return null for non-existent id', () => {
      expect(service.getOpportunity('nonexistent')).toBeNull();
    });
  });

  describe('getOpportunitiesBySymbol', () => {
    it('should retrieve opportunities by symbol', () => {
      service.trackOpportunity(createInput({ stockSymbol: 'THYAO' }));
      service.trackOpportunity(createInput({ stockSymbol: 'THYAO' }));
      service.trackOpportunity(createInput({ stockSymbol: 'GARAN' }));
      const results = service.getOpportunitiesBySymbol('THYAO');
      expect(results.length).toBe(2);
    });

    it('should return empty array for unknown symbol', () => {
      expect(service.getOpportunitiesBySymbol('UNKNOWN')).toEqual([]);
    });
  });

  describe('getActiveOpportunities', () => {
    it('should return only active opportunities', () => {
      const r1 = service.trackOpportunity(createInput({ stockSymbol: 'THYAO' }));
      const r2 = service.trackOpportunity(createInput({ stockSymbol: 'GARAN' }));
      service.transitionStage(r2.id, OpportunityStage.EXPIRED, StageTransitionReason.AUTOMATIC);
      const active = service.getActiveOpportunities();
      expect(active.length).toBe(1);
      expect(active[0].stockSymbol).toBe('THYAO');
    });
  });

  describe('transitionStage', () => {
    it('should transition to a new stage', () => {
      const record = service.trackOpportunity(createInput());
      const updated = service.transitionStage(
        record.id,
        OpportunityStage.CONFIRMED,
        StageTransitionReason.SCORE_THRESHOLD,
        0.9,
        'Test transition',
      );
      expect(updated).not.toBeNull();
      expect(updated!.stage).toBe(OpportunityStage.CONFIRMED);
      expect(updated!.confirmedAt).toBeDefined();
    });

    it('should set completedAt for terminal stages', () => {
      const record = service.trackOpportunity(createInput());
      service.transitionStage(record.id, OpportunityStage.EXPIRED, StageTransitionReason.TIME_DECAY);
      const updated = service.getOpportunity(record.id);
      expect(updated!.completedAt).toBeDefined();
    });
  });

  describe('cancelOpportunity', () => {
    it('should cancel the opportunity', () => {
      const record = service.trackOpportunity(createInput());
      const cancelled = service.cancelOpportunity(record.id);
      expect(cancelled).not.toBeNull();
      expect(cancelled!.stage).toBe(OpportunityStage.CANCELLED);
      expect(cancelled!.completedAt).toBeDefined();
    });
  });
});
