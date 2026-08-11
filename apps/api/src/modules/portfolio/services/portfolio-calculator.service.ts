import { Injectable } from '@nestjs/common';
import { Portfolio, Position, PortfolioSummary } from '../types/portfolio.types';

@Injectable()
export class PortfolioCalculator {
  calculateSummary(portfolio: Portfolio, positions: Position[]): PortfolioSummary {
    const marketValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalValue = portfolio.cash + marketValue;
    const investedCapital = positions.reduce((sum, p) => sum + p.totalCost, 0);
    const totalProfitLoss = positions.reduce((sum, p) => sum + p.profitLoss, 0);
    const totalProfitLossPercent = investedCapital > 0 ? (totalProfitLoss / investedCapital) * 100 : 0;

    const sortedByValue = [...positions].sort((a, b) => b.currentValue - a.currentValue);
    const largestPosition = sortedByValue.length > 0 ? sortedByValue[0] : null;

    const dailyReturn = this.calculateDailyReturn(totalValue, portfolio);

    return {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      totalValue: this.round(totalValue),
      cash: portfolio.cash,
      investedCapital: this.round(investedCapital),
      marketValue: this.round(marketValue),
      totalProfitLoss: this.round(totalProfitLoss),
      totalProfitLossPercent: this.round(totalProfitLossPercent),
      totalReturn: this.round(dailyReturn),
      dailyReturn: this.round(dailyReturn),
      positionCount: positions.length,
      cashAllocation: totalValue > 0 ? this.round((portfolio.cash / totalValue) * 100) : 0,
      stockAllocation: totalValue > 0 ? this.round((marketValue / totalValue) * 100) : 0,
      largestPosition,
      updatedAt: new Date().toISOString(),
    };
  }

  private calculateDailyReturn(currentValue: number, portfolio: Portfolio): number {
    const totalNetInvested = portfolio.metadata.totalInvested - portfolio.metadata.totalWithdrawn;
    if (totalNetInvested <= 0) return 0;
    return ((currentValue - totalNetInvested) / totalNetInvested) * 100;
  }

  calculateCostBasis(positions: Position[]): number {
    return this.round(positions.reduce((sum, p) => sum + p.totalCost, 0));
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
