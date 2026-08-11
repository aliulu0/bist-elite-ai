import { PortfolioEngine } from '../engine/portfolio-engine.service';
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

describe('PortfolioEngine', () => {
  let engine: PortfolioEngine;
  let portfolioRepo: PortfolioRepository;
  let positionRepo: PositionRepository;

  beforeEach(() => {
    portfolioRepo = new PortfolioRepository();
    positionRepo = new PositionRepository();
    const txRepo = new TransactionRepository();
    const snapRepo = new SnapshotRepository();
    const posManager = new PositionManager();
    const calc = new PortfolioCalculator();
    const alloc = new AllocationEngine();
    const risk = new RiskCalculator();
    const perf = new PerformanceCalculator();
    const history = new PortfolioHistory(snapRepo, txRepo, positionRepo);
    const report = new ReportGenerator(calc, risk, alloc, perf);
    const exportSvc = new ExportService();
    const metrics = new PortfolioMetricsService(portfolioRepo, positionRepo);
    const bench = new BenchmarkService();

    engine = new PortfolioEngine(
      portfolioRepo, positionRepo, txRepo, snapRepo,
      posManager, calc, alloc, risk, perf, history,
      report, exportSvc, metrics, bench,
    );
  });

  describe('portfolio lifecycle', () => {
    it('should create and retrieve a portfolio', () => {
      const created = engine.createPortfolio({ name: 'Test', initialCash: 10000, type: 'MAIN' });
      expect(created.name).toBe('Test');
      expect(created.cash).toBe(10000);
      expect(created.type).toBe('MAIN');

      const found = engine.getPortfolio(created.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe('Test');
    });

    it('should list all portfolios', () => {
      engine.createPortfolio({ name: 'P1', initialCash: 1000 });
      engine.createPortfolio({ name: 'P2', initialCash: 2000 });
      expect(engine.getPortfolios()).toHaveLength(2);
    });

    it('should update a portfolio', () => {
      const created = engine.createPortfolio({ name: 'Original', initialCash: 500 });
      const updated = engine.updatePortfolio(created.id, { name: 'Updated' });
      expect(updated!.name).toBe('Updated');
    });
  });

  describe('transactions', () => {
    it('should execute buy and create position', () => {
      const pf = engine.createPortfolio({ name: 'BuyTest', initialCash: 10000 });
      const result = engine.executeTransaction(pf.id, {
        symbol: 'AAPL', type: 'BUY', quantity: 10, price: 150,
      });
      expect(result.position).toBeDefined();
      expect(result.position!.quantity).toBe(10);
      expect(result.position!.averageCost).toBe(150);

      const updatedPf = engine.getPortfolio(pf.id);
      expect(updatedPf!.cash).toBe(8500);
    });

    it('should execute sell and realize P&L', () => {
      const pf = engine.createPortfolio({ name: 'SellTest', initialCash: 10000 });
      engine.executeTransaction(pf.id, {
        symbol: 'AAPL', type: 'BUY', quantity: 10, price: 100,
      });
      const result = engine.executeTransaction(pf.id, {
        symbol: 'AAPL', type: 'SELL', quantity: 5, price: 150,
      });
      expect(result.realizedPnL).toBe(250);
      expect(result.position).toBeDefined();
      expect(result.position!.quantity).toBe(5);
    });

    it('should close position on full sell', () => {
      const pf = engine.createPortfolio({ name: 'CloseTest', initialCash: 10000 });
      engine.executeTransaction(pf.id, {
        symbol: 'AAPL', type: 'BUY', quantity: 10, price: 100,
      });
      const result = engine.executeTransaction(pf.id, {
        symbol: 'AAPL', type: 'SELL', quantity: 10, price: 150,
      });
      expect(result.closed).toBe(true);
      expect(result.position).toBeNull();
    });

    it('should reject sell with insufficient shares', () => {
      const pf = engine.createPortfolio({ name: 'FailTest', initialCash: 10000 });
      engine.executeTransaction(pf.id, {
        symbol: 'AAPL', type: 'BUY', quantity: 5, price: 100,
      });
      expect(() => {
        engine.executeTransaction(pf.id, {
          symbol: 'AAPL', type: 'SELL', quantity: 10, price: 150,
        });
      }).toThrow('Insufficient shares');
    });
  });

  describe('reporting', () => {
    it('should generate summary', () => {
      const pf = engine.createPortfolio({ name: 'SumTest', initialCash: 10000 });
      engine.executeTransaction(pf.id, {
        symbol: 'AAPL', type: 'BUY', quantity: 10, price: 100,
      });
      engine.updatePrices(new Map([['AAPL', 150]]));
      const summary = engine.getSummary(pf.id);
      expect(summary).toBeDefined();
      expect(summary!.totalValue).toBe(10500);
    });

    it('should generate full report', () => {
      const pf = engine.createPortfolio({ name: 'RepTest', initialCash: 5000 });
      engine.executeTransaction(pf.id, {
        symbol: 'AAPL', type: 'BUY', quantity: 5, price: 100,
      });
      const report = engine.getFullReport(pf.id);
      expect(report).toBeDefined();
      expect(report!.summary).toBeDefined();
      expect(report!.risk).toBeDefined();
      expect(report!.allocation).toBeDefined();
    });

    it('should export report in JSON format', () => {
      const pf = engine.createPortfolio({ name: 'ExpTest', initialCash: 5000 });
      const json = engine.exportReport(pf.id, 'json');
      expect(json).toBeDefined();
      expect(JSON.parse(json!)).toBeDefined();
    });
  });

  describe('risk and allocation', () => {
    it('should calculate risk', () => {
      const pf = engine.createPortfolio({ name: 'RiskTest', initialCash: 10000 });
      const risk = engine.getRisk(pf.id);
      expect(risk).toBeDefined();
      expect(risk!.cashRatio).toBe(100);
    });

    it('should return allocation breakdowns', () => {
      const pf = engine.createPortfolio({ name: 'AllocTest', initialCash: 10000 });
      const allocations = engine.getAllocation(pf.id);
      expect(allocations).toHaveLength(5);
      expect(allocations.map((a) => a.type)).toContain('CASH');
      expect(allocations.map((a) => a.type)).toContain('SECTOR');
    });

    it('should generate risk warnings', () => {
      const pf = engine.createPortfolio({ name: 'WarnTest', initialCash: 1000 });
      const warnings = engine.getRiskWarnings(pf.id);
      expect(warnings).toBeDefined();
    });
  });

  describe('observability', () => {
    it('should return metrics', () => {
      engine.createPortfolio({ name: 'M1', initialCash: 5000 });
      engine.createPortfolio({ name: 'M2', initialCash: 3000 });
      const metrics = engine.getObservabilityMetrics();
      expect(metrics.totalPortfolios).toBe(2);
    });
  });
});
