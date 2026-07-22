import { Module } from '@nestjs/common';
import { PaperRiskManagerService } from './paper-risk-manager.service';
import { PaperPerformanceTrackerService } from './paper-performance-tracker.service';
import { PaperReportGeneratorService } from './paper-report-generator.service';
import { PaperTradeExecutorService } from './paper-trade-executor.service';
import { PositionManagerService } from './position-manager.service';
import { PaperPortfolioOrchestratorService } from './paper-portfolio-orchestrator.service';

const services = [
  PaperRiskManagerService,
  PaperPerformanceTrackerService,
  PaperReportGeneratorService,
  PaperTradeExecutorService,
  PositionManagerService,
  PaperPortfolioOrchestratorService,
];

@Module({
  providers: services,
  exports: services,
})
export class PaperPortfolioModule {}
