import { TCMBDecisionStoreService } from '../tcmb-decision-store.service';
import { TCMBDecisionAnalyzer, TCMBDecisionAnalysis } from '../engines/tcmb-decision-analyzer';

describe('TCMBDecisionStoreService', () => {
  let store: TCMBDecisionStoreService;
  let analyzer: TCMBDecisionAnalyzer;
  let analysis: TCMBDecisionAnalysis;

  beforeEach(() => {
    store = new TCMBDecisionStoreService();
    analyzer = new TCMBDecisionAnalyzer();
    analysis = analyzer.analyze('parasal sıkılaşma devam etmektedir');
  });

  describe('save', () => {
    it('should store a decision with generated id and storedAt', () => {
      const record = store.save({
        meetingDate: '2026-07-23',
        policyRate: 42.5,
        previousPolicyRate: 45,
        analysis,
        rawText: 'parasal sıkılaşma devam etmektedir',
      });

      expect(record.id).toBeTruthy();
      expect(record.storedAt).toBeTruthy();
      expect(record.meetingDate).toBe('2026-07-23');
      expect(store.count()).toBe(1);
    });
  });

  describe('query', () => {
    it('should find by id', () => {
      const record = store.save({
        meetingDate: '2026-07-23',
        policyRate: 42.5,
        previousPolicyRate: 45,
        analysis,
        rawText: 'test',
      });
      expect(store.findById(record.id)?.id).toBe(record.id);
      expect(store.findById('missing')).toBeNull();
    });

    it('should find by meeting date', () => {
      store.save({ meetingDate: '2026-07-23', policyRate: 42.5, previousPolicyRate: 45, analysis, rawText: 'a' });
      store.save({ meetingDate: '2026-06-25', policyRate: 45, previousPolicyRate: 45, analysis, rawText: 'b' });
      expect(store.findByMeetingDate('2026-06-25')?.policyRate).toBe(45);
      expect(store.findByMeetingDate('2020-01-01')).toBeNull();
    });

    it('should list newest first with limit', () => {
      store.save({ meetingDate: '2026-06-25', policyRate: 45, previousPolicyRate: 45, analysis, rawText: 'a' });
      store.save({ meetingDate: '2026-07-23', policyRate: 42.5, previousPolicyRate: 45, analysis, rawText: 'b' });
      const list = store.list();
      expect(list[0].meetingDate).toBe('2026-07-23');
      expect(store.list(1)).toHaveLength(1);
    });
  });

  describe('maintenance', () => {
    it('should clear all decisions', () => {
      store.save({ meetingDate: '2026-07-23', policyRate: 42.5, previousPolicyRate: 45, analysis, rawText: 'a' });
      store.clear();
      expect(store.count()).toBe(0);
    });
  });
});
