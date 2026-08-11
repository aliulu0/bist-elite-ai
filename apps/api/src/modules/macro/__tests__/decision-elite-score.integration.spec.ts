import { TCMBDecisionCaptureService } from '../tcmb-decision-capture.service';
import { TCMBDecisionAnalyzer } from '../engines/tcmb-decision-analyzer';
import { TCMBDecisionStoreService } from '../tcmb-decision-store.service';
import { MacroEliteScoreService } from '../macro-elite-score.service';
import { MacroScoreEngine } from '../engines/macro-score.engine';
import { MacroDataService } from '../macro-data.service';

const DECISIONS = [
  { date: '2026-07-24', policyRate: 50, change: 5 },
  { date: '2026-06-25', policyRate: 45, change: 2 },
];

function buildPipeline(providerStatus: any[] = []) {
  const orchestrator = {
    fetchTcmbInterestDecisions: jest.fn().mockResolvedValue(DECISIONS),
    fetchMacroIndicators: jest.fn().mockResolvedValue([
      { symbol: 'vix', value: 30, change: 2, changePercent: 7.1, timestamp: new Date().toISOString(), source: 'finnhub' },
      { symbol: 'dxy', value: 110, change: 1, changePercent: 0.9, timestamp: new Date().toISOString(), source: 'finnhub' },
      { symbol: 'us10y', value: 6.0, change: 0.1, changePercent: 1.7, timestamp: new Date().toISOString(), source: 'finnhub' },
      { symbol: 'us2y', value: 4.8, change: 0.05, changePercent: 1.0, timestamp: new Date().toISOString(), source: 'finnhub' },
    ]),
    getProviderStatus: jest.fn().mockResolvedValue(providerStatus),
  } as any;

  const store = new TCMBDecisionStoreService();
  const analyzer = new TCMBDecisionAnalyzer();
  const capture = new TCMBDecisionCaptureService(orchestrator, analyzer, store, {
    notify: jest.fn().mockResolvedValue(undefined),
  });
  const data = new MacroDataService(orchestrator);
  const elite = new MacroEliteScoreService(new MacroScoreEngine(), data, store, orchestrator);

  return { capture, elite, store };
}

describe('TCMB decision flow integration', () => {
  it('should flow a captured hawkish decision into the elite score', async () => {
    const { capture, elite, store } = buildPipeline();

    const captured = await capture.captureLatest();
    expect(captured!.analysis.sentiment).toBe('hawkish');
    expect(store.count()).toBe(1);

    const result = await elite.calculate();
    expect(result.decision).not.toBeNull();
    expect(result.decision!.meetingDate).toBe('2026-07-24');
    expect(result.components.find((c) => c.name === 'tcmbDecision')!.weighted).toBeLessThan(0);
    expect(result.eliteScore).toBeGreaterThanOrEqual(0);
    expect(result.eliteScore).toBeLessThanOrEqual(100);
  });

  it('should expose the captured decision through observability', async () => {
    const { capture, elite } = buildPipeline();
    await capture.captureLatest();

    const observability = await elite.getObservability();
    expect(observability.decision.meetingDate).toBe('2026-07-24');
    expect(observability.decision.source).toBe('tcmb-decision-analyzer');
    expect(typeof observability.decision.ageHours).toBe('number');
  });

  it('should propagate provider status into observability', async () => {
    const { elite } = buildPipeline([
      {
        name: 'tcmb',
        connected: true,
        enabled: true,
        priority: 5,
        circuitState: 'CLOSED',
        lastSuccessTime: Date.now(),
        lastHealthCheck: new Date().toISOString(),
        totalRequests: 10,
        successfulRequests: 9,
        failedRequests: 1,
        avgLatencyMs: 120,
      },
    ]);

    const observability = await elite.getObservability();
    expect(observability.providers).toHaveLength(1);
    expect(observability.providers[0]).toMatchObject({ name: 'tcmb', connected: true, enabled: true });
    expect(typeof observability.providers[0].lastSuccessAgeMs).toBe('number');
  });
});
