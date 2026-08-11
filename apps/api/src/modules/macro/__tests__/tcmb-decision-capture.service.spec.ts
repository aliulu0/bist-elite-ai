import { TCMBDecisionCaptureService } from '../tcmb-decision-capture.service';
import { TCMBDecisionAnalyzer } from '../engines/tcmb-decision-analyzer';
import { TCMBDecisionStoreService } from '../tcmb-decision-store.service';

function createMockOrchestrator(decisions: any[] = []) {
  return {
    fetchTcmbInterestDecisions: jest.fn().mockResolvedValue(decisions),
  } as any;
}

describe('TCMBDecisionCaptureService', () => {
  let store: TCMBDecisionStoreService;
  let notifier: { notify: jest.Mock };

  function makeService(decisions: any[] = []) {
    store = new TCMBDecisionStoreService();
    notifier = { notify: jest.fn().mockResolvedValue(undefined) };
    return new TCMBDecisionCaptureService(
      createMockOrchestrator(decisions),
      new TCMBDecisionAnalyzer(),
      store,
      notifier,
    );
  }

  describe('capture', () => {
    it('should analyze and store a decision, then notify', async () => {
      const service = makeService();
      const record = await service.capture({
        meetingDate: '2026-07-24',
        policyRate: 50,
        previousPolicyRate: 45,
        rawText:
          'Kurul politika faizini %45\'den %50\'ye yükseltti. Parasal sıkılaşma devam ediyor. Sıkı duruş korunuyor. Enflasyon riski yukarı yönlü.',
      });

      expect(record.id).toBeDefined();
      expect(record.meetingDate).toBe('2026-07-24');
      expect(record.analysis.sentiment).toBe('hawkish');
      expect(store.count()).toBe(1);
      expect(notifier.notify).toHaveBeenCalledTimes(1);
      expect(notifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({ meetingDate: '2026-07-24', sentiment: 'hawkish' }),
      );
    });

    it('should deduplicate decisions by meeting date', async () => {
      const service = makeService();
      const input = {
        meetingDate: '2026-07-24',
        policyRate: 50,
        previousPolicyRate: 45,
        rawText: 'Kurul politika faizini %45\'den %50\'ye yükseltti.',
      };
      const first = await service.capture(input);
      const second = await service.capture(input);

      expect(second.id).toBe(first.id);
      expect(store.count()).toBe(1);
      expect(notifier.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('captureLatest', () => {
    it('should return null when the market data layer has no decisions', async () => {
      const service = makeService([]);
      const result = await service.captureLatest();
      expect(result).toBeNull();
      expect(store.count()).toBe(0);
      expect(notifier.notify).not.toHaveBeenCalled();
    });

    it('should capture the latest decision and notify', async () => {
      const service = makeService([
        { date: '2026-07-24', policyRate: 50, change: 5 },
        { date: '2026-06-25', policyRate: 45, change: 2 },
      ]);
      const result = await service.captureLatest();

      expect(result).not.toBeNull();
      expect(result!.meetingDate).toBe('2026-07-24');
      expect(result!.policyRate).toBe(50);
      expect(result!.previousPolicyRate).toBe(45);
      expect(store.count()).toBe(1);
      expect(notifier.notify).toHaveBeenCalledTimes(1);
    });

    it('should not re-store or re-notify an already captured decision', async () => {
      const service = makeService([
        { date: '2026-07-24', policyRate: 50, change: 5 },
      ]);
      await service.captureLatest();
      const second = await service.captureLatest();

      expect(second).not.toBeNull();
      expect(store.count()).toBe(1);
      expect(notifier.notify).toHaveBeenCalledTimes(1);
    });

    it('should build a hold decision text when the rate is unchanged', async () => {
      const service = makeService([
        { date: '2026-07-24', policyRate: 50, change: 0 },
        { date: '2026-06-25', policyRate: 50, change: 0 },
      ]);
      const result = await service.captureLatest();
      expect(result!.analysis.sentiment).toBe('neutral');
      expect(result!.rawText).toContain('sabit tuttu');
    });
  });
});
