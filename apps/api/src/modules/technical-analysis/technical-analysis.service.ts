import { Injectable, Logger } from '@nestjs/common';
import { MarketDataService } from '../market-data/market-data.service';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { OHLCV, Timeframe, IndicatorResult } from '../indicators/indicator.types';
import { MarketStructureEngine } from '../market-structure/market-structure.engine';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { SmartMoneyEngine } from '../smart-money/smart-money.engine';
import { SmartMoneyResult } from '../smart-money/smart-money.types';
import { TechnicalRulesEngine } from '../technical-rules/technical-rules.engine';
import { TechnicalRuleResult, TechnicalRulesOutput } from '../technical-rules/technical-rules.types';
import { TechnicalScoreEngine } from '../technical-score/technical-score.engine';
import { TechnicalScore, TechnicalScoreOutput } from '../technical-score/technical-score.types';
import { TechnicalSummaryGenerator } from '../technical-summary/technical-summary.generator';
import { TechnicalSummary } from '../technical-summary/technical-summary.types';

export interface TechnicalAnalysisResult {
  symbol: string;
  timeframe: Timeframe;
  indicatorSummary: IndicatorResult[];
  marketStructure: MarketStructureResult;
  smartMoney: SmartMoneyResult;
  technicalRules: TechnicalRulesOutput;
  technicalScore: TechnicalScoreOutput;
  technicalSummary: TechnicalSummary;
}

@Injectable()
export class TechnicalAnalysisService {
  private readonly logger = new Logger(TechnicalAnalysisService.name);

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly indicatorEngine: IndicatorEngine,
    private readonly marketStructureEngine: MarketStructureEngine,
    private readonly smartMoneyEngine: SmartMoneyEngine,
    private readonly technicalRulesEngine: TechnicalRulesEngine,
    private readonly technicalScoreEngine: TechnicalScoreEngine,
    private readonly technicalSummaryGenerator: TechnicalSummaryGenerator,
  ) {}

  async analyze(symbol: string, timeframe: Timeframe): Promise<TechnicalAnalysisResult> {
    const cleanSymbol = symbol.trim().toUpperCase();

    const rawData = await this.marketDataService.fetchData(cleanSymbol, timeframe);
    const ohlcvData = this.toOHLCV(rawData);

    if (ohlcvData.length === 0) {
      return this.emptyResult(cleanSymbol, timeframe);
    }

    const indicators = this.indicatorEngine.calculateAll(ohlcvData, timeframe);
    const marketStructure = this.marketStructureEngine.analyze(ohlcvData, timeframe);
    const smartMoney = this.smartMoneyEngine.evaluate(indicators, marketStructure, timeframe);
    const technicalRules = this.technicalRulesEngine.evaluate(indicators, marketStructure, smartMoney, timeframe);
    const technicalScore = this.technicalScoreEngine.calculate(technicalRules.rules, timeframe);
    const technicalSummary = this.technicalSummaryGenerator.generate(technicalScore, technicalRules.rules, timeframe);

    this.logger.debug(
      `Technical analysis complete for ${cleanSymbol} (${timeframe}): ` +
        `score=${technicalScore.score}, grade=${technicalScore.grade}`,
    );

    return {
      symbol: cleanSymbol,
      timeframe,
      indicatorSummary: indicators,
      marketStructure,
      smartMoney,
      technicalRules,
      technicalScore,
      technicalSummary,
    };
  }

  private toOHLCV(rawData: MarketDataPoint[]): OHLCV[] {
    return rawData.map((point) => ({
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
      timestamp: point.timestamp,
    }));
  }

  private emptyResult(symbol: string, timeframe: Timeframe): TechnicalAnalysisResult {
    return {
      symbol,
      timeframe,
      indicatorSummary: [],
      marketStructure: {
        timeframe,
        trend: 'sideways',
        structure: [],
        swingHighs: [],
        swingLows: [],
        supportZones: [],
        resistanceZones: [],
        breakOfStructure: [],
        changeOfCharacter: [],
        metadata: {},
        isValid: false,
      },
      smartMoney: {
        timeframe,
        accumulationScore: 0,
        distributionScore: 0,
        institutionalActivity: 'neutral',
        smartMoneyConfidence: 0,
        trendAlignment: 'sideways',
        signals: [],
        metadata: {},
        isValid: false,
      },
      technicalRules: {
        timeframe,
        rules: [],
        isValid: false,
      },
      technicalScore: {
        timeframe,
        score: 0,
        grade: 'D',
        confidence: 0,
        ruleBreakdown: [],
        metadata: {},
        isValid: false,
      },
      technicalSummary: {
        timeframe,
        summary: 'No data available for technical analysis.',
        overallOpinion: 'Cannot form opinion without data.',
        strengths: [],
        weaknesses: [],
        risks: [],
        recommendations: [],
        metadata: {},
        isValid: false,
      },
    };
  }
}
