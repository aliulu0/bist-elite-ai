import { Injectable } from '@nestjs/common';
import { Portfolio, Position, PortfolioSummary, PortfolioObservabilityMetrics } from '../types/portfolio.types';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { PositionRepository } from '../repositories/position.repository';

@Injectable()
export class PortfolioMetricsService {
  constructor(
    private readonly portfolioRepo: PortfolioRepository,
    private readonly positionRepo: PositionRepository,
  ) {}

  getObservabilityMetrics(): PortfolioObservabilityMetrics {
    const portfolios = this.portfolioRepo.findAll();
    const allPositions = portfolios.flatMap((p) => this.positionRepo.findByPortfolio(p.id));

    const averagePositionSize = allPositions.length > 0
      ? allPositions.reduce((s, p) => s + p.currentValue, 0) / allPositions.length
      : 0;

    const gainers = allPositions.filter((p) => p.profitLoss > 0);
    const losers = allPositions.filter((p) => p.profitLoss < 0);
    const largestGain = gainers.length > 0 ? Math.max(...gainers.map((p) => p.profitLoss)) : 0;
    const largestLoss = losers.length > 0 ? Math.min(...losers.map((p) => p.profitLoss)) : 0;

    const positionAges = allPositions
      .filter((p) => p.firstBoughtAt)
      .map((p) => {
        const bought = new Date(p.firstBoughtAt);
        return (Date.now() - bought.getTime()) / (1000 * 60 * 60 * 24);
      });
    const averageHoldingTime = positionAges.length > 0
      ? positionAges.reduce((s, a) => s + a, 0) / positionAges.length
      : 0;

    const sectorMap = new Map<string, number>();
    for (const pos of allPositions) {
      const sector = pos.sector || 'Unknown';
      sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + 1);
    }
    const averageAllocation = sectorMap.size > 0
      ? allPositions.length / sectorMap.size
      : 0;

    return {
      totalPortfolios: portfolios.length,
      totalPositions: allPositions.length,
      averagePositionSize: Math.round(averagePositionSize * 100) / 100,
      largestGain: Math.round(largestGain * 100) / 100,
      largestLoss: Math.round(largestLoss * 100) / 100,
      averageHoldingTime: Math.round(averageHoldingTime * 100) / 100,
      averageAllocation: Math.round(averageAllocation * 100) / 100,
      timestamp: new Date().toISOString(),
    };
  }
}
