import { Injectable } from '@nestjs/common';
import {
  CONCENTRATION_THRESHOLDS,
  DIVERSIFICATION_SCORE_CONCENTRATION_PENALTY,
  HORIZON_RANKING,
  PORTFOLIO_INTELLIGENCE_VERSION,
  PORTFOLIO_SCORE_MAX,
  PORTFOLIO_SCORE_MIN,
  PORTFOLIO_STATUS_LABELS,
  PORTFOLIO_STATUS_THRESHOLDS,
  PORTFOLIO_INTELLIGENCE_WEIGHTS,
  POSITION_STATUS_EXIT_HIGH_RISK_SCORE,
  POSITION_STATUS_EXIT_MAX_PNL_PERCENT,
  POSITION_STATUS_HOLD_MIN_SCORE,
  POSITION_STATUS_STRONG_HOLD_MIN_SCORE,
  POSITION_STATUS_WATCH_MIN_SCORE,
  REBALANCE_ACTION,
  REBALANCE_TARGET_BANDS,
  SCENARIO_BEAR_DOWNSIDE_WEIGHT,
  SCENARIO_BULL_UPSIDE_WEIGHT,
  PortfolioStatusKey,
} from './portfolio-intelligence.config';
import {
  HorizonMetric,
  HorizonResult,
  OpportunityFit,
  PortfolioAnalysis,
  PortfolioOpportunity,
  PortfolioOpportunities,
  PortfolioRisk,
  PortfolioScenario,
  PortfolioScoreBreakdown,
  PositionAnalysis,
  RebalanceRecommendation,
  ScenarioPosition,
  ScenarioResult,
} from './portfolio-intelligence.types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function safeNumber(value: number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  return Number.isFinite(value) ? value : fallback;
}

@Injectable()
export class PortfolioIntelligenceEngine {
  classifyStatusKey(score: number): PortfolioStatusKey {
    if (score >= PORTFOLIO_STATUS_THRESHOLDS.VERY_STRONG) return 'VERY_STRONG';
    if (score >= PORTFOLIO_STATUS_THRESHOLDS.STRONG) return 'STRONG';
    if (score >= PORTFOLIO_STATUS_THRESHOLDS.BALANCED) return 'BALANCED';
    if (score >= PORTFOLIO_STATUS_THRESHOLDS.WARNING) return 'WARNING';
    return 'HIGH_RISK';
  }

  buildPositionAnalysis(position: PositionAnalysis): PositionAnalysis {
    return position;
  }

  analyzePortfolio(
    positions: PositionAnalysis[],
    cash = 0,
    generatedAt = new Date().toISOString(),
  ): PortfolioAnalysis {
    const risk = this.computePortfolioRisk(positions, cash);
    const breakdown = this.computeScoreBreakdown(positions, risk);
    const score = this.computePortfolioScore(breakdown);
    const statusKey = this.classifyStatusKey(score);
    const sectorAllocation = this.computeSectorAllocation(positions);
    const rebalance = this.computeRebalance(positions, sectorAllocation);
    const scenarios = this.computeScenarios(positions, risk);
    const horizons = this.computeHorizons(positions);
    const opportunities = this.buildOpportunitiesSection(positions, risk);
    const recommendations = this.buildRecommendations(positions, rebalance);

    return {
      version: PORTFOLIO_INTELLIGENCE_VERSION,
      generatedAt,
      statusKey,
      statusLabel: PORTFOLIO_STATUS_LABELS[statusKey],
      score: round(score),
      scoreBreakdown: breakdown,
      risk,
      positions,
      sectorAllocation,
      rebalance,
      scenarios,
      horizons,
      opportunities,
      recommendations,
    };
  }

  computePortfolioRisk(positions: PositionAnalysis[], cash = 0): PortfolioRisk {
    const totalValue = positions.reduce((sum, p) => sum + p.positionValue, 0);
    const investedCapital = positions.reduce((sum, p) => sum + p.investedCapital, 0);
    const unrealizedPnl = totalValue - investedCapital;
    const unrealizedPnlPercent = investedCapital > 0 ? (unrealizedPnl / investedCapital) * 100 : 0;

    let maxPositionWeight = 0;
    let maxPositionTicker: string | null = null;
    let minPositionWeight = totalValue > 0 ? Number.POSITIVE_INFINITY : 0;
    for (const p of positions) {
      if (p.portfolioWeight > maxPositionWeight) {
        maxPositionWeight = p.portfolioWeight;
        maxPositionTicker = p.ticker;
      }
      if (totalValue > 0 && p.portfolioWeight < minPositionWeight) {
        minPositionWeight = p.portfolioWeight;
      }
    }
    if (totalValue > 0 && minPositionWeight === Number.POSITIVE_INFINITY) minPositionWeight = 0;

    const byWeight = [...positions].sort((a, b) => b.portfolioWeight - a.portfolioWeight);
    const top3Concentration =
      byWeight.slice(0, 3).reduce((sum, p) => sum + p.portfolioWeight, 0) / 100;
    const top5Concentration =
      byWeight.slice(0, 5).reduce((sum, p) => sum + p.portfolioWeight, 0) / 100;

    const sectorMap = new Map<string, number>();
    for (const p of positions) {
      sectorMap.set(p.sector || 'Diğer', (sectorMap.get(p.sector || 'Diğer') ?? 0) + p.portfolioWeight);
    }
    let sectorConcentration = 0;
    let sectorConcentrationSector: string | null = null;
    for (const [sector, weight] of sectorMap.entries()) {
      if (weight > sectorConcentration) {
        sectorConcentration = weight;
        sectorConcentrationSector = sector;
      }
    }
    sectorConcentration = sectorConcentration / 100;

    const n = positions.length;
    const diversificationScore =
      n === 0
        ? 0
        : clamp(
            100 - DIVERSIFICATION_SCORE_CONCENTRATION_PENALTY * (top5Concentration * 100) / 100 + n * 3,
            PORTFOLIO_SCORE_MIN,
            PORTFOLIO_SCORE_MAX,
          );

    const weightedRisk = this.weightedByValue(positions, (p) => p.riskScore);
    const portfolioRiskScore = clamp(weightedRisk, 0, 100);
    const portfolioConfidence = this.weightedByValue(positions, (p) => p.confidence);
    const portfolioOpportunityScore = this.weightedByValue(positions, (p) => p.earlyOpportunityScore);
    const portfolioExpectedReturn = this.weightedByValue(positions, (p) => p.expectedReturn);
    const portfolioDownsideRisk = this.weightedByValue(positions, (p) => {
      const stopDistance = p.currentPrice > 0 && p.stop !== null ? ((p.currentPrice - p.stop) / p.currentPrice) * 100 : 0;
      return Math.max(0, stopDistance);
    });
    const portfolioRiskReward =
      portfolioDownsideRisk > 0 ? portfolioExpectedReturn / portfolioDownsideRisk : 0;

    const warnings = this.buildConcentrationWarnings(positions, {
      single: maxPositionWeight / 100,
      sector: sectorConcentration,
      top3: top3Concentration,
      top5: top5Concentration,
      lowConfidence: this.weightShare(positions, (p) => p.confidence < 50) / 100,
      lowLiquidity: this.weightShare(positions, (p) => p.liquidityQuality === 'low') / 100,
      weakSmartMoney: this.weightShare(positions, (p) => (p.smartMoneyScore ?? 0) < 50) / 100,
      negativeCatalyst: this.weightShare(positions, (p) => (p.catalystScore ?? 0) < 50) / 100,
      weakVerification: this.weightShare(positions, (p) => p.verificationStatus === 'unverified') / 100,
    });

    return {
      totalValue: round(totalValue),
      investedCapital: round(investedCapital),
      cash: round(cash),
      unrealizedPnl: round(unrealizedPnl),
      unrealizedPnlPercent: round(unrealizedPnlPercent),
      maxPositionWeight: round(maxPositionWeight),
      maxPositionTicker,
      minPositionWeight: round(minPositionWeight),
      sectorConcentration: round(sectorConcentration * 100),
      sectorConcentrationSector,
      top3Concentration: round(top3Concentration * 100),
      top5Concentration: round(top5Concentration * 100),
      diversificationScore: round(diversificationScore),
      portfolioRiskScore: round(portfolioRiskScore),
      portfolioConfidence: round(portfolioConfidence),
      portfolioOpportunityScore: round(portfolioOpportunityScore),
      portfolioExpectedReturn: round(portfolioExpectedReturn),
      portfolioDownsideRisk: round(portfolioDownsideRisk),
      portfolioRiskReward: round(portfolioRiskReward),
      warnings,
      lowLiquidityWeight: round(this.weightShare(positions, (p) => p.liquidityQuality === 'low')),
      lowConfidenceWeight: round(this.weightShare(positions, (p) => p.confidence < 50)),
      weakSmartMoneyWeight: round(this.weightShare(positions, (p) => (p.smartMoneyScore ?? 0) < 50)),
      negativeCatalystWeight: round(this.weightShare(positions, (p) => (p.catalystScore ?? 0) < 50)),
      weakVerificationWeight: round(this.weightShare(positions, (p) => p.verificationStatus === 'unverified')),
    };
  }

  private weightedByValue(positions: PositionAnalysis[], selector: (p: PositionAnalysis) => number): number {
    const total = positions.reduce((sum, p) => sum + p.positionValue, 0);
    if (total <= 0) return 0;
    const weighted = positions.reduce(
      (sum, p) => sum + selector(p) * (p.positionValue / total),
      0,
    );
    return clamp(weighted, 0, 100);
  }

  private weightShare(positions: PositionAnalysis[], predicate: (p: PositionAnalysis) => boolean): number {
    const total = positions.reduce((sum, p) => sum + p.positionValue, 0);
    if (total <= 0) return 0;
    const matching = positions.filter(predicate).reduce((sum, p) => sum + p.positionValue, 0);
    return (matching / total) * 100;
  }

  private buildConcentrationWarnings(
    positions: PositionAnalysis[],
    measures: Record<'single' | 'sector' | 'top3' | 'top5' | 'lowConfidence' | 'lowLiquidity' | 'weakSmartMoney' | 'negativeCatalyst' | 'weakVerification', number>,
  ): string[] {
    const warnings: string[] = [];
    if (positions.length === 0) {
      warnings.push('Portföyde henüz pozisyon bulunmuyor.');
      return warnings;
    }
    if (measures.single > CONCENTRATION_THRESHOLDS.singlePosition) {
      warnings.push(`Portföy ağırlığının %${round(measures.single * 100, 0)}'i tek hissede yoğunlaşıyor.`);
    }
    if (measures.sector > CONCENTRATION_THRESHOLDS.sector) {
      warnings.push(
        `Sektör ağırlığının %${round(measures.sector * 100, 0)}'i tek sektörde yoğunlaşıyor (portföy sektör konsantrasyonu).`,
      );
    }
    if (measures.top3 > CONCENTRATION_THRESHOLDS.top3) {
      warnings.push(`İlk 3 pozisyon portföyün %${round(measures.top3 * 100, 0)}'ini oluşturuyor.`);
    }
    if (measures.top5 > CONCENTRATION_THRESHOLDS.top5) {
      warnings.push(`İlk 5 pozisyon portföyün %${round(measures.top5 * 100, 0)}'ini oluşturuyor.`);
    }
    if (measures.lowConfidence > CONCENTRATION_THRESHOLDS.lowConfidence) {
      warnings.push(`Portföyün %${round(measures.lowConfidence * 100, 0)}'i düşük güven seviyeli fırsatlardan oluşuyor.`);
    }
    if (measures.lowLiquidity > CONCENTRATION_THRESHOLDS.lowLiquidity) {
      warnings.push(`Portföyün %${round(measures.lowLiquidity * 100, 0)}'i düşük likiditeli hisselerden oluşuyor.`);
    }
    if (measures.weakSmartMoney > CONCENTRATION_THRESHOLDS.weakSmartMoney) {
      warnings.push(`Portföyün %${round(measures.weakSmartMoney * 100, 0)}'i zayıf Smart Money sinyallerine sahip.`);
    }
    if (measures.negativeCatalyst > CONCENTRATION_THRESHOLDS.negativeCatalyst) {
      warnings.push(`Portföyün %${round(measures.negativeCatalyst * 100, 0)}'i negatif katalizör riski taşıyor.`);
    }
    if (measures.weakVerification > CONCENTRATION_THRESHOLDS.weakVerification) {
      warnings.push(`Portföyün %${round(measures.weakVerification * 100, 0)}'i doğrulanmamış fırsatlardan oluşuyor.`);
    }
    return warnings;
  }

  computeScoreBreakdown(
    positions: PositionAnalysis[],
    risk: PortfolioRisk,
  ): PortfolioScoreBreakdown {
    const w = PORTFOLIO_INTELLIGENCE_WEIGHTS;
    return {
      earlyOpportunity: round(this.weightedByValue(positions, (p) => p.earlyOpportunityScore)),
      eliteScore: round(this.weightedByValue(positions, (p) => p.eliteScore)),
      multiTimeframe: round(this.weightedByValue(positions, (p) => p.multiTimeframeScore ?? 50)),
      confidence: round(this.weightedByValue(positions, (p) => p.confidence)),
      smartMoney: round(this.weightedByValue(positions, (p) => p.smartMoneyScore ?? 50)),
      catalyst: round(this.weightedByValue(positions, (p) => p.catalystScore ?? 50)),
      riskInverse: round(100 - risk.portfolioRiskScore),
      liquidity: round(
        100 - this.weightShare(positions, (p) => p.liquidityQuality === 'low') * 0.5,
      ),
      verification: round(
        100 - this.weightShare(positions, (p) => p.verificationStatus === 'unverified') * 0.5,
      ),
      diversification: round(clamp(risk.diversificationScore, 0, 100)),
    };
  }

  computePortfolioScore(breakdown: PortfolioScoreBreakdown): number {
    const w = PORTFOLIO_INTELLIGENCE_WEIGHTS;
    const score =
      breakdown.earlyOpportunity * w.earlyOpportunity +
      breakdown.eliteScore * w.eliteScore +
      breakdown.multiTimeframe * w.multiTimeframe +
      breakdown.confidence * w.confidence +
      breakdown.smartMoney * w.smartMoney +
      breakdown.catalyst * w.catalyst +
      breakdown.riskInverse * w.riskInverse +
      breakdown.liquidity * w.liquidity +
      breakdown.verification * w.verification +
      breakdown.diversification * w.diversification;
    return clamp(score, PORTFOLIO_SCORE_MIN, PORTFOLIO_SCORE_MAX);
  }

  computeSectorAllocation(positions: PositionAnalysis[]): Array<{ sector: string; weight: number }> {
    const map = new Map<string, number>();
    for (const p of positions) {
      map.set(p.sector || 'Diğer', (map.get(p.sector || 'Diğer') ?? 0) + p.portfolioWeight);
    }
    return [...map.entries()]
      .map(([sector, weight]) => ({ sector, weight: round(weight) }))
      .sort((a, b) => b.weight - a.weight);
  }

  computeRebalance(
    positions: PositionAnalysis[],
    sectorAllocation: Array<{ sector: string; weight: number }>,
  ): RebalanceRecommendation[] {
    const sectorOverweight = sectorAllocation.find((s) => s.weight > 40);
    return positions.map((p) => {
      const baseMin = REBALANCE_TARGET_BANDS.defaultMin;
      const baseMax = REBALANCE_TARGET_BANDS.defaultMax;

      let recommendedMin: number = baseMin;
      let recommendedMax: number = baseMax;

      const opportunityBoost = p.earlyOpportunityScore >= 70 ? 6 : p.earlyOpportunityScore >= 55 ? 3 : 0;
      const riskPenalty = p.riskScore >= 60 ? 8 : p.riskScore >= 40 ? 3 : 0;
      const liquidityPenalty = p.liquidityQuality === 'low' ? 5 : 0;
      const sectorPenalty = sectorOverweight && p.sector === sectorOverweight.sector ? 5 : 0;

      recommendedMax = clamp(baseMax + opportunityBoost - riskPenalty - liquidityPenalty - sectorPenalty, baseMin + 2, 40);
      recommendedMin = clamp(baseMin + Math.floor(opportunityBoost / 3) - Math.ceil(riskPenalty / 3), 2, recommendedMax - 2);

      let status: RebalanceRecommendation['status'];
      let reason: string;
      let priority: RebalanceRecommendation['priority'];

      if (p.portfolioWeight > recommendedMax) {
        status = REBALANCE_ACTION.REDUCE_CONCENTRATION;
        reason = `Mevcut ağırlık (%${round(p.portfolioWeight, 0)}) önerilen üst sınırı (%${round(recommendedMax, 0)}) aşıyor.`;
        priority = p.portfolioWeight > recommendedMax + 8 ? 'HIGH' : 'MEDIUM';
      } else if (p.portfolioWeight < recommendedMin) {
        status = REBALANCE_ACTION.CONSIDER_INCREASE;
        reason = `Mevcut ağırlık (%${round(p.portfolioWeight, 0)}) önerilen alt sınırın (%${round(recommendedMin, 0)}) altında.`;
        priority = p.earlyOpportunityScore >= 70 ? 'MEDIUM' : 'LOW';
      } else {
        status = REBALANCE_ACTION.IN_RANGE;
        reason = `Mevcut ağırlık önerilen aralıkta (${round(recommendedMin, 0)}-%${round(recommendedMax, 0)}).`;
        priority = 'LOW';
      }

      return {
        ticker: p.ticker,
        company: p.company,
        currentWeight: round(p.portfolioWeight),
        recommendedMin: round(recommendedMin),
        recommendedMax: round(recommendedMax),
        status,
        reason,
        priority,
      };
    });
  }

  computeScenarios(positions: PositionAnalysis[], risk: PortfolioRisk): ScenarioResult {
    const baseReturn = risk.portfolioExpectedReturn;

    const bullSensitive = [...positions]
      .map((p): ScenarioPosition => ({
        ticker: p.ticker,
        expectedReturn: p.expectedReturn,
        weight: p.portfolioWeight,
      }))
      .sort((a, b) => b.expectedReturn - a.expectedReturn)
      .slice(0, 3);

    const bearSensitive = [...positions]
      .map((p): ScenarioPosition => ({
        ticker: p.ticker,
        expectedReturn: p.expectedReturn,
        weight: p.portfolioWeight,
      }))
      .sort((a, b) => a.expectedReturn - b.expectedReturn)
      .slice(0, 3);

    const bullUpside = this.weightedByValue(positions, (p) => {
      const target1 = safeNumber(p.target1, p.currentPrice);
      if (p.currentPrice > 0 && target1 > 0) {
        return ((target1 - p.currentPrice) / p.currentPrice) * 100;
      }
      return Math.max(0, p.expectedReturn);
    });
    const bearDownside = this.weightedByValue(positions, (p) => {
      const stop = safeNumber(p.stop, 0);
      if (p.currentPrice > 0 && stop > 0) {
        return ((p.currentPrice - stop) / p.currentPrice) * 100;
      }
      return Math.max(0, -p.expectedReturn);
    });

    const bullReturn = baseReturn + bullUpside * SCENARIO_BULL_UPSIDE_WEIGHT;
    const bearReturn = baseReturn - bearDownside * SCENARIO_BEAR_DOWNSIDE_WEIGHT;

    const bull: PortfolioScenario = {
      name: 'Bull',
      expectedPortfolioReturn: round(bullReturn),
      risk: this.riskLabel(risk.portfolioRiskScore),
      mainDrivers: this.topDrivers(positions, 'bull'),
      mainRisks: ['Piyasa geneli sert düzeltme', 'Katalizörlerin gerçekleşmemesi'],
      mostSensitivePositions: bullSensitive,
      explanation: 'Bull senaryosu, pozisyonların hedef fiyatlarına ulaştığı ve mevcut beklenen getirilerin korunduğu varsayımına dayanır.',
    };

    const base: PortfolioScenario = {
      name: 'Base',
      expectedPortfolioReturn: round(baseReturn),
      risk: this.riskLabel(risk.portfolioRiskScore),
      mainDrivers: this.topDrivers(positions, 'base'),
      mainRisks: ['Yüksek pozisyon konsantrasyonu', 'Düşük güven seviyeli pozisyonlar'],
      mostSensitivePositions: bullSensitive,
      explanation: 'Base senaryo, mevcut AI beklenen getiri ortalamasını temel alır; ek iyimserlik veya kötümserlik uygulanmaz.',
    };

    const bear: PortfolioScenario = {
      name: 'Bear',
      expectedPortfolioReturn: round(bearReturn),
      risk: this.riskLabel(Math.min(100, risk.portfolioRiskScore + 15)),
      mainDrivers: this.topDrivers(positions, 'bear'),
      mainRisks: ['Stop seviyelerinin tetiklenmesi', 'Negatif katalizörler', 'Likidite daralması'],
      mostSensitivePositions: bearSensitive,
      explanation: 'Bear senaryo, stop seviyelerinin tetiklendiği kötümser varsayımına dayanır.',
    };

    return { bull, base, bear };
  }

  private riskLabel(riskScore: number): string {
    if (riskScore < 30) return 'Düşük';
    if (riskScore < 60) return 'Orta';
    return 'Yüksek';
  }

  private topDrivers(positions: PositionAnalysis[], scenario: 'bull' | 'base' | 'bear'): string[] {
    const sorted = [...positions].sort((a, b) => b.portfolioWeight - a.portfolioWeight);
    const top = sorted.slice(0, 3);
    if (scenario === 'bull') {
      return top.map((p) => `${p.ticker} (beklenen getiri %${round(p.expectedReturn, 1)})`);
    }
    if (scenario === 'bear') {
      return top.map((p) => `${p.ticker} (stop mesafesi ${p.stop ? round(((p.currentPrice - p.stop) / p.currentPrice) * 100, 1) : 0}%)`);
    }
    return top.map((p) => `${p.ticker} (ağırlık %${round(p.portfolioWeight, 1)})`);
  }

  computeHorizons(positions: PositionAnalysis[]): HorizonResult {
    const horizonReturns: Record<string, { return: number; count: number }> = {};
    const bucket = (tf: string): string => {
      for (const [label, tfs] of Object.entries(HORIZON_RANKING)) {
        if ((tfs as readonly string[]).includes(tf)) return label;
      }
      return 'Swing';
    };

    for (const p of positions) {
      const label = bucket(p.holdingPeriod?.unit ? this.timeframeFromUnit(p.holdingPeriod.unit) : '1d');
      const entry = horizonReturns[label] ?? { return: 0, count: 0 };
      entry.return += p.expectedReturn * (p.portfolioWeight / 100);
      entry.count += 1;
      horizonReturns[label] = entry;
    }

    const intraday = horizonReturns['Intraday'] ?? null;
    const swing = horizonReturns['Swing'] ?? null;
    const position = horizonReturns['Position'] ?? null;
    const investment = horizonReturns['Investment'] ?? null;

    const metrics: HorizonMetric[] = [
      ...(intraday ? [{ timeframe: 'intraday', label: 'Intraday', return: round(intraday.return) }] : []),
      ...(swing ? [{ timeframe: 'swing', label: 'Swing', return: round(swing.return) }] : []),
      ...(position ? [{ timeframe: 'position', label: 'Position', return: round(position.return) }] : []),
      ...(investment ? [{ timeframe: 'investment', label: 'Investment', return: round(investment.return) }] : []),
    ];

    let best = metrics[0] ?? { timeframe: 'swing', label: 'Swing', return: 0 };
    let worst = metrics[0] ?? { timeframe: 'swing', label: 'Swing', return: 0 };
    for (const m of metrics) {
      if (m.return > best.return) best = m;
      if (m.return < worst.return) worst = m;
    }

    return {
      best,
      worst,
      intraday: intraday ? { timeframe: 'intraday', label: 'Intraday', return: round(intraday.return) } : null,
      swing: swing ? { timeframe: 'swing', label: 'Swing', return: round(swing.return) } : null,
      position: position ? { timeframe: 'position', label: 'Position', return: round(position.return) } : null,
      investment: investment ? { timeframe: 'investment', label: 'Investment', return: round(investment.return) } : null,
    };
  }

  private timeframeFromUnit(unit: string): string {
    const u = unit.toLowerCase();
    if (u.includes('hour') || u.startsWith('h')) return '4h';
    if (u.includes('day') || u.startsWith('d')) return '1d';
    if (u.includes('week') || u.startsWith('w')) return '1w';
    if (u.includes('month') || u.startsWith('m')) return '1m';
    return '1d';
  }

  buildOpportunitiesSection(
    positions: PositionAnalysis[],
    risk: PortfolioRisk,
    candidates: PortfolioOpportunity[] = [],
  ): PortfolioOpportunities {
    const improving = positions
      .filter((p) => p.status === 'STRONG_HOLD' || (p.earlyOpportunityScore >= 70 && p.status !== 'REDUCE' && p.status !== 'EXIT_REVIEW'))
      .sort((a, b) => b.earlyOpportunityScore - a.earlyOpportunityScore);

    const deteriorating = positions
      .filter((p) => p.status === 'REDUCE' || p.status === 'EXIT_REVIEW' || p.earlyOpportunityScore < 40)
      .sort((a, b) => a.earlyOpportunityScore - b.earlyOpportunityScore);

    const held = new Set(positions.map((p) => p.ticker.toUpperCase()));
    const newOpportunities = candidates
      .filter((o) => !held.has(o.ticker.toUpperCase()))
      .slice(0, 5)
      .map((o) => ({
        ...o,
        ...this.classifyOpportunityFit(o, positions, risk),
      }));

    return {
      improvingHoldings: improving,
      deterioratingHoldings: deteriorating,
      newOpportunities,
      summary: `İyileşen ${improving.length} pozisyon, zayıflayan ${deteriorating.length} pozisyon, değerlendirilebilir ${newOpportunities.length} yeni fırsat.`,
    };
  }

  private classifyOpportunityFit(
    opportunity: PortfolioOpportunity,
    positions: PositionAnalysis[],
    risk: PortfolioRisk,
  ): OpportunityFit {
    const fitsRisk =
      opportunity.riskLevel === 'low' ||
      (opportunity.riskLevel === 'medium' && risk.portfolioRiskScore < 60);
    const sectorOverlap = positions.some((p) => p.sector === opportunity.sector);
    const increasesConcentration =
      risk.maxPositionWeight >= CONCENTRATION_THRESHOLDS.singlePosition * 100;
    const improvesDiversification =
      !sectorOverlap && positions.length > 0 && risk.maxPositionWeight < 25;
    return { fitsRisk, increasesConcentration, improvesDiversification, sectorOverlap };
  }

  private buildRecommendations(
    positions: PositionAnalysis[],
    rebalance: RebalanceRecommendation[],
  ): Array<{ ticker: string; text: string }> {
    const rebalanceMap = new Map(rebalance.map((r) => [r.ticker, r]));
    return positions.map((p) => {
      const rb = rebalanceMap.get(p.ticker);
      if (p.status === 'EXIT_REVIEW') {
        return {
          ticker: p.ticker,
          text: `${p.ticker}: ${p.recommendationReason}`,
        };
      }
      if (rb && rb.status === 'REDUCE_CONCENTRATION') {
        return {
          ticker: p.ticker,
          text: `${p.ticker}: ${rb.reason}`,
        };
      }
      return { ticker: p.ticker, text: `${p.ticker}: ${p.recommendationReason}` };
    });
  }

  classifyPositionStatus(analysis: {
    pnlPercent: number;
    riskScore: number;
    earlyOpportunityScore: number;
    confidence: number;
    smartMoneyScore: number | null;
  }): {
    status: PositionAnalysis['status'];
    recommendation: string;
    recommendationReason: string;
  } {
    const { pnlPercent, riskScore, earlyOpportunityScore, confidence, smartMoneyScore } = analysis;

    if (pnlPercent <= POSITION_STATUS_EXIT_MAX_PNL_PERCENT || riskScore >= POSITION_STATUS_EXIT_HIGH_RISK_SCORE) {
      return {
        status: 'EXIT_REVIEW',
        recommendation: 'reassess',
        recommendationReason:
          pnlPercent <= POSITION_STATUS_EXIT_MAX_PNL_PERCENT
            ? `Pozisyon %${round(pnlPercent, 1)} kayıpta; stop ve senaryolar yeniden değerlendirilmeli.`
            : 'Pozisyon risk seviyesi yüksek; mevcut stop ve beklenen getiri incelemeye alınmalı.',
      };
    }
    if (earlyOpportunityScore >= POSITION_STATUS_STRONG_HOLD_MIN_SCORE && confidence >= 60) {
      return {
        status: 'STRONG_HOLD',
        recommendation: 'hold',
        recommendationReason: `Pozisyon güçlü Early Opportunity skoru (${round(earlyOpportunityScore, 0)}) ve yüksek güven nedeniyle korunabilir.`,
      };
    }
    if (earlyOpportunityScore >= POSITION_STATUS_HOLD_MIN_SCORE) {
      return {
        status: 'HOLD',
        recommendation: 'monitor',
        recommendationReason: `Pozisyon orta düzey fırsat skoruna sahip (${round(earlyOpportunityScore, 0)}); izlenmeye devam edilebilir.`,
      };
    }
    if (earlyOpportunityScore >= POSITION_STATUS_WATCH_MIN_SCORE) {
      return {
        status: 'WATCH',
        recommendation: 'wait-for-confirmation',
        recommendationReason: `Pozisyonun fırsat skoru zayıf (${round(earlyOpportunityScore, 0)}); doğrulama beklenmeli.`,
      };
    }
    return {
      status: 'REDUCE',
      recommendation: 'reduce-concentration-review',
      recommendationReason:
        smartMoneyScore !== null && smartMoneyScore < 50
          ? 'Pozisyon zayıf Smart Money ve düşük fırsat skoru nedeniyle azaltma incelemesine alınabilir.'
          : 'Pozisyon fırsat skoru düşük olduğu için azaltma incelemesine alınabilir.',
    };
  }
}
