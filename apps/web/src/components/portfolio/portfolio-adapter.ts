import type {
  PortfolioSummary,
  Holding,
  Transaction,
  CashBalance,
  DividendInfo,
  RiskMetrics,
  AIAnalysis,
  AllocationItem,
} from './portfolio-types';
import { ALLOCATION_COLORS } from './portfolio-types';

export interface IPortfolioAdapter {
  getSummary(): Promise<PortfolioSummary>;
  getHoldings(): Promise<Holding[]>;
  getTransactions(): Promise<Transaction[]>;
  getCash(): Promise<CashBalance>;
  getDividends(): Promise<DividendInfo>;
  getRisk(): Promise<RiskMetrics>;
  getAIAnalysis(): Promise<AIAnalysis>;
  getPerformanceHistory(): Promise<Array<{ date: string; value: number }>>;
  getAllocation(): Promise<AllocationItem[]>;
  getSectorAllocation(): Promise<AllocationItem[]>;
}

const EMPTY_SUMMARY: PortfolioSummary = {
  totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPercent: 0,
  dayPnl: 0, dayPnlPercent: 0, realizedPnl: 0, unrealizedPnl: 0,
  maxDrawdown: 0, volatility: 0, sharpeRatio: 0, aiScore: 0, cashBalance: 0,
};

const EMPTY_CASH: CashBalance = { available: 0, reserved: 0, total: 0 };

const EMPTY_DIVIDENDS: DividendInfo = {
  totalReceived: 0, expectedAnnual: 0, yieldPercent: 0,
  lastPaymentDate: '', lastPaymentAmount: 0, history: [],
};

const EMPTY_RISK: RiskMetrics = {
  beta: 0, volatility: 0, sharpeRatio: 0, sortinoRatio: 0,
  maxDrawdown: 0, valueAtRisk: 0, diversificationScore: 0, riskScore: 0,
};

const EMPTY_AI: AIAnalysis = {
  portfolioQuality: '', riskLevel: '', concentrationRisk: '',
  sectorRisk: '', liquidity: '', diversification: '',
  recommendations: [], warnings: [],
};

export class EmptyPortfolioAdapter implements IPortfolioAdapter {
  async getSummary(): Promise<PortfolioSummary> { return EMPTY_SUMMARY; }
  async getHoldings(): Promise<Holding[]> { return []; }
  async getTransactions(): Promise<Transaction[]> { return []; }
  async getCash(): Promise<CashBalance> { return EMPTY_CASH; }
  async getDividends(): Promise<DividendInfo> { return EMPTY_DIVIDENDS; }
  async getRisk(): Promise<RiskMetrics> { return EMPTY_RISK; }
  async getAIAnalysis(): Promise<AIAnalysis> { return EMPTY_AI; }
  async getPerformanceHistory(): Promise<Array<{ date: string; value: number }>> { return []; }
  async getAllocation(): Promise<AllocationItem[]> { return []; }
  async getSectorAllocation(): Promise<AllocationItem[]> { return []; }
}

export function createDefaultAdapter(): IPortfolioAdapter {
  return new EmptyPortfolioAdapter();
}

export function buildAllocationFromHoldings(holdings: Holding[]): AllocationItem[] {
  const total = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  if (total === 0) return [];
  return holdings
    .map((h, i) => ({
      name: h.symbol,
      value: h.marketValue,
      percent: (h.marketValue / total) * 100,
      color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildSectorAllocation(holdings: Holding[]): AllocationItem[] {
  const sectorMap = new Map<string, number>();
  for (const h of holdings) {
    sectorMap.set(h.sector, (sectorMap.get(h.sector) || 0) + h.marketValue);
  }
  const total = Array.from(sectorMap.values()).reduce((s, v) => s + v, 0);
  if (total === 0) return [];
  return Array.from(sectorMap.entries())
    .map(([sector, value], i) => ({
      name: sector,
      value,
      percent: (value / total) * 100,
      color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}
