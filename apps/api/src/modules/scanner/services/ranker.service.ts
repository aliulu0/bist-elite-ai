import { Injectable } from '@nestjs/common';
import { OpportunityResult } from '../../opportunity-detection/opportunity-detection.types';
import { ScannerResult, ScannerRankingConfig, ScanHistoryEntry } from '../scanner.types';

@Injectable()
export class Ranker {
  private readonly config: ScannerRankingConfig;

  constructor(config: ScannerRankingConfig) {
    this.config = config;
  }

  calculateScannerScore(
    opportunity: OpportunityResult,
    analysisScore: number,
    history: ScanHistoryEntry[],
    duplicateCount: number,
  ): number {
    const riskScore = this.calculateRisk(opportunity.risks, opportunity.warnings);
    const freshness = this.calculateFreshness(opportunity.timestamp);
    const ageFactor = this.calculateAgeFactor(opportunity.age);
    const providerConfidence = opportunity.metadata?.providerConfidence ?? 50;
    const aggregationQuality = opportunity.metadata?.aggregationQuality ?? 50;
    const financialQuality = this.extractFinancialQuality(opportunity);
    const trendStrength = this.extractTrendStrength(opportunity);
    const momentum = this.extractMomentum(opportunity);
    const liquidity = this.extractLiquidity(opportunity);
    const sectorStrength = this.extractSectorStrength(opportunity);
    const valuation = this.extractValuation(opportunity);
    const penaltyScore = opportunity.penalties.reduce((sum, p) => sum + p.amount, 0);
    const previousScore = history.length > 0 ? history[history.length - 1].scannerScore : null;
    const duplicatePenalty = duplicateCount * 3;

    const score =
      opportunity.opportunityScore * this.config.opportunityScoreWeight +
      opportunity.confidence * this.config.confidenceWeight +
      (100 - riskScore) * this.config.riskWeight +
      freshness * this.config.freshnessWeight +
      ageFactor * this.config.ageWeight +
      providerConfidence * this.config.providerConfidenceWeight +
      aggregationQuality * this.config.aggregationQualityWeight +
      analysisScore * this.config.aiAnalysisScoreWeight +
      financialQuality * this.config.financialQualityWeight +
      trendStrength * this.config.trendStrengthWeight +
      momentum * this.config.momentumWeight +
      liquidity * this.config.liquidityWeight +
      sectorStrength * this.config.sectorStrengthWeight +
      valuation * this.config.valuationWeight +
      penaltyScore * this.config.penaltyWeight +
      duplicatePenalty * this.config.duplicatePenaltyWeight;

    return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
  }

  calculateRisk(risks: string[], warnings: string[]): number {
    return Math.min(100, risks.length * 15 + warnings.length * 10);
  }

  private calculateFreshness(timestamp: string): number {
    const age = Date.now() - new Date(timestamp).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (age < oneDay) return 100;
    if (age < 3 * oneDay) return 80;
    if (age < 7 * oneDay) return 60;
    if (age < 30 * oneDay) return 40;
    return 20;
  }

  private calculateAgeFactor(age: string): number {
    switch (age) {
      case 'NEW': return 100;
      case 'GROWING': return 85;
      case 'STABLE': return 60;
      case 'WEAKENING': return 30;
      case 'EXPIRED': return 5;
      default: return 50;
    }
  }

  private extractFinancialQuality(opportunity: OpportunityResult): number {
    const metric = opportunity.supportingMetrics.find(
      (m) => m.module === 'financialQuality' || m.name.includes('financial'),
    );
    return metric && typeof metric.value === 'number' ? metric.value : 50;
  }

  private extractTrendStrength(opportunity: OpportunityResult): number {
    const metric = opportunity.supportingMetrics.find(
      (m) => m.module === 'trendTransition' || m.name.includes('trend'),
    );
    return metric && typeof metric.value === 'number' ? metric.value : 50;
  }

  private extractMomentum(opportunity: OpportunityResult): number {
    const metric = opportunity.supportingMetrics.find(
      (m) => m.module === 'momentumShift' || m.name.includes('momentum'),
    );
    return metric && typeof metric.value === 'number' ? metric.value : 50;
  }

  private extractLiquidity(opportunity: OpportunityResult): number {
    const metric = opportunity.supportingMetrics.find(
      (m) => m.module === 'liquidityImprovement' || m.name.includes('liquidity'),
    );
    return metric && typeof metric.value === 'number' ? metric.value : 50;
  }

  private extractSectorStrength(opportunity: OpportunityResult): number {
    const metric = opportunity.supportingMetrics.find(
      (m) => m.module === 'sectorStrength' || m.name.includes('sector'),
    );
    return metric && typeof metric.value === 'number' ? metric.value : 50;
  }

  private extractValuation(opportunity: OpportunityResult): number {
    const metric = opportunity.supportingMetrics.find(
      (m) => m.module === 'valuationDiscount' || m.name.includes('valuation'),
    );
    return metric && typeof metric.value === 'number' ? metric.value : 50;
  }
}
