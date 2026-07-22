import { MarketRegimeOrchestratorService } from './market-regime-orchestrator.service';
import { RegimeDetectorService } from './regime-detector.service';
import { RegimeTransitionService } from './regime-transition.service';
import { RegimeHistoricalService } from './regime-historical.service';
import { RegimeContextService } from './regime-context.service';
import { RegimeReportGeneratorService } from './regime-report-generator.service';
import { MarketRegimeType, RegimeTimeframe, RegimeInput } from './types';

describe('MarketRegimeOrchestratorService', () => {
  let service: MarketRegimeOrchestratorService;
  let detector: RegimeDetectorService;
  let transitionService: RegimeTransitionService;
  let historicalService: RegimeHistoricalService;
  let contextService: RegimeContextService;
  let reportGenerator: RegimeReportGeneratorService;

  beforeEach(() => {
    detector = new RegimeDetectorService();
    transitionService = new RegimeTransitionService();
    historicalService = new RegimeHistoricalService();
    contextService = new RegimeContextService();
    reportGenerator = new RegimeReportGeneratorService();
    service = new MarketRegimeOrchestratorService(
      detector,
      transitionService,
      historicalService,
      contextService,
      reportGenerator,
    );
  });

  describe('detectRegime', () => {
    it('should classify regime from input', () => {
      const input: RegimeInput = {
        timeframe: RegimeTimeframe.D1,
        trendScore: 0.8,
        momentumScore: 0.7,
        volumeScore: 0.6,
        volatilityScore: 0.5,
        breadthScore: 0.7,
        priceChange: 0.03,
      };
      const result = service.detectRegime(input);
      expect(result.type).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('detectAllTimeframe', () => {
    it('should classify all timeframes', () => {
      const inputs: Record<RegimeTimeframe, RegimeInput> = {
        [RegimeTimeframe.M4]: createInput(RegimeTimeframe.M4, 0.5, 0.5),
        [RegimeTimeframe.D1]: createInput(RegimeTimeframe.D1, 0.6, 0.5),
        [RegimeTimeframe.W1]: createInput(RegimeTimeframe.W1, 0.4, 0.5),
        [RegimeTimeframe.M1]: createInput(RegimeTimeframe.M1, 0.3, 0.5),
      };
      const result = service.detectAllTimeframe(inputs);
      expect(result.regimes[RegimeTimeframe.M4]).toBeDefined();
      expect(result.regimes[RegimeTimeframe.D1]).toBeDefined();
      expect(result.regimes[RegimeTimeframe.W1]).toBeDefined();
      expect(result.regimes[RegimeTimeframe.M1]).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.detectedAt).toBeDefined();
    });

    it('should detect conflict when timeframes disagree', () => {
      const inputs: Record<RegimeTimeframe, RegimeInput> = {
        [RegimeTimeframe.M4]: createInput(RegimeTimeframe.M4, 0.9, 0.2),
        [RegimeTimeframe.D1]: createInput(RegimeTimeframe.D1, -0.9, 0.5),
        [RegimeTimeframe.W1]: createInput(RegimeTimeframe.W1, 0.9, 0.3),
        [RegimeTimeframe.M1]: createInput(RegimeTimeframe.M1, -0.9, 0.4),
      };
      const result = service.detectAllTimeframe(inputs);
      expect(result.timeframeAgreement).toBeLessThan(1);
    });

    it('should have high agreement when timeframes agree', () => {
      const inputs: Record<RegimeTimeframe, RegimeInput> = {
        [RegimeTimeframe.M4]: createInput(RegimeTimeframe.M4, 0.8, 0.5),
        [RegimeTimeframe.D1]: createInput(RegimeTimeframe.D1, 0.8, 0.5),
        [RegimeTimeframe.W1]: createInput(RegimeTimeframe.W1, 0.8, 0.5),
        [RegimeTimeframe.M1]: createInput(RegimeTimeframe.M1, 0.8, 0.5),
      };
      const result = service.detectAllTimeframe(inputs);
      expect(result.timeframeAgreement).toBe(1);
      expect(result.hasConflict).toBe(false);
    });
  });

  describe('getRegimeSummary', () => {
    it('should return default summary when no inputs', () => {
      const result = service.getRegimeSummary();
      expect(result.overall).toBeDefined();
      expect(result.regimes[RegimeTimeframe.D1]).toBeDefined();
    });

    it('should use provided inputs', () => {
      const inputs: Record<RegimeTimeframe, RegimeInput> = {
        [RegimeTimeframe.M4]: createInput(RegimeTimeframe.M4, 0.9, 0.2),
        [RegimeTimeframe.D1]: createInput(RegimeTimeframe.D1, 0.9, 0.2),
        [RegimeTimeframe.W1]: createInput(RegimeTimeframe.W1, 0.9, 0.2),
        [RegimeTimeframe.M1]: createInput(RegimeTimeframe.M1, 0.9, 0.2),
      };
      const result = service.getRegimeSummary(inputs);
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('getRegimeContext', () => {
    it('should return context for given regime', () => {
      const ctx = service.getRegimeContext(MarketRegimeType.BULL, 0.8, 10, 0.2);
      expect(ctx.currentRegime).toBe(MarketRegimeType.BULL);
      expect(ctx.confidence).toBe(0.8);
      expect(ctx.duration).toBe(10);
      expect(ctx.transitionRisk).toBe(0.2);
    });

    it('should use default values when not provided', () => {
      const ctx = service.getRegimeContext(MarketRegimeType.BEAR);
      expect(ctx.confidence).toBe(0.5);
      expect(ctx.duration).toBe(0);
    });
  });

  describe('getTransitionAnalysis', () => {
    it('should return transitions', () => {
      const history = [
        MarketRegimeType.BEAR,
        MarketRegimeType.BEAR,
        MarketRegimeType.BULL,
      ];
      const result = service.getTransitionAnalysis(MarketRegimeType.BULL, history);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should use default values when not provided', () => {
      const result = service.getTransitionAnalysis(MarketRegimeType.BULL);
      expect(result).toEqual([]);
    });
  });

  describe('getHistoricalAnalysis', () => {
    it('should return historical analysis', () => {
      const history = [
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
        MarketRegimeType.BEAR,
        MarketRegimeType.BULL,
      ];
      const result = service.getHistoricalAnalysis(history);
      expect(result.length).toBe(2);
    });
  });

  describe('generateReport', () => {
    it('should generate summary report', () => {
      const report = service.generateReport('summary');
      expect(report).toContain('Piyasa Rejimi');
    });

    it('should generate confidence report', () => {
      const report = service.generateReport('confidence');
      expect(report).toContain('Guvenilirlik');
    });

    it('should generate transition report', () => {
      const report = service.generateReport('transition');
      expect(report).toContain('Gecis');
    });

    it('should generate historical report', () => {
      const report = service.generateReport('historical');
      expect(report).toContain('Tarihsel');
    });

    it('should generate risk report', () => {
      const report = service.generateReport('risk');
      expect(report).toContain('Risk');
    });
  });
});

function createInput(
  timeframe: RegimeTimeframe,
  trendScore: number,
  volatilityScore: number,
): RegimeInput {
  return {
    timeframe,
    trendScore,
    momentumScore: trendScore * 0.8,
    volumeScore: 0.5,
    volatilityScore,
    breadthScore: 0.5,
    priceChange: trendScore * 0.02,
  };
}
