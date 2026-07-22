import { Injectable } from '@nestjs/common';
import {
  PortfolioState, PaperPortfolioConfig, RiskAssessment,
  PositionStatus, PositionState, MarketRegime,
} from './types';

@Injectable()
export class PaperRiskManagerService {
  checkPositionLimit(
    portfolio: PortfolioState,
    quantity: number,
    price: number,
    config: PaperPortfolioConfig,
  ): { allowed: boolean; reason: string } {
    const totalCost = quantity * price;
    const totalValue = this.getTotalValue(portfolio);
    const positionPercent = totalCost / totalValue;

    if (positionPercent > config.maxPositionSizePercent) {
      return {
        allowed: false,
        reason: `Pozisyon büyüklüğü limiti aşıyor: %${(positionPercent * 100).toFixed(1)} > %${(config.maxPositionSizePercent * 100).toFixed(0)}`,
      };
    }

    return { allowed: true, reason: 'Uygun' };
  }

  checkSectorExposure(
    portfolio: PortfolioState,
    sector: string,
    amount: number,
    config: PaperPortfolioConfig,
  ): { allowed: boolean; reason: string } {
    const totalValue = this.getTotalValue(portfolio);
    const existingSectorExposure = this.getSectorExposure(portfolio, sector);
    const newExposure = (existingSectorExposure + amount) / totalValue;

    if (newExposure > config.maxSectorExposurePercent) {
      return {
        allowed: false,
        reason: `Sektör maruziyeti limiti aşıyor (${sector}): %${(newExposure * 100).toFixed(1)} > %${(config.maxSectorExposurePercent * 100).toFixed(0)}`,
      };
    }

    return { allowed: true, reason: 'Uygun' };
  }

  checkCashAllocation(
    portfolio: PortfolioState,
    amount: number,
    config: PaperPortfolioConfig,
  ): { allowed: boolean; reason: string } {
    const newCash = portfolio.cashBalance - amount;
    const totalValue = this.getTotalValue(portfolio);
    const cashPercent = newCash / totalValue;

    if (cashPercent < config.minCashAllocationPercent) {
      return {
        allowed: false,
        reason: `Nakit oranı minimumun altında: %${(cashPercent * 100).toFixed(1)} < %${(config.minCashAllocationPercent * 100).toFixed(0)}`,
      };
    }

    if (cashPercent > config.maxCashAllocationPercent) {
      return {
        allowed: false,
        reason: `Nakit oranı maximumun üstünde: %${(cashPercent * 100).toFixed(1)} > %${(config.maxCashAllocationPercent * 100).toFixed(0)}`,
      };
    }

    return { allowed: true, reason: 'Uygun' };
  }

  checkDrawdownLimit(
    portfolio: PortfolioState,
    config: PaperPortfolioConfig,
  ): { withinLimit: boolean; currentDrawdown: number } {
    const currentValue = this.getTotalValue(portfolio);
    const currentDrawdown = portfolio.peakValue > 0
      ? (portfolio.peakValue - currentValue) / portfolio.peakValue
      : 0;

    return {
      withinLimit: currentDrawdown <= config.maxDrawdownLimit,
      currentDrawdown: currentDrawdown * 100,
    };
  }

  checkMaxPositions(
    portfolio: PortfolioState,
    config: PaperPortfolioConfig,
  ): { allowed: boolean; reason: string } {
    let openCount = 0;
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) openCount++;
    });

    if (openCount >= config.maxPositions) {
      return { allowed: false, reason: `Maksimum pozisyon sayısına ulaşıldı: ${openCount}/${config.maxPositions}` };
    }

    return { allowed: true, reason: `Açık pozisyon: ${openCount}/${config.maxPositions}` };
  }

  shouldStopLoss(
    position: PositionState,
    currentPrice: number,
    config: PaperPortfolioConfig,
  ): boolean {
    if (!config.enableStopLoss) return false;
    const lossPercent = (position.avgCost - currentPrice) / position.avgCost;
    return lossPercent >= config.defaultStopLossPercent;
  }

  shouldTakeProfit(
    position: PositionState,
    currentPrice: number,
    config: PaperPortfolioConfig,
  ): boolean {
    if (!config.enableTakeProfit) return false;
    const gainPercent = (currentPrice - position.avgCost) / position.avgCost;
    const targetGain = config.defaultStopLossPercent * config.defaultTakeProfitRatio;
    return gainPercent >= targetGain;
  }

  evaluatePortfolioRisk(
    portfolio: PortfolioState,
    config: PaperPortfolioConfig,
  ): RiskAssessment {
    const totalValue = this.getTotalValue(portfolio);
    const cashAllocation = portfolio.cashBalance / totalValue;
    const sectorExposure = this.getAllSectorExposure(portfolio, totalValue);
    const maxConcentration = this.getMaxConcentration(portfolio, totalValue);
    const { currentDrawdown, withinLimit } = this.checkDrawdownLimit(portfolio, config);

    let openCount = 0;
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) openCount++;
    });

    const riskFactors: RiskAssessment['riskFactors'] = [];

    if (cashAllocation < config.minCashAllocationPercent) {
      riskFactors.push({
        type: 'NAKIT_RISKI',
        severity: 'Yüksek',
        description: `Nakit oranı çok düşük: %${(cashAllocation * 100).toFixed(1)}`,
      });
    }

    if (maxConcentration > config.maxPositionSizePercent) {
      riskFactors.push({
        type: 'KONSANTRASYON_RISKI',
        severity: 'Yüksek',
        description: `Maksimum yoğunlaşma çok yüksek: %${(maxConcentration * 100).toFixed(1)}`,
      });
    }

    if (!withinLimit) {
      riskFactors.push({
        type: 'DRAWDOWN_RISKI',
        severity: 'Kritik',
        description: `Drawdown limiti aşıldı: -${currentDrawdown.toFixed(2)}%`,
      });
    }

    for (const [sector, exposure] of Object.entries(sectorExposure)) {
      if (exposure > config.maxSectorExposurePercent) {
        riskFactors.push({
          type: 'SEKTOR_RISKI',
          severity: 'Orta',
          description: `Sektör maruziyeti yüksek (${sector}): %${(exposure * 100).toFixed(1)}`,
        });
      }
    }

    let riskScore = 0;
    riskScore += Math.min(30, (1 - cashAllocation) * 50);
    riskScore += Math.min(25, maxConcentration * 100);
    riskScore += Math.min(25, currentDrawdown * 2);
    riskScore += Math.min(20, riskFactors.length * 5);

    return {
      portfolioId: portfolio.id,
      overallRiskScore: Math.min(100, riskScore),
      cashAllocation,
      sectorExposure,
      maxConcentration,
      positionCount: openCount,
      drawdown: currentDrawdown,
      withinDrawdownLimit: withinLimit,
      riskFactors,
      generatedAt: new Date().toISOString(),
    };
  }

  private getTotalValue(portfolio: PortfolioState): number {
    let invested = 0;
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) {
        invested += p.quantity * p.currentPrice;
      }
    });
    return portfolio.cashBalance + invested;
  }

  private getSectorExposure(portfolio: PortfolioState, sector: string): number {
    let exposure = 0;
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN && p.sector === sector) {
        exposure += p.quantity * p.currentPrice;
      }
    });
    return exposure;
  }

  private getAllSectorExposure(portfolio: PortfolioState, totalValue: number): Record<string, number> {
    const exposure: Record<string, number> = {};
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN && p.sector) {
        const value = p.quantity * p.currentPrice;
        exposure[p.sector] = (exposure[p.sector] || 0) + value / totalValue;
      }
    });
    return exposure;
  }

  private getMaxConcentration(portfolio: PortfolioState, totalValue: number): number {
    let maxConc = 0;
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) {
        const conc = (p.quantity * p.currentPrice) / totalValue;
        if (conc > maxConc) maxConc = conc;
      }
    });
    return maxConc;
  }
}
