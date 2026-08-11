import { Injectable } from '@nestjs/common';
import { Position, PortfolioRiskMetrics, PositionRisk, PortfolioSnapshot } from '../types/portfolio.types';
import { DEFAULT_RISK_LIMITS } from '../config/portfolio.config';

@Injectable()
export class RiskCalculator {
  calculate(portfolioId: string, positions: Position[], cash: number, snapshots: PortfolioSnapshot[]): PortfolioRiskMetrics {
    const totalValue = cash + positions.reduce((s, p) => s + p.currentValue, 0);
    const sectorConcentration = this.calculateSectorConcentration(positions, totalValue);
    const largestPositionPercent = positions.length > 0
      ? Math.max(...positions.map((p) => totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0))
      : 0;
    const cashRatio = totalValue > 0 ? (cash / totalValue) * 100 : 100;
    const diversificationScore = this.calculateDiversification(positions, sectorConcentration, largestPositionPercent);
    const volatility = this.calculateVolatility(snapshots);
    const { currentDrawdown, maxDrawdown } = this.calculateDrawdown(snapshots, totalValue);

    const topRiskyPositions = this.getTopRiskyPositions(positions, totalValue);

    return {
      portfolioId,
      portfolioRisk: this.round(Math.min(100, volatility * 2 + (100 - diversificationScore) / 2)),
      sectorConcentration: this.round(sectorConcentration),
      largestPositionPercent: this.round(largestPositionPercent),
      cashRatio: this.round(cashRatio),
      diversificationScore: this.round(diversificationScore),
      currentDrawdown: this.round(currentDrawdown),
      maxDrawdown: this.round(maxDrawdown),
      volatility: this.round(volatility),
      topRiskyPositions,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateSectorConcentration(positions: Position[], totalValue: number): number {
    if (totalValue <= 0 || positions.length === 0) return 0;
    const sectorMap = new Map<string, number>();
    for (const p of positions) {
      const sector = p.sector || 'Unknown';
      sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + p.currentValue);
    }
    const maxSector = Math.max(...sectorMap.values());
    return (maxSector / totalValue) * 100;
  }

  private calculateDiversification(positions: Position[], sectorConcentration: number, largestPosPct: number): number {
    if (positions.length === 0) return 0;
    const countScore = Math.min(positions.length / 10, 1) * 40;
    const sectorScore = (100 - sectorConcentration) * 0.3;
    const positionScore = (100 - largestPosPct) * 0.3;
    return Math.min(100, countScore + sectorScore + positionScore);
  }

  private calculateVolatility(snapshots: PortfolioSnapshot[]): number {
    if (snapshots.length < 2) return 0;
    const values = snapshots.map((s) => s.totalValue);
    const returns: number[] = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }
    if (returns.length === 0) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance) * 100;
  }

  private calculateDrawdown(snapshots: PortfolioSnapshot[], currentValue: number): { currentDrawdown: number; maxDrawdown: number } {
    if (snapshots.length === 0) return { currentDrawdown: 0, maxDrawdown: 0 };
    const allValues = [...snapshots.map((s) => s.totalValue), currentValue];
    let peak = allValues[0];
    let maxDrawdown = 0;
    for (const v of allValues) {
      if (v > peak) peak = v;
      const dd = peak > 0 ? ((peak - v) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }
    const currentDrawdown = peak > 0 ? ((peak - currentValue) / peak) * 100 : 0;
    return { currentDrawdown, maxDrawdown };
  }

  private getTopRiskyPositions(positions: Position[], totalValue: number): PositionRisk[] {
    return positions
      .map((p) => ({
        symbol: p.symbol,
        risk: p.risk,
        weight: totalValue > 0 ? this.round((p.currentValue / totalValue) * 100) : 0,
        contribution: totalValue > 0 ? this.round((p.currentValue / totalValue) * p.risk) : 0,
      }))
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5);
  }

  checkRiskLimits(risk: PortfolioRiskMetrics): string[] {
    const warnings: string[] = [];
    if (risk.sectorConcentration > DEFAULT_RISK_LIMITS.maxSectorConcentrationPercent) {
      warnings.push(`Sector concentration ${risk.sectorConcentration}% exceeds limit ${DEFAULT_RISK_LIMITS.maxSectorConcentrationPercent}%`);
    }
    if (risk.largestPositionPercent > DEFAULT_RISK_LIMITS.maxPositionSizePercent) {
      warnings.push(`Position size ${risk.largestPositionPercent}% exceeds limit ${DEFAULT_RISK_LIMITS.maxPositionSizePercent}%`);
    }
    if (risk.cashRatio < DEFAULT_RISK_LIMITS.minCashRatio) {
      warnings.push(`Cash ratio ${risk.cashRatio}% below minimum ${DEFAULT_RISK_LIMITS.minCashRatio}%`);
    }
    if (risk.maxDrawdown > DEFAULT_RISK_LIMITS.maxDrawdownPercent) {
      warnings.push(`Max drawdown ${risk.maxDrawdown}% exceeds limit ${DEFAULT_RISK_LIMITS.maxDrawdownPercent}%`);
    }
    if (risk.volatility > DEFAULT_RISK_LIMITS.maxVolatilityPercent) {
      warnings.push(`Volatility ${risk.volatility}% exceeds limit ${DEFAULT_RISK_LIMITS.maxVolatilityPercent}%`);
    }
    return warnings;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
