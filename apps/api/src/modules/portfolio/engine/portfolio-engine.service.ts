import { Injectable, Logger } from '@nestjs/common';
import { Portfolio, Position, Transaction, PortfolioReport, PortfolioCreateInput, PortfolioUpdateInput, TransactionInput, PortfolioSummary, PortfolioRiskMetrics, PerformanceReport, AllocationBreakdown, PortfolioObservabilityMetrics } from '../types/portfolio.types';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { PositionRepository } from '../repositories/position.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { SnapshotRepository } from '../repositories/snapshot.repository';
import { PositionManager } from '../services/position-manager.service';
import { PortfolioCalculator } from '../services/portfolio-calculator.service';
import { AllocationEngine } from '../services/allocation-engine.service';
import { RiskCalculator } from '../services/risk-calculator.service';
import { PerformanceCalculator } from '../services/performance-calculator.service';
import { PortfolioHistory } from '../services/portfolio-history.service';
import { ReportGenerator } from '../services/report-generator.service';
import { ExportService } from '../services/export.service';
import { PortfolioMetricsService } from '../services/portfolio-metrics.service';
import { BenchmarkService } from '../services/benchmark.service';

@Injectable()
export class PortfolioEngine {
  private readonly logger = new Logger(PortfolioEngine.name);
  private currentPrices: Map<string, number> = new Map();

  constructor(
    private readonly portfolioRepo: PortfolioRepository,
    private readonly positionRepo: PositionRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly snapshotRepo: SnapshotRepository,
    private readonly positionManager: PositionManager,
    private readonly portfolioCalculator: PortfolioCalculator,
    private readonly allocationEngine: AllocationEngine,
    private readonly riskCalculator: RiskCalculator,
    private readonly performanceCalculator: PerformanceCalculator,
    private readonly portfolioHistory: PortfolioHistory,
    private readonly reportGenerator: ReportGenerator,
    private readonly exportService: ExportService,
    private readonly portfolioMetrics: PortfolioMetricsService,
    private readonly benchmarkService: BenchmarkService,
  ) {}

  getPortfolios(): Portfolio[] {
    return this.portfolioRepo.findAll();
  }

  getPortfolio(id: string): Portfolio | undefined {
    return this.portfolioRepo.findById(id);
  }

  createPortfolio(input: PortfolioCreateInput): Portfolio {
    const now = new Date().toISOString();
    const portfolio: Portfolio = {
      id: `pf-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: input.name,
      type: input.type ?? 'MAIN',
      description: input.description ?? '',
      displayName: input.name,
      cash: input.initialCash ?? 0,
      currency: 'TRY',
      status: 'ACTIVE',
      metadata: {
        inceptionDate: now,
        totalInvested: input.initialCash ?? 0,
        totalWithdrawn: 0,
        tags: input.tags ?? [],
        benchmark: input.benchmark ?? 'BIST100',
      },
      createdAt: now,
      updatedAt: now,
    };
    const created = this.portfolioRepo.create(portfolio);
    this.portfolioHistory.recordSnapshot(portfolio.id, portfolio.cash, portfolio.cash);
    this.logger.log(`Created portfolio: ${portfolio.name} (${portfolio.id})`);
    return created;
  }

  updatePortfolio(id: string, input: PortfolioUpdateInput): Portfolio | undefined {
    const portfolio = this.portfolioRepo.findById(id);
    if (!portfolio) return undefined;

    const updated: Portfolio = {
      ...portfolio,
      ...input,
      metadata: { ...portfolio.metadata, ...input.metadata },
      updatedAt: new Date().toISOString(),
    };
    return this.portfolioRepo.update(updated);
  }

  deletePortfolio(id: string): boolean {
    const positions = this.positionRepo.findByPortfolio(id);
    positions.forEach((p) => this.positionRepo.delete(p.id));
    const txs = this.transactionRepo.findByPortfolio(id);
    txs.forEach((t) => this.transactionRepo.delete(t.id));
    return this.portfolioRepo.delete(id);
  }

  getPositions(portfolioId: string): Position[] {
    return this.positionRepo.findByPortfolio(portfolioId);
  }

  getPosition(portfolioId: string, positionId: string): Position | undefined {
    return this.positionRepo.findById(positionId);
  }

  getPositionBySymbol(portfolioId: string, symbol: string): Position | undefined {
    return this.positionRepo.findBySymbol(portfolioId, symbol);
  }

  executeTransaction(portfolioId: string, input: TransactionInput): { transaction: Transaction; position: Position | null; closed: boolean; realizedPnL: number } {
    const portfolio = this.portfolioRepo.findById(portfolioId);
    if (!portfolio) throw new Error(`Portfolio ${portfolioId} not found`);

    const transaction: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      portfolioId,
      symbol: input.symbol,
      type: input.type,
      quantity: input.quantity,
      price: input.price,
      total: Math.round(input.quantity * input.price * 100) / 100,
      commission: input.commission ?? 0,
      executedAt: input.executedAt ?? new Date().toISOString(),
      notes: input.notes ?? '',
    };

    this.portfolioHistory.recordTransaction(portfolioId, transaction);
    let currentPosition = this.positionRepo.findBySymbol(portfolioId, input.symbol);

    if (input.type === 'BUY') {
      const updated = this.positionManager.executeBuy(currentPosition, transaction, portfolioId);
      if (currentPosition) {
        this.positionRepo.update(updated);
      } else {
        this.positionRepo.create(updated);
      }

      const cashAfter = portfolio.cash - transaction.total - (input.commission ?? 0);
      this.portfolioRepo.update({ ...portfolio, cash: Math.round(cashAfter * 100) / 100, updatedAt: new Date().toISOString() });

      return { transaction, position: updated, closed: false, realizedPnL: 0 };
    } else {
      if (!currentPosition) throw new Error(`No position found for ${input.symbol}`);
      if (currentPosition.quantity < input.quantity) throw new Error(`Insufficient shares: have ${currentPosition.quantity}, want ${input.quantity}`);

      const { updatedPosition, closed, realizedPnL } = this.positionManager.executeSell(currentPosition, transaction);

      if (closed) {
        this.positionRepo.delete(currentPosition.id);
      } else {
        this.positionRepo.update(updatedPosition);
      }

      const cashAfter = portfolio.cash + transaction.total - (input.commission ?? 0);
      this.portfolioRepo.update({ ...portfolio, cash: Math.round(cashAfter * 100) / 100, updatedAt: new Date().toISOString() });

      return { transaction, position: closed ? null : updatedPosition, closed, realizedPnL };
    }
  }

  updatePrices(prices: Map<string, number>): void {
    this.currentPrices = prices;
    const portfolios = this.portfolioRepo.findAll();
    for (const pf of portfolios) {
      const positions = this.positionRepo.findByPortfolio(pf.id);
      const updated = this.positionManager.updatePrices(positions, prices);
      updated.forEach((p) => this.positionRepo.update(p));
    }
  }

  getSummary(portfolioId: string): PortfolioSummary | undefined {
    const portfolio = this.portfolioRepo.findById(portfolioId);
    if (!portfolio) return undefined;
    const positions = this.positionRepo.findByPortfolio(portfolioId);
    return this.portfolioCalculator.calculateSummary(portfolio, positions);
  }

  getRisk(portfolioId: string): PortfolioRiskMetrics | undefined {
    const portfolio = this.portfolioRepo.findById(portfolioId);
    if (!portfolio) return undefined;
    const positions = this.positionRepo.findByPortfolio(portfolioId);
    const snapshots = this.snapshotRepo.findByPortfolio(portfolioId);
    return this.riskCalculator.calculate(portfolioId, positions, portfolio.cash, snapshots);
  }

  getAllocation(portfolioId: string): AllocationBreakdown[] {
    const portfolio = this.portfolioRepo.findById(portfolioId);
    if (!portfolio) return [];
    const positions = this.positionRepo.findByPortfolio(portfolioId);
    const totalValue = portfolio.cash + positions.reduce((s, p) => s + p.currentValue, 0);
    return [
      this.allocationEngine.calculateSectorAllocation(positions, totalValue),
      this.allocationEngine.calculateIndustryAllocation(positions, totalValue),
      this.allocationEngine.calculateMarketCapAllocation(positions, totalValue),
      this.allocationEngine.calculateRiskAllocation(positions, totalValue),
      this.allocationEngine.calculateCashAllocation(portfolio.cash, totalValue),
    ];
  }

  getPerformance(
    portfolioId: string,
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'SINCE_INCEPTION',
  ): PerformanceReport | undefined {
    const portfolio = this.portfolioRepo.findById(portfolioId);
    if (!portfolio) return undefined;
    const positions = this.positionRepo.findByPortfolio(portfolioId);
    const snapshots = this.snapshotRepo.findByPortfolio(portfolioId);
    return this.performanceCalculator.calculate(portfolio, snapshots, positions, period);
  }

  getFullReport(portfolioId: string): PortfolioReport | undefined {
    const portfolio = this.portfolioRepo.findById(portfolioId);
    if (!portfolio) return undefined;
    const positions = this.positionRepo.findByPortfolio(portfolioId);
    const snapshots = this.snapshotRepo.findByPortfolio(portfolioId);
    const transactions = this.transactionRepo.findByPortfolio(portfolioId);
    return this.reportGenerator.generateFullReport(portfolio, positions, snapshots, transactions);
  }

  getTransactionHistory(portfolioId: string): Transaction[] {
    return this.portfolioHistory.getTransactionHistory(portfolioId);
  }

  recordSnapshot(portfolioId: string): void {
    const portfolio = this.portfolioRepo.findById(portfolioId);
    if (!portfolio) return;
    const positions = this.positionRepo.findByPortfolio(portfolioId);
    const totalValue = portfolio.cash + positions.reduce((s, p) => s + p.currentValue, 0);
    this.portfolioHistory.recordSnapshot(portfolioId, totalValue, portfolio.cash);
  }

  exportReport(portfolioId: string, format: 'csv' | 'json' | 'excel'): string | undefined {
    const report = this.getFullReport(portfolioId);
    if (!report) return undefined;
    switch (format) {
      case 'csv': return this.exportService.toCsv(report);
      case 'json': return this.exportService.toJson(report);
      case 'excel': return this.exportService.toExcel(report);
    }
  }

  getObservabilityMetrics(): PortfolioObservabilityMetrics {
    return this.portfolioMetrics.getObservabilityMetrics();
  }

  getRiskWarnings(portfolioId: string): string[] {
    const risk = this.getRisk(portfolioId);
    if (!risk) return [];
    return this.riskCalculator.checkRiskLimits(risk);
  }
}
