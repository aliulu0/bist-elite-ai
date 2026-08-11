import { AlertRefreshJob } from './alert-refresh.job';
import { MacroService } from '../../macro/macro.service';
import { MacroAnalysisService } from '../../macro/macro-analysis.service';
import { MacroDataService } from '../../macro/macro-data.service';
import { CentralBankNlpEngine } from '../../macro/engines/central-bank-nlp.engine';
import { MarketRegimeEngine } from '../../macro/engines/market-regime.engine';
import { MacroScoreEngine } from '../../macro/engines/macro-score.engine';
import { SectorImpactEngine } from '../../macro/engines/sector-impact.engine';
import { CombinedConfidenceEngine } from '../../macro/engines/combined-confidence.engine';
import { TCMBDecisionAnalyzer } from '../../macro/engines/tcmb-decision-analyzer';
import { MacroEliteScoreService } from '../../macro/macro-elite-score.service';
import { CombinedConfidenceService } from '../../macro/combined-confidence.service';
import { TCMBDecisionCaptureService } from '../../macro/tcmb-decision-capture.service';
import { TCMBDecisionStoreService } from '../../macro/tcmb-decision-store.service';
import { IDecisionNotifier } from '../../macro/decision-notifier';

function createMockOrchestrator() {
  return { fetchMacroIndicators: jest.fn().mockResolvedValue([]) } as any;
}

function makeMacroService(): MacroService {
  const mockOrch = createMockOrchestrator();
  const dataService = new MacroDataService(mockOrch);
  const decisionStore = new TCMBDecisionStoreService();
  const notifier: IDecisionNotifier = { notify: async () => {} };
  return new MacroService(
    new MacroAnalysisService(
      dataService,
      new CentralBankNlpEngine(),
      new MarketRegimeEngine(),
      new MacroScoreEngine(),
      new SectorImpactEngine(),
      new CombinedConfidenceEngine(),
      decisionStore,
    ),
    dataService,
    new MacroEliteScoreService(new MacroScoreEngine(), dataService, decisionStore, mockOrch),
    new CombinedConfidenceService(),
    new TCMBDecisionCaptureService(mockOrch, new TCMBDecisionAnalyzer(), decisionStore, notifier),
    decisionStore,
  );
}

describe('AlertRefreshJob', () => {
  it('should execute successfully', async () => {
    const job = new AlertRefreshJob(makeMacroService());
    const result = await job.execute();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Alert refresh completed');
  });

  it('should include alert count in metadata', async () => {
    const job = new AlertRefreshJob(makeMacroService());
    const result = await job.execute();
    expect(result.metadata).toHaveProperty('alertCount');
  });

  it('should include timestamp in metadata', async () => {
    const job = new AlertRefreshJob(makeMacroService());
    const result = await job.execute();
    expect(result.metadata).toHaveProperty('timestamp');
  });
});
