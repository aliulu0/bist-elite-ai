import { Injectable } from '@nestjs/common';

export interface HoldingInput {
  symbol: string;
  name: string;
  sector: string;
  marketValue: number;
  weight: number;
  dailyReturn?: number;
  returns?: number[];
}

export interface OptimizationResult {
  diversificationScore: number;
  sectorExposure: Array<{ sector: string; current: number; suggested: number; difference: number }>;
  correlationMatrix: Array<{ symbol1: string; symbol2: string; correlation: number }>;
  riskContribution: Array<{ symbol: string; name: string; riskContribution: number; percentOfTotalRisk: number }>;
  suggestedAllocation: Array<{ symbol: string; current: number; suggested: number; action: 'reduce' | 'increase' | 'hold' }>;
  expectedReturn: number;
  expectedVolatility: number;
  riskReward: number;
  cashRatioSuggestion: { current: number; suggested: number; reason: string };
}

@Injectable()
export class PortfolioOptimizationService {
  optimize(holdings: HoldingInput[], cashRatio: number = 0): OptimizationResult {
    if (holdings.length === 0) {
      return {
        diversificationScore: 0,
        sectorExposure: [],
        correlationMatrix: [],
        riskContribution: [],
        suggestedAllocation: [],
        expectedReturn: 0,
        expectedVolatility: 0,
        riskReward: 0,
        cashRatioSuggestion: { current: cashRatio, suggested: 0.1, reason: 'Nakit oranı %10 olarak önerilir.' },
      };
    }

    const diversificationScore = this.calculateDiversification(holdings);
    const sectorExposure = this.calculateSectorExposure(holdings);
    const correlationMatrix = this.buildCorrelationMatrix(holdings);
    const riskContribution = this.calculateRiskContribution(holdings, correlationMatrix);
    const suggestedAllocation = this.suggestAllocation(holdings, sectorExposure);
    const { expectedReturn, expectedVolatility } = this.calculateExpectedMetrics(holdings);
    const riskReward = expectedVolatility > 0 ? expectedReturn / expectedVolatility : 0;

    const suggestedCashRatio = holdings.length <= 3 ? 0.15 : holdings.length <= 8 ? 0.10 : 0.05;
    let cashReason = '';
    if (cashRatio < suggestedCashRatio * 0.5) {
      cashReason = `Nakit oranı %${(cashRatio * 100).toFixed(0)} ile düşük. Acil durumlar için %${(suggestedCashRatio * 100).toFixed(0)} nakit önerilir.`;
    } else if (cashRatio > suggestedCashRatio * 1.5) {
      cashReason = `Nakit oranı %${(cashRatio * 100).toFixed(0)} ile yüksek. Piyasaya giriş için değerlendirilebilir.`;
    } else {
      cashReason = `Nakit oranı %${(cashRatio * 100).toFixed(0)} ile dengeli.`;
    }

    return {
      diversificationScore,
      sectorExposure,
      correlationMatrix,
      riskContribution,
      suggestedAllocation,
      expectedReturn,
      expectedVolatility,
      riskReward,
      cashRatioSuggestion: { current: cashRatio, suggested: suggestedCashRatio, reason: cashReason },
    };
  }

  private calculateDiversification(holdings: HoldingInput[]): number {
    if (holdings.length <= 1) return 0;

    const sectorWeights = new Map<string, number>();
    let totalWeight = 0;

    for (const h of holdings) {
      const current = sectorWeights.get(h.sector) || 0;
      sectorWeights.set(h.sector, current + h.weight);
      totalWeight += h.weight;
    }

    const numSectors = sectorWeights.size;
    const herfindahl = Array.from(sectorWeights.values())
      .reduce((sum, w) => sum + Math.pow(w / totalWeight, 2), 0);

    const sectorScore = Math.min(100, (numSectors / 5) * 50);
    const concentrationScore = Math.min(50, (1 - herfindahl) * 50);
    const positionScore = Math.min(100, (holdings.length / 10) * 100);

    return Math.round((sectorScore + concentrationScore + positionScore) / 3);
  }

  private calculateSectorExposure(holdings: HoldingInput[]): Array<{ sector: string; current: number; suggested: number; difference: number }> {
    const sectorMap = new Map<string, number>();
    let totalWeight = 0;

    for (const h of holdings) {
      const current = sectorMap.get(h.sector) || 0;
      sectorMap.set(h.sector, current + h.weight);
      totalWeight += h.weight;
    }

    const numSectors = sectorMap.size;
    const equalWeight = numSectors > 0 ? 100 / numSectors : 100;

    return Array.from(sectorMap.entries())
      .map(([sector, current]) => {
        const currentPercent = (current / totalWeight) * 100;
        const suggested = Math.min(30, equalWeight * 1.5);
        return {
          sector,
          current: Math.round(currentPercent * 10) / 10,
          suggested: Math.round(suggested * 10) / 10,
          difference: Math.round((suggested - currentPercent) * 10) / 10,
        };
      })
      .sort((a, b) => b.current - a.current);
  }

  private buildCorrelationMatrix(holdings: HoldingInput[]): Array<{ symbol1: string; symbol2: string; correlation: number }> {
    const matrix: Array<{ symbol1: string; symbol2: string; correlation: number }> = [];

    for (let i = 0; i < holdings.length; i++) {
      for (let j = i + 1; j < holdings.length; j++) {
        const returns1 = holdings[i].returns || this.simulateReturns(holdings[i].dailyReturn);
        const returns2 = holdings[j].returns || this.simulateReturns(holdings[j].dailyReturn);
        const corr = this.pearsonCorrelation(returns1, returns2);

        let adjustedCorr = corr;
        if (holdings[i].sector === holdings[j].sector) {
          adjustedCorr = Math.min(0.9, corr + 0.3);
        }

        matrix.push({
          symbol1: holdings[i].symbol,
          symbol2: holdings[j].symbol,
          correlation: Math.round(adjustedCorr * 100) / 100,
        });
      }
    }

    return matrix.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  private calculateRiskContribution(
    holdings: HoldingInput[],
    correlations: Array<{ symbol1: string; symbol2: string; correlation: number }>,
  ): Array<{ symbol: string; name: string; riskContribution: number; percentOfTotalRisk: number }> {
    if (holdings.length === 0) return [];

    const symbolSet = new Set(holdings.map((h) => h.symbol));
    const corrMap = new Map<string, number>();
    for (const c of correlations) {
      corrMap.set(`${c.symbol1}:${c.symbol2}`, c.correlation);
      corrMap.set(`${c.symbol2}:${c.symbol1}`, c.correlation);
    }

    const totalRisk = holdings.reduce((sum, h) => {
      const othersRisk = holdings
        .filter((o) => o.symbol !== h.symbol)
        .reduce((s, o) => {
          const corr = corrMap.get(`${h.symbol}:${o.symbol}`) || 0.3;
          return s + h.weight * o.weight * corr;
        }, 0);
      return sum + h.weight * h.weight + othersRisk;
    }, 0);

    const contributions = holdings.map((h) => {
      const marginalRisk = h.weight * h.weight + holdings
        .filter((o) => o.symbol !== h.symbol)
        .reduce((s, o) => {
          const corr = corrMap.get(`${h.symbol}:${o.symbol}`) || 0.3;
          return s + h.weight * o.weight * corr;
        }, 0);

      return {
        symbol: h.symbol,
        name: h.name,
        riskContribution: Math.round(marginalRisk * 1000) / 1000,
        percentOfTotalRisk: totalRisk > 0 ? Math.round((marginalRisk / totalRisk) * 1000) / 10 : 0,
      };
    });

    return contributions.sort((a, b) => b.percentOfTotalRisk - a.percentOfTotalRisk);
  }

  private suggestAllocation(
    holdings: HoldingInput[],
    sectorExposure: Array<{ sector: string; current: number; suggested: number; difference: number }>,
  ): Array<{ symbol: string; current: number; suggested: number; action: 'reduce' | 'increase' | 'hold' }> {
    const sectorMap = new Map(sectorExposure.map((s) => [s.sector, s]));
    const numHoldings = holdings.length;
    const equalWeight = numHoldings > 0 ? 100 / numHoldings : 0;

    return holdings.map((h) => {
      const sector = sectorMap.get(h.sector);
      const currentPercent = h.weight * 100;
      let suggested = currentPercent;

      if (sector && sector.difference < -5) {
        suggested = Math.max(equalWeight * 0.5, currentPercent + sector.difference * 0.3);
      } else if (sector && sector.difference > 5) {
        suggested = Math.min(equalWeight * 1.5, currentPercent + sector.difference * 0.3);
      }

      suggested = Math.max(1, Math.min(30, Math.round(suggested * 10) / 10));

      let action: 'reduce' | 'increase' | 'hold';
      const diff = suggested - currentPercent;
      if (diff < -2) action = 'reduce';
      else if (diff > 2) action = 'increase';
      else action = 'hold';

      return {
        symbol: h.symbol,
        current: Math.round(currentPercent * 10) / 10,
        suggested,
        action,
      };
    });
  }

  private calculateExpectedMetrics(holdings: HoldingInput[]): { expectedReturn: number; expectedVolatility: number } {
    if (holdings.length === 0) return { expectedReturn: 0, expectedVolatility: 0 };

    const weightedReturn = holdings.reduce((sum, h) => sum + (h.dailyReturn || 0) * h.weight, 0);
    const avgReturn = holdings.reduce((sum, h) => sum + (h.dailyReturn || 0), 0) / holdings.length;

    const variance = holdings.reduce((sum, h) => {
      const diff = (h.dailyReturn || 0) - avgReturn;
      return sum + diff * diff * h.weight;
    }, 0);

    const expectedReturn = Math.round(weightedReturn * 252 * 1000) / 10;
    const expectedVolatility = Math.round(Math.sqrt(variance) * Math.sqrt(252) * 1000) / 10;

    return { expectedReturn, expectedVolatility };
  }

  private simulateReturns(dailyReturn?: number): number[] {
    const base = dailyReturn || 0;
    return Array.from({ length: 20 }, (_, i) => base + (Math.random() - 0.5) * 0.02 * (i + 1));
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = x.slice(0, n).reduce((s, v) => s + v, 0) / n;
    const meanY = y.slice(0, n).reduce((s, v) => s + v, 0) / n;

    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : Math.max(-1, Math.min(1, num / den));
  }
}
