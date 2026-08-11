import { ExportService } from '../services/export.service';
import { PortfolioReport, Position, Transaction } from '../types/portfolio.types';

describe('ExportService', () => {
  const svc = new ExportService();

  const mockReport: PortfolioReport = {
    summary: {
      portfolioId: 'pf-1', portfolioName: 'Test', totalValue: 15000, cash: 2000,
      investedCapital: 10000, marketValue: 13000, totalProfitLoss: 3000,
      totalProfitLossPercent: 30, totalReturn: 25, dailyReturn: 1.5,
      positionCount: 3, cashAllocation: 13.33, stockAllocation: 86.67,
      largestPosition: null, updatedAt: '2025-01-01',
    },
    risk: {
      portfolioId: 'pf-1', portfolioRisk: 45, sectorConcentration: 50,
      largestPositionPercent: 40, cashRatio: 13.33, diversificationScore: 65,
      currentDrawdown: 5, maxDrawdown: 10, volatility: 20,
      topRiskyPositions: [], timestamp: '2025-01-01',
    },
    allocation: [],
    performance: {
      portfolioId: 'pf-1', period: 'MONTHLY', startDate: '2024-12-01',
      endDate: '2025-01-01', startValue: 14000, endValue: 15000,
      absoluteReturn: 1000, percentReturn: 7.14, benchmarkReturn: null,
      alpha: null, beta: null, volatility: 15, sharpeRatio: null,
      maxDrawdown: 8, bestDay: 3.5, worstDay: -2.1, winningDays: 15,
      losingDays: 10, timestamp: '2025-01-01',
    },
    recentTransactions: [],
    riskWarnings: [],
    generatedAt: '2025-01-01T00:00:00.000Z',
  };

  it('should export report to CSV', () => {
    const csv = svc.toCsv(mockReport);
    expect(csv).toContain('Metric,Value');
    expect(csv).toContain('Total Value,15000');
    expect(csv).toContain('Portfolio Risk,45');
  });

  it('should export report to JSON', () => {
    const json = svc.toJson(mockReport);
    const parsed = JSON.parse(json);
    expect(parsed.summary.totalValue).toBe(15000);
  });

  it('should export to Excel format', () => {
    const excel = svc.toExcel(mockReport);
    expect(excel.startsWith('sep=,\n')).toBe(true);
  });

  it('should export position array to CSV', () => {
    const positions: Position[] = [
      {
        id: 'p1', portfolioId: 'pf-1', symbol: 'AAPL', name: 'Apple',
        sector: 'TECH', industry: '', marketCap: 'LARGE',
        quantity: 10, averageCost: 150, totalCost: 1500,
        currentPrice: 200, currentValue: 2000, profitLoss: 500,
        profitLossPercent: 33.33, weight: 50, contribution: 10,
        highestPrice: 200, lowestPrice: 140, risk: 30,
        firstBoughtAt: '', lastBoughtAt: '', updatedAt: '',
      },
    ];
    const csv = svc.toCsv(positions);
    expect(csv).toContain('AAPL');
    expect(csv).toContain('Apple');
    expect(csv).toContain('1500');
  });

  it('should handle empty arrays', () => {
    expect(svc.toCsv([])).toBe('');
  });
});
