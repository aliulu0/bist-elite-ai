import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SchedulerEngine } from './scheduler.engine';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import {
  MarketOpenScanJob,
  IncrementalScanJob,
  NightlyBacktestJob,
  BenchmarkJob,
  RuleAnalyticsJob,
  WeightOptimizationJob,
  CacheRefreshJob,
  ProviderHealthCheckJob,
  MacroRefreshJob,
  PortfolioRefreshJob,
  AlertRefreshJob,
  RetryFailedJobsJob,
  FullPipelineRunJob,
  ResearchRefreshJob,
  CompanyResearchJob,
  AgentReachRefreshJob,
  VerificationRefreshJob,
  DailyScanJob,
  IJob,
} from './jobs';
import { JobName } from './scheduler.types';
import { MarketDataModule } from '../market-data/market-data.module';
import { AnalysisPipelineModule } from '../analysis-pipeline/analysis-pipeline.module';
import { MarketScannerModule } from '../market-scanner/market-scanner.module';
import { ProviderHealthMonitorModule } from '../provider-health-monitor/provider-health-monitor.module';
import { BacktestModule } from '../backtest/backtest.module';
import { BacktestValidationModule } from '../backtest-validation/backtest-validation.module';
import { BenchmarkModule } from '../benchmark/benchmark.module';
import { EventBusModule } from '../event-bus/event-bus.module';
import { PerformanceMonitorModule } from '../performance-monitor/performance-monitor.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { MacroModule } from '../macro/macro.module';
import { PipelineOrchestratorModule } from '../pipeline-orchestrator/pipeline-orchestrator.module';
import { ResearchModule } from '../research/research.module';

const JOB_CLASSES = [
  MarketOpenScanJob,
  IncrementalScanJob,
  NightlyBacktestJob,
  BenchmarkJob,
  RuleAnalyticsJob,
  WeightOptimizationJob,
  CacheRefreshJob,
  ProviderHealthCheckJob,
  MacroRefreshJob,
  PortfolioRefreshJob,
  AlertRefreshJob,
  RetryFailedJobsJob,
  FullPipelineRunJob,
  ResearchRefreshJob,
  CompanyResearchJob,
  AgentReachRefreshJob,
  VerificationRefreshJob,
  DailyScanJob,
];

@Module({
  imports: [
    MarketDataModule,
    AnalysisPipelineModule,
    MarketScannerModule,
    ProviderHealthMonitorModule,
    BacktestModule,
    BacktestValidationModule,
    BenchmarkModule,
    EventBusModule,
    PerformanceMonitorModule,
    AuditLogModule,
    PersistenceModule,
    MacroModule,
    PipelineOrchestratorModule,
    ResearchModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerEngine, SchedulerService, ...JOB_CLASSES],
  exports: [SchedulerEngine, SchedulerService, ...JOB_CLASSES],
})
export class SchedulerModule implements OnModuleInit {
  private readonly logger = new Logger(SchedulerModule.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly engine: SchedulerEngine,
  ) {}

  onModuleInit(): void {
    const jobMap: [JobName, IJob][] = [
      ['marketOpenScan', this.moduleRef.get(MarketOpenScanJob)],
      ['incrementalScan', this.moduleRef.get(IncrementalScanJob)],
      ['nightlyBacktest', this.moduleRef.get(NightlyBacktestJob)],
      ['benchmark', this.moduleRef.get(BenchmarkJob)],
      ['ruleAnalytics', this.moduleRef.get(RuleAnalyticsJob)],
      ['weightOptimization', this.moduleRef.get(WeightOptimizationJob)],
      ['cacheRefresh', this.moduleRef.get(CacheRefreshJob)],
      ['providerHealthCheck', this.moduleRef.get(ProviderHealthCheckJob)],
      ['macroRefresh', this.moduleRef.get(MacroRefreshJob)],
      ['portfolioRefresh', this.moduleRef.get(PortfolioRefreshJob)],
      ['alertRefresh', this.moduleRef.get(AlertRefreshJob)],
      ['retryFailedJobs', this.moduleRef.get(RetryFailedJobsJob)],
      ['fullPipelineRun', this.moduleRef.get(FullPipelineRunJob)],
      ['researchRefresh', this.moduleRef.get(ResearchRefreshJob)],
      ['companyResearch', this.moduleRef.get(CompanyResearchJob)],
      ['agentReachRefresh', this.moduleRef.get(AgentReachRefreshJob)],
      ['verificationRefresh', this.moduleRef.get(VerificationRefreshJob)],
      ['dailyScan', this.moduleRef.get(DailyScanJob)],
    ];

    for (const [name, job] of jobMap) {
      if (job) {
        this.engine.registerJob(name, job);
      }
    }

    const explicit = process.env.SCHEDULER_ENABLED;
    const autoStart =
      explicit === undefined ? process.env.NODE_ENV !== 'test' : explicit !== 'false';
    if (autoStart) {
      const status = this.engine.getStatus();
      this.engine.start();
      this.logger.log(
        `Scheduler auto-started with ${status.jobs.filter((j) => j.enabled).length} active jobs`,
      );
    }
  }
}
