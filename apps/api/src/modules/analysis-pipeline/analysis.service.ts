import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { MarketDataService } from '../market-data/market-data.service';
import { FUNDAMENTAL_PROVIDER } from '../market-data/market-data.module';
import { IFundamentalProvider } from '../market-data/interfaces';
import { AnalysisPipelineOrchestrator } from './analysis-pipeline.orchestrator';
import { AnalysisResult } from './analysis-pipeline.types';
import { HistoricalDataset, FundamentalData } from '../historical-data/historical-data.types';
import { Timeframe } from '../indicators/indicator.types';
import { mapToFundamentalData } from './fundamental.mapper';
import { PersistenceService } from '../persistence/persistence.service';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly pipeline: AnalysisPipelineOrchestrator,
    @Optional() @Inject(FUNDAMENTAL_PROVIDER) private readonly fundamentalProvider?: IFundamentalProvider,
    @Optional() private readonly persistenceService?: PersistenceService,
  ) {}

  async analyzeSymbol(symbol: string, timeframe: Timeframe): Promise<AnalysisResult> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const dataset = await this.buildDataset(cleanSymbol, timeframe);
    const result = await this.pipeline.analyze(dataset);

    if (this.persistenceService) {
      this.persistenceService.saveAnalysisResult({ result }).catch((err) => {
        this.logger.warn(`Failed to persist analysis result for ${cleanSymbol}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    return result;
  }

  async analyzeTechnical(symbol: string, timeframe: Timeframe): Promise<AnalysisResult> {
    const full = await this.analyzeSymbol(symbol, timeframe);
    return {
      ...full,
      financialRules: { symbol: full.symbol, rules: [] },
      financialScore: { symbol: full.symbol, score: 0, grade: 'D', passedRules: 0, warningRules: 0, failedRules: 0, confidence: 0, breakdown: { items: [], totalWeight: 0 } },
      financialSummary: { summary: '', strengths: [], weaknesses: [], risks: [], positives: [], overallOpinion: '' },
      confluence: { confluenceScore: 0, agreement: 'VERY_LOW', financialAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, technicalAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, smartMoneyAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, trendAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, confidence: 0, metadata: {}, isValid: false },
      candidate: { candidate: false, candidateScore: 0, priority: 'REJECT', reasons: [], confidence: 0, metadata: {}, isValid: false },
      opportunity: { opportunityScore: 0, earlyOpportunity: false, opportunityLevel: 'NONE', confidence: 0, strengths: [], riskFactors: [], reasons: [], metadata: {}, isValid: false },
      eliteScore: { eliteScore: 0, rating: 'D', priority: 'NONE', confidence: 0, earlyOpportunity: false, summary: '', breakdown: { financial: { score: 0, weight: 0, contribution: 0 }, technical: { score: 0, weight: 0, contribution: 0 }, opportunity: { score: 0, weight: 0, contribution: 0 }, confluence: { score: 0, weight: 0, contribution: 0 }, candidate: { score: 0, weight: 0, contribution: 0 } }, metadata: {}, isValid: false },
    };
  }

  async analyzeFinancial(symbol: string, timeframe: Timeframe): Promise<AnalysisResult> {
    const full = await this.analyzeSymbol(symbol, timeframe);
    return {
      ...full,
      indicators: [],
      marketStructure: { timeframe, trend: 'sideways', structure: [], swingHighs: [], swingLows: [], supportZones: [], resistanceZones: [], breakOfStructure: [], changeOfCharacter: [], metadata: {}, isValid: false },
      smartMoney: { timeframe, accumulationScore: 0, distributionScore: 0, institutionalActivity: 'neutral', smartMoneyConfidence: 0, trendAlignment: 'sideways', signals: [], metadata: {}, isValid: false },
      technicalRules: { timeframe, rules: [], isValid: false },
      technicalScore: { timeframe, score: 0, grade: 'D', confidence: 0, ruleBreakdown: [], metadata: {}, isValid: false },
      technicalSummary: { timeframe, summary: '', overallOpinion: '', strengths: [], weaknesses: [], risks: [], recommendations: [], metadata: {}, isValid: false },
      confluence: { confluenceScore: 0, agreement: 'VERY_LOW', financialAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, technicalAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, smartMoneyAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, trendAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, confidence: 0, metadata: {}, isValid: false },
      candidate: { candidate: false, candidateScore: 0, priority: 'REJECT', reasons: [], confidence: 0, metadata: {}, isValid: false },
      opportunity: { opportunityScore: 0, earlyOpportunity: false, opportunityLevel: 'NONE', confidence: 0, strengths: [], riskFactors: [], reasons: [], metadata: {}, isValid: false },
      eliteScore: { eliteScore: 0, rating: 'D', priority: 'NONE', confidence: 0, earlyOpportunity: false, summary: '', breakdown: { financial: { score: 0, weight: 0, contribution: 0 }, technical: { score: 0, weight: 0, contribution: 0 }, opportunity: { score: 0, weight: 0, contribution: 0 }, confluence: { score: 0, weight: 0, contribution: 0 }, candidate: { score: 0, weight: 0, contribution: 0 } }, metadata: {}, isValid: false },
    };
  }

  async analyzeSmartMoney(symbol: string, timeframe: Timeframe): Promise<AnalysisResult> {
    const full = await this.analyzeSymbol(symbol, timeframe);
    return {
      ...full,
      financialRules: { symbol: full.symbol, rules: [] },
      financialScore: { symbol: full.symbol, score: 0, grade: 'D', passedRules: 0, warningRules: 0, failedRules: 0, confidence: 0, breakdown: { items: [], totalWeight: 0 } },
      financialSummary: { summary: '', strengths: [], weaknesses: [], risks: [], positives: [], overallOpinion: '' },
      technicalRules: { timeframe, rules: [], isValid: false },
      technicalScore: { timeframe, score: 0, grade: 'D', confidence: 0, ruleBreakdown: [], metadata: {}, isValid: false },
      technicalSummary: { timeframe, summary: '', overallOpinion: '', strengths: [], weaknesses: [], risks: [], recommendations: [], metadata: {}, isValid: false },
      confluence: { confluenceScore: 0, agreement: 'VERY_LOW', financialAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, technicalAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, smartMoneyAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, trendAlignment: { score: 0, direction: 'neutral', confidence: 0, factors: [] }, confidence: 0, metadata: {}, isValid: false },
      candidate: { candidate: false, candidateScore: 0, priority: 'REJECT', reasons: [], confidence: 0, metadata: {}, isValid: false },
      opportunity: { opportunityScore: 0, earlyOpportunity: false, opportunityLevel: 'NONE', confidence: 0, strengths: [], riskFactors: [], reasons: [], metadata: {}, isValid: false },
      eliteScore: { eliteScore: 0, rating: 'D', priority: 'NONE', confidence: 0, earlyOpportunity: false, summary: '', breakdown: { financial: { score: 0, weight: 0, contribution: 0 }, technical: { score: 0, weight: 0, contribution: 0 }, opportunity: { score: 0, weight: 0, contribution: 0 }, confluence: { score: 0, weight: 0, contribution: 0 }, candidate: { score: 0, weight: 0, contribution: 0 } }, metadata: {}, isValid: false },
    };
  }

  async analyzeOpportunity(symbol: string, timeframe: Timeframe): Promise<AnalysisResult> {
    const full = await this.analyzeSymbol(symbol, timeframe);
    return {
      ...full,
      indicators: [],
      marketStructure: { timeframe, trend: 'sideways', structure: [], swingHighs: [], swingLows: [], supportZones: [], resistanceZones: [], breakOfStructure: [], changeOfCharacter: [], metadata: {}, isValid: false },
      smartMoney: { timeframe, accumulationScore: 0, distributionScore: 0, institutionalActivity: 'neutral', smartMoneyConfidence: 0, trendAlignment: 'sideways', signals: [], metadata: {}, isValid: false },
      financialRules: { symbol: full.symbol, rules: [] },
      financialScore: { symbol: full.symbol, score: 0, grade: 'D', passedRules: 0, warningRules: 0, failedRules: 0, confidence: 0, breakdown: { items: [], totalWeight: 0 } },
      financialSummary: { summary: '', strengths: [], weaknesses: [], risks: [], positives: [], overallOpinion: '' },
      technicalRules: { timeframe, rules: [], isValid: false },
      technicalScore: { timeframe, score: 0, grade: 'D', confidence: 0, ruleBreakdown: [], metadata: {}, isValid: false },
      technicalSummary: { timeframe, summary: '', overallOpinion: '', strengths: [], weaknesses: [], risks: [], recommendations: [], metadata: {}, isValid: false },
      confluence: full.confluence,
      candidate: full.candidate,
    };
  }

  async analyzeEliteScore(symbol: string, timeframe: Timeframe): Promise<AnalysisResult> {
    const full = await this.analyzeSymbol(symbol, timeframe);
    return {
      ...full,
      indicators: [],
      marketStructure: { timeframe, trend: 'sideways', structure: [], swingHighs: [], swingLows: [], supportZones: [], resistanceZones: [], breakOfStructure: [], changeOfCharacter: [], metadata: {}, isValid: false },
      smartMoney: { timeframe, accumulationScore: 0, distributionScore: 0, institutionalActivity: 'neutral', smartMoneyConfidence: 0, trendAlignment: 'sideways', signals: [], metadata: {}, isValid: false },
      financialRules: { symbol: full.symbol, rules: [] },
      financialScore: { symbol: full.symbol, score: 0, grade: 'D', passedRules: 0, warningRules: 0, failedRules: 0, confidence: 0, breakdown: { items: [], totalWeight: 0 } },
      financialSummary: { summary: '', strengths: [], weaknesses: [], risks: [], positives: [], overallOpinion: '' },
      technicalRules: { timeframe, rules: [], isValid: false },
      technicalScore: { timeframe, score: 0, grade: 'D', confidence: 0, ruleBreakdown: [], metadata: {}, isValid: false },
      technicalSummary: { timeframe, summary: '', overallOpinion: '', strengths: [], weaknesses: [], risks: [], recommendations: [], metadata: {}, isValid: false },
      confluence: full.confluence,
      candidate: full.candidate,
      opportunity: full.opportunity,
    };
  }

  private async buildDataset(symbol: string, timeframe: Timeframe): Promise<HistoricalDataset> {
    const rawData = await this.marketDataService.fetchData(symbol, timeframe);
    const bars = rawData.map((p) => ({
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
      timestamp: p.timestamp,
    }));

    const fundamentals = await this.fetchFundamentals(symbol);

    return {
      symbol,
      timeframe,
      bars,
      corporateActions: [],
      fundamentals,
      provider: { name: 'auto', currency: 'TRY', exchange: 'BIST', timezone: 'Europe/Istanbul', lastUpdated: new Date().toISOString(), reliability: 0.9 },
      metadata: { totalBars: bars.length, dateRange: { start: bars[0]?.timestamp ?? '', end: bars[bars.length - 1]?.timestamp ?? '' }, normalizedFields: [], warnings: [], processedAt: new Date().toISOString(), sourceProviders: ['auto'] },
    };
  }

  private async fetchFundamentals(symbol: string): Promise<FundamentalData> {
    const empty: FundamentalData = {
      priceToBook: null, evToEBITDA: null, netProfit: null, equity: null,
      totalDebt: null, totalAssets: null, sharesOutstanding: null, marketCap: null,
      sector: null, companyName: null,
    };

    if (!this.fundamentalProvider) return empty;

    try {
      const profile = await this.fundamentalProvider.getCompanyProfile(symbol);
      const ratios = await this.fundamentalProvider.getFinancialRatios(symbol);
      const balance = await this.fundamentalProvider.getBalanceSheet(symbol);
      const income = await this.fundamentalProvider.getIncomeStatement(symbol);

      return mapToFundamentalData({ profile, ratios, balance, income });
    } catch {
      this.logger.warn(`Failed to fetch fundamentals for ${symbol}, using empty`);
      return empty;
    }
  }
}
