import { Injectable } from '@nestjs/common';
import { AnalystResult } from '../analyst/analyst.types';
import { DecisionResult } from '../decision/decision.types';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EliteScoreResult } from '../ai-elite-score/elite-score.types';
import { TomorrowCandidateResult } from '../tomorrow/tomorrow.types';
import { VerificationResult, CatalystResultDto } from '../research/interfaces/verification.types';
import { IndicatorResult } from '../indicators/indicator.types';
import { PortfolioOptimizationInput, PortfolioOptimizationResult, SectorAllocation, PositionWeight } from './portfolio-optimization.types';

@Injectable()
export class PortfolioOptimizationEngine {
  optimize(input: PortfolioOptimizationInput): PortfolioOptimizationResult {
    const portfolioScore = this.calculatePortfolioScore(input);
    const riskScore = this.calculateRiskScore(input);
    const diversificationScore = this.calculateDiversificationScore(input);
    const sectorDistribution = this.calculateSectorDistribution(input);
    const expectedReturn = this.calculateExpectedReturn(input);
    const expectedRisk = this.calculateExpectedRisk(input);
    const volatility = this.calculateVolatility(input);
    const maxDrawdownEstimate = this.calculateMaxDrawdownEstimate(input);
    const sharpeEstimate = this.calculateSharpeEstimate(expectedReturn, expectedRisk);
    const betaEstimate = this.calculateBetaEstimate(input);
    const correlationMatrix = this.calculateCorrelationMatrix(input);
    const positionWeights = this.calculatePositionWeights(input, portfolioScore, riskScore, diversificationScore);
    const suggestedAllocation = this.calculateSuggestedAllocation(input, positionWeights);
    const cashRatio = this.calculateCashRatio(input);
    const sectorLimits = this.calculateSectorLimits(input);
    const aiComment = this.generateAIComment(input, portfolioScore, riskScore, diversificationScore);
    const warnings = this.buildWarnings(input, portfolioScore, riskScore, diversificationScore);
    const strengths = this.buildStrengths(input, portfolioScore, riskScore, diversificationScore);
    const weaknesses = this.buildWeaknesses(input, portfolioScore, riskScore, diversificationScore);
    const recommendedActions = this.buildRecommendedActions(input, portfolioScore, riskScore, diversificationScore);

    return {
      ticker: input.ticker,
      company: input.company,
      portfolioScore,
      riskScore,
      diversificationScore,
      sectorDistribution,
      expectedReturn,
      expectedRisk,
      volatility,
      maxDrawdownEstimate,
      sharpeEstimate,
      betaEstimate,
      correlationMatrix,
      positionWeights,
      suggestedAllocation,
      cashRatio,
      sectorLimits,
      aiComment,
      warnings,
      strengths,
      weaknesses,
      recommendedActions,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private calculatePortfolioScore(input: PortfolioOptimizationInput): number {
    const scores: number[] = [];

    if (input.analystResult) {
      const score = this.scoreFromAnalystResult(input.analystResult);
      scores.push(score);
    }

    if (input.decisionResult) {
      const decision = input.decisionResult.decision;
      if (decision === 'GÜÇLÜ_AL' || decision === 'AL') scores.push(85);
      else if (decision === 'İZLE' || decision === 'BEKLE') scores.push(55);
      else if (decision === 'RİSKLİ' || decision === 'SAT' || decision === 'GÜÇLÜ_SAT') scores.push(25);
    }

    if (input.opportunityResult) {
      const level = input.opportunityResult.level;
      if (level === 'ÇOK_GÜÇLÜ_FIRSAT') scores.push(95);
      else if (level === 'GÜÇLÜ_FIRSAT') scores.push(75);
      else if (level === 'FIRSAT') scores.push(55);
      else if (level === 'İZLEME_LISTESI') scores.push(50);
      else scores.push(30);
    }

    if (input.eliteScoreResult) {
      const daily = input.eliteScoreResult.horizons.find((h) => h.horizon === 'GUNLUK');
      if (daily && daily.skor >= 70) scores.push(85);
      else if (daily && daily.skor >= 40) scores.push(60);
      else if (daily) scores.push(35);
    }

    if (input.tomorrowResult) {
      if (input.tomorrowResult.tomorrowConfidence >= 70) scores.push(80);
      else if (input.tomorrowResult.tomorrowConfidence >= 40) scores.push(55);
      else scores.push(30);
    }

    if (input.verificationResult && input.verificationResult.totalEvidence > 0) {
      const ratio = input.verificationResult.verifiedCount / input.verificationResult.totalEvidence;
      if (ratio >= 0.5) scores.push(80);
      else if (ratio > 0) scores.push(55);
      else scores.push(30);
    }

    if (input.catalysts && input.catalysts.length > 0) {
      const bullish = input.catalysts.filter((c) => c.direction === 'Bullish').length;
      const bearish = input.catalysts.filter((c) => c.direction === 'Bearish').length;
      if (bullish > bearish) scores.push(70);
      else if (bullish === bearish) scores.push(50);
      else scores.push(35);
    }

    if (scores.length === 0) return 50;

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  private scoreFromAnalystResult(result: AnalystResult): number {
    let score = 50;

    if (result.positiveSignals && result.positiveSignals.length > 0) {
      score = Math.min(100, score + result.positiveSignals.length * 5);
    }

    if (result.negativeSignals && result.negativeSignals.length > 0) {
      score = Math.max(0, score - result.negativeSignals.length * 5);
    }

    if (result.strengths && result.strengths.length > 0) {
      score = Math.min(100, score + result.strengths.length * 3);
    }

    if (result.warnings && result.warnings.length > 0) {
      score = Math.max(0, score - result.warnings.length * 3);
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateRiskScore(input: PortfolioOptimizationInput): number {
    const riskScores: number[] = [];

    if (input.opportunityResult?.risk != null) {
      riskScores.push(input.opportunityResult.risk);
    }

    if (input.analystResult?.riskAnalizi) {
      const riskText = input.analystResult.riskAnalizi;
      if (riskText.includes('düşük')) riskScores.push(25);
      else if (riskText.includes('orta')) riskScores.push(50);
      else if (riskText.includes('yüksek')) riskScores.push(75);
    }

    if (input.decisionResult?.decisionScore != null) {
      riskScores.push(input.decisionResult.decisionScore);
    }

    if (input.eliteScoreResult) {
      const daily = input.eliteScoreResult.horizons.find((h) => h.horizon === 'GUNLUK');
      if (daily) {
        const eliteRisk = 100 - daily.skor;
        riskScores.push(eliteRisk);
      }
    }

    if (riskScores.length === 0) return 50;

    return Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length);
  }

  private calculateDiversificationScore(input: PortfolioOptimizationInput): number {
    const scores: number[] = [];

    if (input.opportunityResult?.tags && input.opportunityResult.tags.length > 0) {
      scores.push(Math.min(100, input.opportunityResult.tags.length * 15));
    }

    if (input.sector != null) {
      scores.push(60);
    }

    if (input.analystResult?.strengths && input.analystResult.strengths.length > 0) {
      scores.push(Math.min(100, input.analystResult.strengths.length * 10));
    }

    if (scores.length === 0) return 40;

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  private calculateSectorDistribution(input: PortfolioOptimizationInput): SectorAllocation[] {
    const sectors = new Map<string, number>();

    if (input.opportunityResult?.tags) {
      for (const tag of input.opportunityResult.tags) {
        const sector = this.mapTagToSector(String(tag));
        sectors.set(sector, (sectors.get(sector) ?? 0) + 1);
      }
    }

    if (input.decisionResult?.decisionLabel) {
      const label = input.decisionResult.decisionLabel;
      const sector = this.mapDecisionToSector(label);
      sectors.set(sector, (sectors.get(sector) ?? 0) + 1);
    }

    if (sectors.size === 0) {
      return [{ sector: 'Belirsiz', weight: 100 }];
    }

    const total = Array.from(sectors.values()).reduce((a, b) => a + b, 0);
    return Array.from(sectors.entries()).map(([sector, count]) => ({
      sector,
      weight: Math.round((count / total) * 100),
    }));
  }

  private mapTagToSector(tag: string): string {
    const sectorMap: Record<string, string> = {
      'banka': 'Bankacılık',
      'enerji': 'Enerji',
      'teknoloji': 'Teknoloji',
      'sınai': 'Sınai',
      'tüketici': 'Tüketici',
      'finansal': 'Finansal',
      'sığorta': 'Sığorta',
      'gayrimenkul': 'Gayrimenkul',
      'altyapı': 'Altyapı',
      'gıda': 'Gıda',
      'sağlık': 'Sağlık',
      'telekom': 'Telekomünikasyon',
    };

    for (const [key, sector] of Object.entries(sectorMap)) {
      if (tag.toLowerCase().includes(key)) return sector;
    }

    return 'Diğer';
  }

  private mapDecisionToSector(decisionLabel: string): string {
    if (decisionLabel.includes('Al') || decisionLabel.includes('AL')) return 'Alım';
    if (decisionLabel.includes('Sat') || decisionLabel.includes('SAT')) return 'Satım';
    if (decisionLabel.includes('İzle') || decisionLabel.includes('İZLE')) return 'İzleme';
    return 'Karar';
  }

  private calculateExpectedReturn(input: PortfolioOptimizationInput): number {
    let score = 50;

    if (input.opportunityResult?.momentum != null) {
      score = (score + input.opportunityResult.momentum) / 2;
    }

    if (input.analystResult?.momentumAnalizi) {
      const momentumText = input.analystResult.momentumAnalizi;
      if (momentumText.includes('kuvvetli')) score = Math.min(100, score + 15);
      else if (momentumText.includes('orta')) score = Math.min(100, score + 5);
    }

    if (input.decisionResult?.confidence != null) {
      score = (score + input.decisionResult.confidence) / 2;
    }

    return Math.round(score);
  }

  private calculateExpectedRisk(input: PortfolioOptimizationInput): number {
    let score = 50;

    if (input.opportunityResult?.risk != null) {
      score = (score + input.opportunityResult.risk) / 2;
    }

    if (input.analystResult?.riskAnalizi) {
      const riskText = input.analystResult.riskAnalizi;
      if (riskText.includes('düşük')) score = Math.max(0, score - 20);
      else if (riskText.includes('yüksek')) score = Math.min(100, score + 20);
    }

    if (input.eliteScoreResult) {
      const daily = input.eliteScoreResult.horizons.find((h) => h.horizon === 'GUNLUK');
      if (daily) {
        score = (score + (100 - daily.skor)) / 2;
      }
    }

    return Math.round(score);
  }

  private calculateVolatility(input: PortfolioOptimizationInput): number {
    let vol = 30;

    if (input.analystResult?.riskAnalizi) {
      const riskText = input.analystResult.riskAnalizi;
      if (riskText.includes('yüksek')) vol = Math.min(100, vol + 20);
      else if (riskText.includes('düşük')) vol = Math.max(5, vol - 15);
    }

    if (input.opportunityResult?.momentum != null) {
      vol = Math.round(vol * (0.5 + input.opportunityResult.momentum / 200));
    }

    return Math.max(5, Math.min(100, vol));
  }

  private calculateMaxDrawdownEstimate(input: PortfolioOptimizationInput): number {
    let drawdown = 20;

    if (input.opportunityResult?.risk != null) {
      drawdown = Math.round(input.opportunityResult.risk * 0.3);
    }

    if (input.analystResult?.riskAnalizi) {
      const riskText = input.analystResult.riskAnalizi;
      if (riskText.includes('yüksek')) drawdown = Math.min(80, drawdown + 15);
    }

    return Math.min(80, Math.max(5, drawdown));
  }

  private calculateSharpeEstimate(expectedReturn: number, expectedRisk: number): number {
    if (expectedRisk === 0) return 0;
    return Math.round(((expectedReturn - 5) / expectedRisk) * 100) / 100;
  }

  private calculateBetaEstimate(input: PortfolioOptimizationInput): number {
    let beta = 1.0;

    if (input.opportunityResult?.momentum != null) {
      const momentumFactor = input.opportunityResult.momentum / 50;
      beta = Math.round(beta * momentumFactor * 100) / 100;
    }

    return Math.max(0.1, Math.min(3.0, beta));
  }

  private calculateCorrelationMatrix(input: PortfolioOptimizationInput): Record<string, number> {
    const correlations: Record<string, number> = {};

    if (input.opportunityResult?.confidence != null) {
      correlations['opportunity'] = input.opportunityResult.confidence / 100;
    }

    if (input.decisionResult?.confidence != null) {
      correlations['decision'] = input.decisionResult.confidence / 100;
    }

    if (input.eliteScoreResult) {
      const daily = input.eliteScoreResult.horizons.find((h) => h.horizon === 'GUNLUK');
      if (daily) {
        correlations['eliteScore'] = daily.skor / 100;
      }
    }

    if (Object.keys(correlations).length === 0) {
      correlations['default'] = 0.5;
    }

    return correlations;
  }

  private calculatePositionWeights(
    input: PortfolioOptimizationInput,
    portfolioScore: number,
    riskScore: number,
    diversificationScore: number,
  ): PositionWeight[] {
    const baseWeight = Math.round((portfolioScore * 0.4 + diversificationScore * 0.3 + (100 - riskScore) * 0.3));
    const maxWeight = Math.min(25, Math.max(5, Math.round(baseWeight / 4)));
    const minWeight = Math.max(1, Math.round(maxWeight * 0.2));

    return [
      { symbol: input.ticker, weight: maxWeight, minWeight, maxWeight, reason: 'AI optimizasyonuna göre önerilen ağırlık' },
    ];
  }

  private calculateSuggestedAllocation(
    input: PortfolioOptimizationInput,
    positionWeights: PositionWeight[],
  ): Record<string, number> {
    const allocation: Record<string, number> = {};
    for (const pw of positionWeights) {
      allocation[pw.symbol] = pw.weight;
    }
    return allocation;
  }

  private calculateCashRatio(input: PortfolioOptimizationInput): number {
    let cashRatio = 20;

    if (input.opportunityResult?.risk != null && input.opportunityResult.risk > 60) {
      cashRatio = Math.min(50, cashRatio + 15);
    }

    if (input.decisionResult?.decision === 'SAT' || input.decisionResult?.decision === 'GÜÇLÜ_SAT') {
      cashRatio = Math.min(60, cashRatio + 20);
    }

    if (input.verificationResult && input.verificationResult.conflicts.length > 0) {
      cashRatio = Math.min(55, cashRatio + 10);
    }

    return cashRatio;
  }

  private calculateSectorLimits(input: PortfolioOptimizationInput): Record<string, number> {
    return {
      'Bankacılık': 30,
      'Enerji': 25,
      'Teknoloji': 25,
      'Sınai': 20,
      'Tüketici': 20,
      'Finansal': 20,
      'Sığorta': 15,
      'Gayrimenkul': 15,
      'Altyapı': 15,
      'Gıda': 15,
      'Sağlık': 15,
      'Telekomünikasyon': 15,
      'Diğer': 10,
    };
  }

  private generateAIComment(
    input: PortfolioOptimizationInput,
    portfolioScore: number,
    riskScore: number,
    diversificationScore: number,
  ): string {
    const parts: string[] = [];

    if (portfolioScore >= 70) {
      parts.push('Portföy skoru yüksek.');
    } else if (portfolioScore >= 40) {
      parts.push('Portföy skoru orta.');
    } else {
      parts.push('Portföy skoru düşük.');
    }

    if (riskScore <= 40) {
      parts.push('Risk seviyesi düşük.');
    } else if (riskScore <= 70) {
      parts.push('Risk seviyesi orta.');
    } else {
      parts.push('Risk seviyesi yüksek.');
    }

    if (diversificationScore >= 60) {
      parts.push('Diversifikasyon güçlü.');
    } else if (diversificationScore >= 30) {
      parts.push('Diversifikasyon orta.');
    } else {
      parts.push('Diversifikasyon zayıf.');
    }

    if (input.opportunityResult?.level === 'ÇOK_GÜÇLÜ_FIRSAT' || input.opportunityResult?.level === 'GÜÇLÜ_FIRSAT') {
      parts.push('Fırsat seviyesi yüksek.');
    }

    const decision = input.decisionResult?.decision;
    if (decision === 'GÜÇLÜ_AL' || decision === 'AL') {
      parts.push('Alım kararı destekleniyor.');
    } else if (decision === 'SAT' || decision === 'GÜÇLÜ_SAT') {
      parts.push('Satım kararı öneriliyor.');
    } else {
      parts.push('Tutma kararı öneriliyor.');
    }

    if (parts.length === 0) {
      return 'Portföy analizi veri bekleniyor.';
    }

    return parts.join(' ');
  }

  private buildWarnings(
    input: PortfolioOptimizationInput,
    portfolioScore: number,
    riskScore: number,
    diversificationScore: number,
  ): string[] {
    const warnings: string[] = [];

    if (riskScore > 70) {
      warnings.push('Yüksek risk seviyesi tespit edildi');
    }

    if (diversificationScore < 30) {
      warnings.push('Diversifikasyon zayıf');
    }

    if (portfolioScore < 40) {
      warnings.push('Portföy skoru düşük');
    }

    if (input.verificationResult && input.verificationResult.conflicts.length > 0) {
      warnings.push('Çelişkili veri tespit edildi');
    }

    if (input.catalysts && input.catalysts.filter((c) => c.direction === 'Bearish').length > 0) {
      warnings.push('Negatif katalizör mevcut');
    }

    return warnings;
  }

  private buildStrengths(
    input: PortfolioOptimizationInput,
    portfolioScore: number,
    riskScore: number,
    diversificationScore: number,
  ): string[] {
    const strengths: string[] = [];

    if (portfolioScore >= 70) {
      strengths.push('Yüksek portföy skoru');
    }

    if (riskScore <= 40) {
      strengths.push('Düşük risk seviyesi');
    }

    if (diversificationScore >= 60) {
      strengths.push('Güçlü diversifikasyon');
    }

    if (input.verificationResult && input.verificationResult.verifiedCount > 0) {
      strengths.push('Doğrulanmış veri mevcut');
    }

    if (input.opportunityResult?.positiveSignals) {
      strengths.push(...input.opportunityResult.positiveSignals);
    }

    if (input.decisionResult?.positiveSignals) {
      strengths.push(...input.decisionResult.positiveSignals);
    }

    return [...new Set(strengths)];
  }

  private buildWeaknesses(
    input: PortfolioOptimizationInput,
    portfolioScore: number,
    riskScore: number,
    diversificationScore: number,
  ): string[] {
    const weaknesses: string[] = [];

    if (portfolioScore < 40) {
      weaknesses.push('Düşük portföy skoru');
    }

    if (riskScore > 70) {
      weaknesses.push('Yüksek risk seviyesi');
    }

    if (diversificationScore < 30) {
      weaknesses.push('Zayıf diversifikasyon');
    }

    if (input.verificationResult && input.verificationResult.conflicts.length > 0) {
      weaknesses.push('Çelişkili veri tespit edildi');
    }

    if (input.catalysts && input.catalysts.filter((c) => c.direction === 'Bearish').length > 0) {
      weaknesses.push('Negatif katalizör mevcut');
    }

    if (input.opportunityResult?.negativeSignals) {
      weaknesses.push(...input.opportunityResult.negativeSignals);
    }

    if (input.decisionResult?.negativeSignals) {
      weaknesses.push(...input.decisionResult.negativeSignals);
    }

    return [...new Set(weaknesses)];
  }

  private buildRecommendedActions(
    input: PortfolioOptimizationInput,
    portfolioScore: number,
    riskScore: number,
    diversificationScore: number,
  ): string[] {
    const actions: string[] = [];

    if (portfolioScore >= 70 && riskScore <= 50) {
      actions.push('Alım önerilir');
    } else if (portfolioScore >= 40 && riskScore <= 60) {
      actions.push('Tutma önerilir');
    } else if (riskScore > 70) {
      actions.push('Risk azaltılması önerilir');
    } else {
      actions.push('Gözlem önerilir');
    }

    if (diversificationScore < 30) {
      actions.push('Diversifikasyon artırılması önerilir');
    }

    if (input.opportunityResult?.level === 'ÇOK_GÜÇLÜ_FIRSAT') {
      actions.push('Kuvvetli fırsat tespit edildi');
    }

    const decision = input.decisionResult?.decision;
    if (decision === 'GÜÇLÜ_AL' || decision === 'AL') {
      actions.push('Alım sinyali güçlü');
    } else if (decision === 'SAT' || decision === 'GÜÇLÜ_SAT') {
      actions.push('Satım sinyali güçlü');
    }

    return actions;
  }
}