import { Injectable } from '@nestjs/common';
import { PortfolioSummary, PortfolioRiskMetrics, AllocationBreakdown, PerformanceReport, Transaction, PortfolioReport } from '../types/portfolio.types';
import { PortfolioCalculator } from './portfolio-calculator.service';
import { RiskCalculator } from './risk-calculator.service';
import { AllocationEngine } from './allocation-engine.service';
import { PerformanceCalculator } from './performance-calculator.service';
import { Portfolio, Position, PortfolioSnapshot } from '../types/portfolio.types';

@Injectable()
export class ReportGenerator {
  constructor(
    private readonly portfolioCalculator: PortfolioCalculator,
    private readonly riskCalculator: RiskCalculator,
    private readonly allocationEngine: AllocationEngine,
    private readonly performanceCalculator: PerformanceCalculator,
  ) {}

  generateFullReport(
    portfolio: Portfolio,
    positions: Position[],
    snapshots: PortfolioSnapshot[],
    transactions: Transaction[],
  ): PortfolioReport {
    const summary = this.portfolioCalculator.calculateSummary(portfolio, positions);
    const totalValue = summary.totalValue;
    const risk = this.riskCalculator.calculate(portfolio.id, positions, portfolio.cash, snapshots);
    const allocation: AllocationBreakdown[] = [
      this.allocationEngine.calculateSectorAllocation(positions, totalValue),
      this.allocationEngine.calculateCashAllocation(portfolio.cash, totalValue),
    ];
    const performance = this.performanceCalculator.calculate(portfolio, snapshots, positions, 'MONTHLY');
    const riskWarnings = this.riskCalculator.checkRiskLimits(risk);

    return {
      summary,
      allocation,
      performance,
      risk,
      recentTransactions: transactions.slice(-10).reverse(),
      riskWarnings,
      generatedAt: new Date().toISOString(),
    };
  }

  generateSummaryReport(portfolio: Portfolio, positions: Position[]): PortfolioReport['summary'] {
    return this.portfolioCalculator.calculateSummary(portfolio, positions);
  }

  generatePerformanceReport(
    portfolio: Portfolio,
    snapshots: PortfolioSnapshot[],
    positions: Position[],
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'SINCE_INCEPTION',
  ): PerformanceReport {
    return this.performanceCalculator.calculate(portfolio, snapshots, positions, period);
  }

  generateRiskReport(
    portfolioId: string,
    positions: Position[],
    cash: number,
    snapshots: PortfolioSnapshot[],
  ): PortfolioRiskMetrics {
    return this.riskCalculator.calculate(portfolioId, positions, cash, snapshots);
  }

  generateTransactionReport(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) => b.executedAt.localeCompare(a.executedAt));
  }
}
