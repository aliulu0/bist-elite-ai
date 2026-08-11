import { Injectable, Logger } from '@nestjs/common';
import { MacroDataService } from './macro-data.service';
import { CentralBankNlpEngine } from './engines/central-bank-nlp.engine';
import { MarketRegimeEngine } from './engines/market-regime.engine';
import { MacroScoreEngine } from './engines/macro-score.engine';
import { SectorImpactEngine } from './engines/sector-impact.engine';
import { CombinedConfidenceEngine } from './engines/combined-confidence.engine';
import { TCMBDecisionStoreService } from './tcmb-decision-store.service';
import {
  MacroDataSnapshot,
  CentralBankAnalysis,
  CentralBank,
  MarketRegimeAnalysis,
  MacroScoreResult,
  SectorImpact,
  CombinedConfidence,
  MarketImpact,
} from './macro.types';
import { TCMBDecisionAnalysis } from './engines/tcmb-decision-analyzer';

@Injectable()
export class MacroAnalysisService {
  private readonly logger = new Logger(MacroAnalysisService.name);

  constructor(
    private readonly dataService: MacroDataService,
    private readonly nlpEngine: CentralBankNlpEngine,
    private readonly regimeEngine: MarketRegimeEngine,
    private readonly scoreEngine: MacroScoreEngine,
    private readonly sectorEngine: SectorImpactEngine,
    private readonly confidenceEngine: CombinedConfidenceEngine,
    private readonly decisionStore: TCMBDecisionStoreService,
  ) {}

  async getFullAnalysis(): Promise<{
    data: MacroDataSnapshot;
    tcmb: CentralBankAnalysis;
    fed: CentralBankAnalysis;
    ecb: CentralBankAnalysis;
    regime: MarketRegimeAnalysis;
    score: MacroScoreResult;
    sectors: SectorImpact[];
  }> {
    const data = await this.dataService.fetchAll();
    const tcmb = this.analyzeTcmb();
    const fed = this.buildEmptyBankAnalysis('fed');
    const ecb = this.buildEmptyBankAnalysis('ecb');
    const regime = this.regimeEngine.analyze(data.points);
    const score = this.scoreEngine.calculate(data.points);
    const sectors = this.sectorEngine.estimate(data.points, regime);

    return { data, tcmb, fed, ecb, regime, score, sectors };
  }

  async getMacroScore(): Promise<MacroScoreResult> {
    const data = await this.dataService.fetchAll();
    return this.scoreEngine.calculate(data.points);
  }

  async getRegime(): Promise<MarketRegimeAnalysis> {
    const data = await this.dataService.fetchAll();
    return this.regimeEngine.analyze(data.points);
  }

  async getCentralBankAnalysis(bank: CentralBank): Promise<CentralBankAnalysis> {
    if (bank === 'tcmb') {
      return this.analyzeTcmb();
    }
    return this.buildEmptyBankAnalysis(bank);
  }

  async getCombinedConfidence(eliteScore: number): Promise<CombinedConfidence> {
    const data = await this.dataService.fetchAll();
    const result = this.scoreEngine.calculate(data.points);
    return this.confidenceEngine.calculate(eliteScore, result.macroScore);
  }

  private analyzeTcmb(): CentralBankAnalysis {
    const decision = this.decisionStore.list(1)[0];
    if (!decision) {
      return this.buildEmptyBankAnalysis('tcmb');
    }
    const analysis = decision.analysis;
    return this.mapDecisionToCentralBankAnalysis(analysis);
  }

  private mapDecisionToCentralBankAnalysis(analysis: TCMBDecisionAnalysis): CentralBankAnalysis {
    return {
      bank: 'tcmb',
      tone: analysis.sentiment,
      confidence: analysis.confidence,
      marketImpact: analysis.marketImpact as MarketImpact,
      sectorImpacts: {},
      liquidity: analysis.liquidity,
      risk: analysis.risk,
      summary: analysis.summary,
      analyzedAt: analysis.analyzedAt,
    };
  }

  private buildEmptyBankAnalysis(bank: CentralBank): CentralBankAnalysis {
    return {
      bank,
      tone: 'neutral',
      confidence: 0,
      marketImpact: 'neutral',
      sectorImpacts: {},
      liquidity: 'neutral',
      risk: 'moderate',
      summary: `No ${bank.toUpperCase()} decision text available yet; awaiting statement ingestion.`,
      analyzedAt: new Date().toISOString(),
    };
  }
}
