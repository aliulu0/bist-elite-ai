import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioEngine } from './engine/portfolio-engine.service';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { PositionRepository } from './repositories/position.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { SnapshotRepository } from './repositories/snapshot.repository';
import { PositionManager } from './services/position-manager.service';
import { PortfolioCalculator } from './services/portfolio-calculator.service';
import { AllocationEngine } from './services/allocation-engine.service';
import { RiskCalculator } from './services/risk-calculator.service';
import { PerformanceCalculator } from './services/performance-calculator.service';
import { PortfolioHistory } from './services/portfolio-history.service';
import { ReportGenerator } from './services/report-generator.service';
import { ExportService } from './services/export.service';
import { PortfolioMetricsService } from './services/portfolio-metrics.service';
import { BenchmarkService } from './services/benchmark.service';

@Module({
  controllers: [PortfolioController],
  providers: [
    PortfolioEngine,
    PortfolioRepository,
    PositionRepository,
    TransactionRepository,
    SnapshotRepository,
    PositionManager,
    PortfolioCalculator,
    AllocationEngine,
    RiskCalculator,
    PerformanceCalculator,
    PortfolioHistory,
    ReportGenerator,
    ExportService,
    PortfolioMetricsService,
    BenchmarkService,
  ],
  exports: [
    PortfolioEngine,
    PortfolioRepository,
    PositionRepository,
    TransactionRepository,
    SnapshotRepository,
  ],
})
export class PortfolioModule {}
