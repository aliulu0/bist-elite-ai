import { Injectable, Logger } from '@nestjs/common';
import {
  EliteScoreInput,
  EliteScoreOutput,
  ScoringProfile,
  ScoreComponentWeights,
  EvidenceMatrixEntry,
  RiskAdjustmentOutput,
  getScoringConfig,
  ScoringConfig,
} from './types';
import { WeightManager } from './weight-manager.service';
import { TechnicalScorer } from './technical-scorer.service';
import { ConsensusAnalyzer } from './consensus-analyzer.service';
import { HistoricalReliabilityAnalyzer } from './historical-reliability.service';
import { EarlyOpportunityDetector } from './early-opportunity.service';
import { EvidenceMatrixService } from './evidence-matrix.service';

@Injectable()
export class EliteScoreOrchestrator {
  private readonly logger = new Logger(EliteScoreOrchestrator.name);
  private readonly config: ScoringConfig;
  private readonly weightManager: WeightManager;
  private readonly technicalScorer: TechnicalScorer;
  private readonly consensusAnalyzer: ConsensusAnalyzer;
  private readonly historicalReliabilityAnalyzer: HistoricalReliabilityAnalyzer;
  private readonly earlyOpportunityDetector: EarlyOpportunityDetector;
  private readonly evidenceMatrixService: EvidenceMatrixService;

  constructor(configOverrides?: Partial<ScoringConfig>) {
    this.config = getScoringConfig(configOverrides);
    this.weightManager = new WeightManager(configOverrides);
    this.technicalScorer = new TechnicalScorer();
    this.consensusAnalyzer = new ConsensusAnalyzer();
    this.historicalReliabilityAnalyzer = new HistoricalReliabilityAnalyzer(configOverrides);
    this.earlyOpportunityDetector = new EarlyOpportunityDetector(configOverrides);
    this.evidenceMatrixService = new EvidenceMatrixService(this.weightManager);
  }

  async calculate(input: EliteScoreInput): Promise<EliteScoreOutput> {
    const startTime = Date.now();
    const profile = input.profile ?? this.config.defaultProfile;

    this.logger.debug(`Calculating elite score for ${input.stockSymbol} (profile: ${profile})`);

    const technicalScores = this.calculateTechnicalScore(input);
    const consensusScore = this.calculateConsensusScore(input);
    const historicalScore = this.calculateHistoricalScore(input);
    const earlyOppScore = this.calculateEarlyOpportunityScore(input);
    const conflictCount = input.riskAdjustment?.timeframeConflictCount ?? consensusScore.conflictCount;
    const riskAdjustment = this.calculateRiskAdjustment(input, conflictCount);

    const componentScores: Record<string, number> = {
      technical: technicalScores.composite,
      trend: technicalScores.trend,
      momentum: technicalScores.momentum,
      volume: technicalScores.volume,
      volatility: technicalScores.volatility,
      liquidity: 50,
      risk: 100 - riskAdjustment.adjustedScore,
      strategy: consensusScore.overallConsensus * 100,
      multiTimeframeConsensus: consensusScore.timeframeAgreement * 100,
      historicalReliability: historicalScore.score,
      earlyOpportunity: earlyOppScore.score,
    };

    const weights = this.weightManager.getWeights(profile);
    const overallEliteScore = this.weightManager.computeWeightedScore(componentScores, weights);
    const adjustedScore = this.weightManager.applyRiskAdjustment(overallEliteScore, riskAdjustment.adjustmentFactor);

    const evidenceMatrix = this.evidenceMatrixService.generate(componentScores, profile, {
      technical: 'Teknik Analiz',
      trend: 'Trend Analizi',
      momentum: 'Momentum Analizi',
      volume: 'Hacim Analizi',
      volatility: 'Volatilite',
      liquidity: 'Likidite',
      risk: 'Risk Analizi',
      strategy: 'Strateji Uyumu',
      multiTimeframeConsensus: 'Çerçeve Uyumu',
      historicalReliability: 'Tarihsel Güvenilirlik',
      earlyOpportunity: 'Erken Fırsat',
    });

    const confidenceScore = this.calculateConfidenceScore(componentScores, consensusScore, riskAdjustment);

    const elapsed = Date.now() - startTime;
    this.logger.debug(`Elite score calculated for ${input.stockSymbol}: ${adjustedScore.toFixed(1)} (${elapsed}ms)`);

    return {
      stockSymbol: input.stockSymbol,
      stockName: input.stockName,
      generatedAt: new Date().toISOString(),
      profile,
      overallEliteScore: Math.round(adjustedScore * 10) / 10,
      componentScores: {
        technical: Math.round(technicalScores.composite * 10) / 10,
        trend: Math.round(technicalScores.trend * 10) / 10,
        momentum: Math.round(technicalScores.momentum * 10) / 10,
        volume: Math.round(technicalScores.volume * 10) / 10,
        volatility: Math.round(technicalScores.volatility * 10) / 10,
        liquidity: 50,
        risk: Math.round((100 - riskAdjustment.adjustedScore) * 10) / 10,
        strategy: Math.round(consensusScore.overallConsensus * 100 * 10) / 10,
        multiTimeframeConsensus: Math.round(consensusScore.timeframeAgreement * 100 * 10) / 10,
        historicalReliability: Math.round(historicalScore.score * 10) / 10,
        earlyOpportunity: Math.round(earlyOppScore.score * 10) / 10,
      },
      evidenceMatrix,
      riskAdjustment,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      metadata: {
        ...input.metadata,
        calculationTimeMs: elapsed,
        componentCount: Object.keys(componentScores).length,
        positiveContributions: evidenceMatrix.filter(e => e.rawScore >= 55).length,
        negativeContributions: evidenceMatrix.filter(e => e.rawScore <= 45).length,
      },
    };
  }

  async calculateBatch(inputs: EliteScoreInput[]): Promise<EliteScoreOutput[]> {
    const results = await Promise.all(inputs.map(input => this.calculate(input)));

    results.sort((a, b) => b.overallEliteScore - a.overallEliteScore);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }

  private calculateTechnicalScore(input: EliteScoreInput) {
    if (input.technicalScores && input.technicalScores.length > 0) {
      return this.technicalScorer.calculate(input.technicalScores);
    }
    if (input.indicators && input.indicators.length > 0) {
      return this.technicalScorer.calculateFromIndicators(input.indicators);
    }
    return this.technicalScorer.calculate([{
      timeframe: 'D1' as any,
      trend: 50,
      momentum: 50,
      volume: 50,
      volatility: 50,
    }]);
  }

  private calculateConsensusScore(input: EliteScoreInput) {
    return this.consensusAnalyzer.analyze({
      timeframeScores: input.timeframeScores ?? [],
      indicators: input.indicators ?? [],
    });
  }

  private calculateHistoricalScore(input: EliteScoreInput) {
    if (input.historicalReliability) {
      return this.historicalReliabilityAnalyzer.analyze(input.historicalReliability);
    }
    return this.historicalReliabilityAnalyzer.analyze({});
  }

  private calculateEarlyOpportunityScore(input: EliteScoreInput) {
    if (input.earlyOpportunity) {
      return this.earlyOpportunityDetector.detect(input.earlyOpportunity);
    }
    return this.earlyOpportunityDetector.detect({
      signalFreshness: 0.5,
      confirmationLevel: 0.5,
      timeSinceDetection: 48,
      competitorConfirmation: 0.3,
    });
  }

  private calculateRiskAdjustment(
    input: EliteScoreInput,
    conflictCount: number,
  ): RiskAdjustmentOutput {
    const penalties: Array<{ factor: string; penalty: number; reason: string }> = [];
    let totalPenalty = 0;
    const { riskAdjustment: config } = this.config;

    const volatility = input.riskAdjustment?.volatility ?? 50;
    if (volatility > config.volatilityThreshold) {
      const penalty = ((volatility - config.volatilityThreshold) / (100 - config.volatilityThreshold)) * config.maxPenalty;
      totalPenalty += penalty;
      penalties.push({
        factor: 'volatility',
        penalty: Math.round(penalty * 10) / 10,
        reason: `Yüksek volatilite: ${volatility.toFixed(1)}`,
      });
    }

    const liquidity = input.riskAdjustment?.liquidity ?? 50;
    if (liquidity < config.liquidityThreshold) {
      const penalty = ((config.liquidityThreshold - liquidity) / config.liquidityThreshold) * config.maxPenalty * 0.8;
      totalPenalty += penalty;
      penalties.push({
        factor: 'liquidity',
        penalty: Math.round(penalty * 10) / 10,
        reason: `Düşük likidite: ${liquidity.toFixed(1)}`,
      });
    }

    if (conflictCount > 0) {
      const penalty = conflictCount * config.conflictPenaltyRate * 10;
      totalPenalty += penalty;
      penalties.push({
        factor: 'timeframe_conflict',
        penalty: Math.round(penalty * 10) / 10,
        reason: `${conflictCount} çerçeve çelişkisi`,
      });
    }

    const disagreement = input.riskAdjustment?.indicatorDisagreement ?? 0;
    if (disagreement > 0.3) {
      const penalty = disagreement * config.disagreementPenaltyRate * 100;
      totalPenalty += penalty;
      penalties.push({
        factor: 'indicator_disagreement',
        penalty: Math.round(penalty * 10) / 10,
        reason: `Gösterge çelişkisi: ${(disagreement * 100).toFixed(0)}%`,
      });
    }

    const reliability = input.riskAdjustment?.historicalReliability ?? 50;
    if (reliability < 40) {
      const penalty = ((40 - reliability) / 40) * config.reliabilityPenaltyRate * 100;
      totalPenalty += penalty;
      penalties.push({
        factor: 'low_reliability',
        penalty: Math.round(penalty * 10) / 10,
        reason: `Düşük güvenilirlik: ${reliability.toFixed(1)}`,
      });
    }

    totalPenalty = Math.min(totalPenalty, config.maxPenalty);
    const adjustedScore = Math.max(0, 100 - totalPenalty);
    const adjustmentFactor = adjustedScore / 100;

    return {
      adjustedScore,
      adjustmentFactor,
      penalties,
    };
  }

  private calculateConfidenceScore(
    componentScores: Record<string, number>,
    consensus: any,
    riskAdjustment: RiskAdjustmentOutput,
  ): number {
    const scores = Object.values(componentScores).filter(s => !isNaN(s));
    const variance = this.calculateVariance(scores);
    const varianceScore = Math.max(0, 1 - variance / 1000);

    const consensusScore = consensus.overallConsensus;
    const riskScore = Math.max(0, 1 - riskAdjustment.penalties.length * 0.1);

    return Math.min(1, (varianceScore * 0.4 + consensusScore * 0.4 + riskScore * 0.2));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
}
