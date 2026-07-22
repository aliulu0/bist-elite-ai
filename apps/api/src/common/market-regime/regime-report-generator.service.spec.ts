import { RegimeReportGeneratorService } from './regime-report-generator.service';
import {
  MarketRegimeType,
  RegimeTimeframe,
  RegimeClassification,
  MultiTimeframeRegime,
  RegimeTransition,
  RegimeHistoricalData,
  RegimeContext,
} from './types';

describe('RegimeReportGeneratorService', () => {
  let service: RegimeReportGeneratorService;

  beforeEach(() => {
    service = new RegimeReportGeneratorService();
  });

  describe('generateSummaryReport', () => {
    it('should generate summary with regime info', () => {
      const regime: MultiTimeframeRegime = {
        regimes: {
          [RegimeTimeframe.M4]: createClassification(MarketRegimeType.BULL),
          [RegimeTimeframe.D1]: createClassification(MarketRegimeType.BULL),
          [RegimeTimeframe.W1]: createClassification(MarketRegimeType.WEAK_BULL),
          [RegimeTimeframe.M1]: createClassification(MarketRegimeType.SIDEWAYS),
        },
        overall: MarketRegimeType.BULL,
        overallConfidence: 0.75,
        timeframeAgreement: 0.75,
        hasConflict: false,
        detectedAt: new Date().toISOString(),
      };
      const report = service.generateSummaryReport(regime);
      expect(report).toContain('Piyasa Rejimi');
      expect(report).toContain('Yukselis');
      expect(report).toContain('Gunluk');
    });

    it('should indicate conflict when present', () => {
      const regime: MultiTimeframeRegime = {
        regimes: {
          [RegimeTimeframe.M4]: createClassification(MarketRegimeType.BULL),
          [RegimeTimeframe.D1]: createClassification(MarketRegimeType.BEAR),
          [RegimeTimeframe.W1]: createClassification(MarketRegimeType.BULL),
          [RegimeTimeframe.M1]: createClassification(MarketRegimeType.BEAR),
        },
        overall: MarketRegimeType.SIDEWAYS,
        overallConfidence: 0.5,
        timeframeAgreement: 0.5,
        hasConflict: true,
        detectedAt: new Date().toISOString(),
      };
      const report = service.generateSummaryReport(regime);
      expect(report).toContain('Cakisma Durumu: Var');
    });
  });

  describe('generateConfidenceReport', () => {
    it('should include all confidence metrics', () => {
      const classification = createClassification(MarketRegimeType.STRONG_BULL);
      classification.agreementScore = 0.8;
      classification.conflictScore = 0.1;
      classification.stabilityScore = 0.9;
      classification.factors = [
        { factor: 'Trend', value: 0.9, weight: 0.35, contribution: 0.315, description: 'Test' },
      ];
      const report = service.generateConfidenceReport(classification);
      expect(report).toContain('Guvenilirlik');
      expect(report).toContain('Anlasma Skoru');
      expect(report).toContain('Cakisma Skoru');
      expect(report).toContain('Faktorler');
      expect(report).toContain('Trend');
    });
  });

  describe('generateTransitionReport', () => {
    it('should handle empty transitions', () => {
      const report = service.generateTransitionReport([]);
      expect(report).toContain('0 gecis algilandi');
      expect(report).toContain('Aktif gecis algilanmadi');
    });

    it('should include transition details', () => {
      const transitions: RegimeTransition[] = [
        {
          from: MarketRegimeType.BEAR,
          to: MarketRegimeType.BULL,
          probability: 0.65,
          timeframe: RegimeTimeframe.D1,
          indicators: ['Fiyat toparlanmasi', 'Hacim artisi'],
          detectedAt: new Date().toISOString(),
        },
      ];
      const report = service.generateTransitionReport(transitions);
      expect(report).toContain('Dusus');
      expect(report).toContain('Yukselis');
      expect(report).toContain('Fiyat toparlanmasi');
    });
  });

  describe('generateHistoricalReport', () => {
    it('should handle empty history', () => {
      const report = service.generateHistoricalReport([]);
      expect(report).toContain('Tarihsel veri bulunamadi');
    });

    it('should include regime statistics', () => {
      const history: RegimeHistoricalData[] = [
        {
          regime: MarketRegimeType.BULL,
          occurrences: 15,
          avgDuration: 5.2,
          totalDuration: 78,
          firstSeen: 'day_0',
          lastSeen: 'day_100',
        },
      ];
      const report = service.generateHistoricalReport(history);
      expect(report).toContain('Yukselis');
      expect(report).toContain('15');
      expect(report).toContain('5.2');
    });
  });

  describe('generateRiskContextReport', () => {
    it('should include risk factors', () => {
      const context: RegimeContext = {
        currentRegime: MarketRegimeType.STRONG_BEAR,
        confidence: 0.3,
        duration: 35,
        transitionRisk: 0.8,
        recommendedAdjustments: [
          { parameter: 'maxPositionSize', currentValue: 0.15, recommendedValue: 0.01, reason: 'Test reason' },
        ],
        riskFactors: ['Dusuk rejim guvenilirlik skoru', 'Yuksek gecis riski algilandi'],
      };
      const report = service.generateRiskContextReport(context);
      expect(report).toContain('Guclu Dusus');
      expect(report).toContain('Risk Faktorleri');
      expect(report).toContain('Dusuk rejim guvenilirlik skoru');
      expect(report).toContain('Onerilen Ayarlamalar');
    });
  });

  describe('all reports contain header and footer', () => {
    it('should contain header and footer in all reports', () => {
      const classification = createClassification(MarketRegimeType.BULL);
      const multiTF = createMultiTimeframeRegime();
      const transitions: RegimeTransition[] = [];
      const history: RegimeHistoricalData[] = [];
      const context: RegimeContext = {
        currentRegime: MarketRegimeType.BULL,
        confidence: 0.7,
        duration: 10,
        transitionRisk: 0.2,
        recommendedAdjustments: [],
        riskFactors: [],
      };

      const reports = [
        service.generateSummaryReport(multiTF),
        service.generateConfidenceReport(classification),
        service.generateTransitionReport(transitions),
        service.generateHistoricalReport(history),
        service.generateRiskContextReport(context),
      ];

      for (const report of reports) {
        expect(report).toContain('Piyasa Rejimi Analiz Raporu');
        expect(report).toContain('Rapor Sonu');
      }
    });
  });
});

function createClassification(type: MarketRegimeType): RegimeClassification {
  return {
    type,
    confidence: 0.7,
    agreementScore: 0.7,
    conflictScore: 0.1,
    stabilityScore: 0.8,
    factors: [],
    classifiedAt: new Date().toISOString(),
  };
}

function createMultiTimeframeRegime(): MultiTimeframeRegime {
  return {
    regimes: {
      [RegimeTimeframe.M4]: createClassification(MarketRegimeType.BULL),
      [RegimeTimeframe.D1]: createClassification(MarketRegimeType.BULL),
      [RegimeTimeframe.W1]: createClassification(MarketRegimeType.BULL),
      [RegimeTimeframe.M1]: createClassification(MarketRegimeType.BULL),
    },
    overall: MarketRegimeType.BULL,
    overallConfidence: 0.7,
    timeframeAgreement: 1,
    hasConflict: false,
    detectedAt: new Date().toISOString(),
  };
}
