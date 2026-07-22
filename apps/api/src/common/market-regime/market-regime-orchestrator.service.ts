import { Injectable } from '@nestjs/common';
import {
  MarketRegimeType,
  RegimeInput,
  RegimeClassification,
  MultiTimeframeRegime,
  RegimeTimeframe,
  RegimeTransition,
  RegimeHistoricalData,
  RegimeContext,
  MARKET_REGIME_CONFIG_DEFAULTS,
  MarketRegimeConfig,
} from './types';
import { RegimeDetectorService } from './regime-detector.service';
import { RegimeTransitionService } from './regime-transition.service';
import { RegimeHistoricalService } from './regime-historical.service';
import { RegimeContextService } from './regime-context.service';
import { RegimeReportGeneratorService } from './regime-report-generator.service';

@Injectable()
export class MarketRegimeOrchestratorService {
  private config: MarketRegimeConfig = { ...MARKET_REGIME_CONFIG_DEFAULTS };

  constructor(
    private readonly detector: RegimeDetectorService,
    private readonly transitionService: RegimeTransitionService,
    private readonly historicalService: RegimeHistoricalService,
    private readonly contextService: RegimeContextService,
    private readonly reportGenerator: RegimeReportGeneratorService,
  ) {}

  detectRegime(input: RegimeInput): RegimeClassification {
    return this.detector.classifyRegime(input);
  }

  detectAllTimeframe(
    inputs: Record<RegimeTimeframe, RegimeInput>,
  ): MultiTimeframeRegime {
    const regimes: Record<RegimeTimeframe, RegimeClassification> = {} as Record<
      RegimeTimeframe,
      RegimeClassification
    >;

    for (const tf of Object.keys(inputs) as RegimeTimeframe[]) {
      regimes[tf] = this.detector.classifyRegime(inputs[tf]);
    }

    const regimeTypes = Object.values(regimes).map((r) => r.type);
    const overall = this.resolveDominantRegime(regimeTypes);
    const overallConfidence =
      Object.values(regimes).reduce((sum, r) => sum + r.confidence, 0) /
      Object.values(regimes).length;
    const timeframeAgreement = this.calculateTimeframeAgreement(regimeTypes);
    const hasConflict = timeframeAgreement < 0.5;

    return {
      regimes,
      overall,
      overallConfidence,
      timeframeAgreement,
      hasConflict,
      detectedAt: new Date().toISOString(),
    };
  }

  getRegimeSummary(
    inputs?: Record<RegimeTimeframe, RegimeInput>,
    regimeHistory?: MarketRegimeType[],
  ): MultiTimeframeRegime {
    const defaultInputs: Record<RegimeTimeframe, RegimeInput> = {
      [RegimeTimeframe.M4]: this.createDefaultInput(RegimeTimeframe.M4),
      [RegimeTimeframe.D1]: this.createDefaultInput(RegimeTimeframe.D1),
      [RegimeTimeframe.W1]: this.createDefaultInput(RegimeTimeframe.W1),
      [RegimeTimeframe.M1]: this.createDefaultInput(RegimeTimeframe.M1),
    };

    const useInputs = inputs || defaultInputs;
    return this.detectAllTimeframe(useInputs);
  }

  getRegimeContext(
    regime: MarketRegimeType,
    confidence: number = 0.5,
    duration: number = 0,
    transitionRisk: number = 0,
  ): RegimeContext {
    return this.contextService.getEliteScoreContext(
      regime,
      confidence,
      duration,
      transitionRisk,
    );
  }

  getTransitionAnalysis(
    currentRegime: MarketRegimeType,
    regimeHistory: MarketRegimeType[] = [],
    timeframe: RegimeTimeframe = RegimeTimeframe.D1,
  ): RegimeTransition[] {
    return this.transitionService.detectTransitions(
      currentRegime,
      regimeHistory,
      timeframe,
    );
  }

  getHistoricalAnalysis(regimeHistory: MarketRegimeType[]): RegimeHistoricalData[] {
    return this.historicalService.getRegimeFrequency(regimeHistory);
  }

  generateReport(
    type: 'summary' | 'confidence' | 'transition' | 'historical' | 'risk',
    data?: any,
  ): string {
    switch (type) {
      case 'summary':
        return this.reportGenerator.generateSummaryReport(data || this.createDefaultMultiTimeframeRegime());
      case 'confidence':
        return this.reportGenerator.generateConfidenceReport(data || this.createDefaultClassification());
      case 'transition':
        return this.reportGenerator.generateTransitionReport(data || []);
      case 'historical':
        return this.reportGenerator.generateHistoricalReport(data || []);
      case 'risk':
        return this.reportGenerator.generateRiskContextReport(data || this.createDefaultContext());
      default:
        return 'Gecersiz rapor tipi';
    }
  }

  private resolveDominantRegime(regimes: MarketRegimeType[]): MarketRegimeType {
    const counts: Record<string, number> = {};
    for (const r of regimes) {
      counts[r] = (counts[r] || 0) + 1;
    }

    let maxCount = 0;
    let dominant: MarketRegimeType = MarketRegimeType.SIDEWAYS;
    for (const [regime, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = regime as MarketRegimeType;
      }
    }

    return dominant;
  }

  private calculateTimeframeAgreement(regimes: MarketRegimeType[]): number {
    if (regimes.length === 0) return 0;
    const counts: Record<string, number> = {};
    for (const r of regimes) {
      counts[r] = (counts[r] || 0) + 1;
    }
    const maxCount = Math.max(...Object.values(counts));
    return maxCount / regimes.length;
  }

  private createDefaultInput(timeframe: RegimeTimeframe): RegimeInput {
    return {
      timeframe,
      trendScore: 0,
      momentumScore: 0,
      volumeScore: 0.5,
      volatilityScore: 0.5,
      breadthScore: 0.5,
      priceChange: 0,
      highLowRange: 0.02,
      indicators: [],
    };
  }

  private createDefaultMultiTimeframeRegime(): MultiTimeframeRegime {
    const defaultRegime: RegimeClassification = {
      type: MarketRegimeType.SIDEWAYS,
      confidence: 0.5,
      agreementScore: 0.5,
      conflictScore: 0,
      stabilityScore: 0.8,
      factors: [],
      classifiedAt: new Date().toISOString(),
    };

    return {
      regimes: {
        [RegimeTimeframe.M4]: defaultRegime,
        [RegimeTimeframe.D1]: defaultRegime,
        [RegimeTimeframe.W1]: defaultRegime,
        [RegimeTimeframe.M1]: defaultRegime,
      },
      overall: MarketRegimeType.SIDEWAYS,
      overallConfidence: 0.5,
      timeframeAgreement: 1,
      hasConflict: false,
      detectedAt: new Date().toISOString(),
    };
  }

  private createDefaultClassification(): RegimeClassification {
    return {
      type: MarketRegimeType.SIDEWAYS,
      confidence: 0.5,
      agreementScore: 0.5,
      conflictScore: 0,
      stabilityScore: 0.8,
      factors: [],
      classifiedAt: new Date().toISOString(),
    };
  }

  private createDefaultContext(): RegimeContext {
    return {
      currentRegime: MarketRegimeType.SIDEWAYS,
      confidence: 0.5,
      duration: 0,
      transitionRisk: 0,
      recommendedAdjustments: [],
      riskFactors: [],
    };
  }
}
