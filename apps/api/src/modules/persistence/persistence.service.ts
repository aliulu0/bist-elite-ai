import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { EventBusEngine } from '../event-bus/event-bus.engine';
import { AuditLogEngine } from '../audit-log/audit-log.engine';
import { PerformanceMonitorEngine } from '../performance-monitor/performance-monitor.engine';
import {
  SaveAnalysisInput,
  SaveScannerInput,
  SaveBacktestPipelineInput,
  SaveProviderHealthInput,
  SaveJobRunInput,
  AnalysisResultRecord,
  ScannerRunRecord,
  BacktestPipelineRunRecord,
  ProviderHealthRecord,
  SchedulerJobRunRecord,
  AnalysisQueryOptions,
  ScannerQueryOptions,
  ProviderHealthQueryOptions,
  JobRunQueryOptions,
} from './persistence.types';

@Injectable()
export class PersistenceService {
  private readonly logger = new Logger(PersistenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusEngine,
    private readonly auditLog: AuditLogEngine,
    private readonly performanceMonitor: PerformanceMonitorEngine,
  ) {}

  private isAvailable(): boolean {
    return this.prisma.isDbConnected();
  }

  // ==========================================================
  // Analysis Result
  // ==========================================================

  async saveAnalysisResult(input: SaveAnalysisInput): Promise<AnalysisResultRecord | null> {
    if (!this.isAvailable()) {
      this.logger.debug('DB unavailable, skipping analysis result persistence');
      return null;
    }

    const start = Date.now();
    const { result } = input;

    try {
      const record = await this.prisma.analysisResult.create({
        data: {
          symbol: result.symbol,
          timeframe: result.timeframe,
          isValid: result.isValid,
          eliteScore: result.eliteScore?.eliteScore ?? null,
          eliteRating: result.eliteScore?.rating ?? null,
          elitePriority: result.eliteScore?.priority ?? null,
          opportunityScore: result.opportunity?.opportunityScore ?? null,
          opportunityLevel: result.opportunity?.opportunityLevel ?? null,
          financialScore: result.financialScore?.score ?? null,
          technicalScore: result.technicalScore?.score ?? null,
          smartMoneyScore: result.smartMoney?.smartMoneyConfidence ?? null,
          confluenceScore: result.confluence?.confluenceScore ?? null,
          candidateScore: result.candidate?.candidateScore ?? null,
          candidatePriority: result.candidate?.priority ?? null,
          confidence: result.eliteScore?.confidence ?? null,
          earlyOpportunity: result.eliteScore?.earlyOpportunity ?? false,
          indicators: result.indicators as any,
          marketStructure: result.marketStructure as any,
          smartMoney: result.smartMoney as any,
          technicalRules: result.technicalRules as any,
          technicalSummary: result.technicalSummary as any,
          financialRules: result.financialRules as any,
          financialSummary: result.financialSummary as any,
          confluence: result.confluence as any,
          candidate: result.candidate as any,
          opportunityDetail: result.opportunity as any,
          eliteScoreDetail: result.eliteScore as any,
          pipelineSteps: result.pipelineSteps as any,
          metadata: result.metadata as any,
        },
      });

      this.performanceMonitor.recordTiming('pipeline', 'save_analysis_result', start, {
        symbol: result.symbol,
        timeframe: result.timeframe,
      });

      this.eventBus.publish('persistence.analysis_result.saved', 'analysis', {
        symbol: result.symbol,
        timeframe: result.timeframe,
        recordId: record.id,
      }, { source: 'PersistenceService', severity: 'info' });

      this.auditLog.record({
        module: 'analysis_pipeline',
        entity: 'analysis_result',
        entityId: record.id,
        action: 'CREATED',
        severity: 'INFO',
        user: null,
        oldValue: null,
        newValue: { symbol: result.symbol, timeframe: result.timeframe },
        metadata: { recordId: record.id },
      });

      this.logger.debug(`Saved analysis result for ${result.symbol}/${result.timeframe} (${Date.now() - start}ms)`);
      return record as unknown as AnalysisResultRecord;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save analysis result for ${result.symbol}/${result.timeframe}: ${errorMsg}`);
      this.auditLog.record({
        module: 'analysis_pipeline',
        entity: 'analysis_result',
        entityId: `${result.symbol}_${result.timeframe}`,
        action: 'FAILED',
        severity: 'ERROR',
        user: null,
        oldValue: null,
        newValue: { error: errorMsg },
        metadata: {},
      });
      return null;
    }
  }

  async getLatestAnalysisResult(symbol: string, timeframe: string): Promise<AnalysisResultRecord | null> {
    if (!this.isAvailable()) return null;

    try {
      const record = await this.prisma.analysisResult.findFirst({
        where: { symbol, timeframe },
        orderBy: { createdAt: 'desc' },
      });
      return record as unknown as AnalysisResultRecord | null;
    } catch (error) {
      this.logger.error(`Failed to fetch analysis result for ${symbol}/${timeframe}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async getAnalysisHistory(options: AnalysisQueryOptions): Promise<AnalysisResultRecord[]> {
    if (!this.isAvailable()) return [];

    try {
      const where: Record<string, unknown> = {};
      if (options.symbol) where.symbol = options.symbol;
      if (options.timeframe) where.timeframe = options.timeframe;
      if (options.since || options.until) {
        where.createdAt = {
          ...(options.since ? { gte: options.since } : {}),
          ...(options.until ? { lte: options.until } : {}),
        };
      }

      const records = await this.prisma.analysisResult.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: options.limit ?? 50,
        skip: options.offset ?? 0,
      });
      return records as unknown as AnalysisResultRecord[];
    } catch (error) {
      this.logger.error(`Failed to fetch analysis history: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // ==========================================================
  // Scanner Run
  // ==========================================================

  async saveScannerRun(input: SaveScannerInput): Promise<ScannerRunRecord | null> {
    if (!this.isAvailable()) {
      this.logger.debug('DB unavailable, skipping scanner run persistence');
      return null;
    }

    const start = Date.now();
    const { scanType, result } = input;

    try {
      const run = await this.prisma.scannerRun.create({
        data: {
          scanType,
          totalSymbols: result.statistics.totalSymbols,
          topCandidateCount: result.statistics.topCandidateCount,
          watchlistCount: result.statistics.watchlistCount,
          rejectedCount: result.statistics.rejectedCount,
          avgEliteScore: result.statistics.avgEliteScore,
          avgOpportunityScore: result.statistics.avgOpportunityScore,
          avgCandidateScore: result.statistics.avgCandidateScore,
          scoreDistribution: result.statistics.scoreDistribution as any,
          topCandidates: result.topCandidates as any,
          watchlist: result.watchlist as any,
          rejected: result.rejected as any,
          metadata: result.metadata as any,
        },
      });

      const symbolRecords = await Promise.all(
        [
          ...result.topCandidates.map((s, i) => ({ ...s, status: 'TOP_CANDIDATE', rank: i + 1 })),
          ...result.watchlist.map((s, i) => ({ ...s, status: 'WATCHLIST', rank: i + 1 })),
          ...result.rejected.map((s, i) => ({ ...s, status: 'REJECTED', rank: i + 1 })),
        ].map((s) =>
          this.prisma.scannerSymbolResult.create({
            data: {
              scannerRunId: run.id,
              symbol: s.symbol,
              status: s.status,
              eliteScore: s.eliteScore,
              eliteRating: s.eliteRating,
              opportunityLevel: s.opportunityLevel,
              opportunityScore: null,
              candidateScore: s.candidateScore,
              compositeScore: s.compositeScore,
              rank: s.rank,
              reasons: s.reasons as any,
            },
          }),
        ),
      );

      this.performanceMonitor.recordTiming('scheduler', 'save_scanner_run', start, {
        scanType,
        totalSymbols: result.statistics.totalSymbols,
      });

      this.eventBus.publish('persistence.scanner_run.saved', 'scanner', {
        scanType,
        runId: run.id,
        totalSymbols: result.statistics.totalSymbols,
      }, { source: 'PersistenceService', severity: 'info' });

      this.auditLog.record({
        module: 'scanner',
        entity: 'scanner_run',
        entityId: run.id,
        action: 'CREATED',
        severity: 'INFO',
        user: null,
        oldValue: null,
        newValue: {
          scanType,
          totalSymbols: result.statistics.totalSymbols,
          topCandidates: result.statistics.topCandidateCount,
          watchlist: result.statistics.watchlistCount,
        },
        metadata: { symbolCount: symbolRecords.length },
      });

      this.logger.debug(`Saved scanner run ${run.id} (${Date.now() - start}ms)`);
      return {
        ...run,
        symbols: symbolRecords as unknown as any[],
      } as unknown as ScannerRunRecord;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save scanner run: ${errorMsg}`);
      this.auditLog.record({
        module: 'scanner',
        entity: 'scanner_run',
        entityId: scanType,
        action: 'FAILED',
        severity: 'ERROR',
        user: null,
        oldValue: null,
        newValue: { error: errorMsg },
        metadata: {},
      });
      return null;
    }
  }

  async getLatestScannerRun(scanType?: string): Promise<ScannerRunRecord | null> {
    if (!this.isAvailable()) return null;

    try {
      const where: Record<string, unknown> = {};
      if (scanType) where.scanType = scanType;

      const record = await this.prisma.scannerRun.findFirst({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        include: { symbols: true },
      });
      return record as unknown as ScannerRunRecord | null;
    } catch (error) {
      this.logger.error(`Failed to fetch scanner run: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async getScannerHistory(options: ScannerQueryOptions): Promise<ScannerRunRecord[]> {
    if (!this.isAvailable()) return [];

    try {
      const where: Record<string, unknown> = {};
      if (options.scanType) where.scanType = options.scanType;
      if (options.since) {
        where.createdAt = { gte: options.since };
      }

      const records = await this.prisma.scannerRun.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: options.limit ?? 20,
        skip: options.offset ?? 0,
        include: { symbols: true },
      });
      return records as unknown as ScannerRunRecord[];
    } catch (error) {
      this.logger.error(`Failed to fetch scanner history: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // ==========================================================
  // Backtest Pipeline
  // ==========================================================

  async saveBacktestPipelineRun(input: SaveBacktestPipelineInput): Promise<BacktestPipelineRunRecord | null> {
    if (!this.isAvailable()) {
      this.logger.debug('DB unavailable, skipping backtest pipeline persistence');
      return null;
    }

    const start = Date.now();

    try {
      const record = await this.prisma.backtestPipelineRun.create({
        data: {
          symbolsProcessed: input.symbolsProcessed,
          symbolsSucceeded: input.symbolsSucceeded,
          symbolsFailed: input.symbolsFailed,
          totalTrades: input.totalTrades,
          winRate: input.winRate,
          avgReturn: input.avgReturn,
          maxDrawdown: input.maxDrawdown,
          profitFactor: input.profitFactor,
          benchmarkAlpha: input.benchmarkAlpha,
          benchmarkBeta: input.benchmarkBeta,
          perSymbolResults: input.perSymbolResults as any,
          benchmarkReturns: input.benchmarkReturns as any,
          metadata: input.metadata as any,
          completionStatus: input.status,
          errorMessage: input.error,
          startedAt: input.startedAt,
          completedAt: input.completedAt,
        },
      });

      this.performanceMonitor.recordTiming('scheduler', 'save_backtest_pipeline_run', start, {
        symbolsProcessed: input.symbolsProcessed,
      });

      this.eventBus.publish('persistence.backtest_pipeline_run.saved', 'backtest', {
        runId: record.id,
        symbolsProcessed: input.symbolsProcessed,
        symbolsSucceeded: input.symbolsSucceeded,
      }, { source: 'PersistenceService', severity: 'info' });

      this.auditLog.record({
        module: 'backtest',
        entity: 'backtest_pipeline_run',
        entityId: record.id,
        action: 'CREATED',
        severity: 'INFO',
        user: null,
        oldValue: null,
        newValue: {
          symbolsProcessed: input.symbolsProcessed,
          symbolsSucceeded: input.symbolsSucceeded,
          totalTrades: input.totalTrades,
        },
        metadata: {},
      });

      this.logger.debug(`Saved backtest pipeline run ${record.id} (${Date.now() - start}ms)`);
      return record as unknown as BacktestPipelineRunRecord;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save backtest pipeline run: ${errorMsg}`);
      this.auditLog.record({
        module: 'backtest',
        entity: 'backtest_pipeline_run',
        entityId: 'latest',
        action: 'FAILED',
        severity: 'ERROR',
        user: null,
        oldValue: null,
        newValue: { error: errorMsg },
        metadata: {},
      });
      return null;
    }
  }

  async getLatestBacktestPipelineRun(): Promise<BacktestPipelineRunRecord | null> {
    if (!this.isAvailable()) return null;

    try {
      const record = await this.prisma.backtestPipelineRun.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      return record as unknown as BacktestPipelineRunRecord | null;
    } catch (error) {
      this.logger.error(`Failed to fetch backtest pipeline run: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async getBacktestHistory(limit = 10): Promise<BacktestPipelineRunRecord[]> {
    if (!this.isAvailable()) return [];

    try {
      const records = await this.prisma.backtestPipelineRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return records as unknown as BacktestPipelineRunRecord[];
    } catch (error) {
      this.logger.error(`Failed to fetch backtest history: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // ==========================================================
  // Provider Health
  // ==========================================================

  async saveProviderHealth(input: SaveProviderHealthInput): Promise<ProviderHealthRecord[]> {
    if (!this.isAvailable()) {
      this.logger.debug('DB unavailable, skipping provider health persistence');
      return [];
    }

    const start = Date.now();
    const { snapshot } = input;

    try {
      const records = await Promise.all(
        snapshot.providers.map((provider) =>
          this.prisma.providerHealthRecord.create({
            data: {
              provider: provider.provider,
              status: provider.status,
              totalRequests: provider.totalRequests,
              successfulRequests: provider.successfulRequests,
              failedRequests: provider.failedRequests,
              timeoutCount: provider.timeoutCount,
              consecutiveFailures: provider.consecutiveFailures,
              avgLatencyMs: provider.avgLatencyMs,
              p50LatencyMs: provider.p50LatencyMs,
              p95LatencyMs: provider.p95LatencyMs,
              p99LatencyMs: provider.p99LatencyMs,
              reliabilityScore: provider.reliabilityScore,
              successRate: provider.successRate,
              errorRate: provider.errorRate,
              uptime: provider.uptime,
              lastFailureTime: provider.lastFailureTime ? new Date(provider.lastFailureTime) : null,
              lastSuccessTime: provider.lastSuccessTime ? new Date(provider.lastSuccessTime) : null,
              lastRequestTime: provider.lastRequestTime ? new Date(provider.lastRequestTime) : null,
              recoveryTimeMs: provider.recoveryTimeMs,
              snapshotTime: new Date(snapshot.timestamp),
            },
          }),
        ),
      );

      this.performanceMonitor.recordTiming('scheduler', 'save_provider_health', start, {
        providerCount: records.length,
      });

      this.eventBus.publish('persistence.provider_health.saved', 'provider', {
        providerCount: records.length,
        overallStatus: snapshot.overallStatus,
      }, { source: 'PersistenceService', severity: 'info' });

      this.logger.debug(`Saved provider health for ${records.length} providers (${Date.now() - start}ms)`);
      return records as unknown as ProviderHealthRecord[];
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save provider health: ${errorMsg}`);
      this.auditLog.record({
        module: 'provider_health',
        entity: 'provider_health',
        entityId: 'latest',
        action: 'FAILED',
        severity: 'ERROR',
        user: null,
        oldValue: null,
        newValue: { error: errorMsg },
        metadata: {},
      });
      return [];
    }
  }

  async getProviderHealthHistory(options: ProviderHealthQueryOptions): Promise<ProviderHealthRecord[]> {
    if (!this.isAvailable()) return [];

    try {
      const where: Record<string, unknown> = {};
      if (options.provider) where.provider = options.provider;
      if (options.since) {
        where.snapshotTime = { gte: options.since };
      }

      const records = await this.prisma.providerHealthRecord.findMany({
        where: where as any,
        orderBy: { snapshotTime: 'desc' },
        take: options.limit ?? 50,
      });
      return records as unknown as ProviderHealthRecord[];
    } catch (error) {
      this.logger.error(`Failed to fetch provider health history: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async getLatestProviderHealth(): Promise<ProviderHealthRecord[]> {
    if (!this.isAvailable()) return [];

    try {
      const records = await this.prisma.providerHealthRecord.findMany({
        orderBy: { snapshotTime: 'desc' },
        take: 4,
      });
      return records as unknown as ProviderHealthRecord[];
    } catch (error) {
      this.logger.error(`Failed to fetch latest provider health: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // ==========================================================
  // Scheduler Job Run
  // ==========================================================

  async saveJobRun(input: SaveJobRunInput): Promise<SchedulerJobRunRecord | null> {
    if (!this.isAvailable()) {
      this.logger.debug('DB unavailable, skipping job run persistence');
      return null;
    }

    const start = Date.now();

    try {
      const record = await this.prisma.schedulerJobRun.create({
        data: {
          jobName: input.jobName,
          status: input.status,
          symbolsProcessed: input.symbolsProcessed,
          symbolsSucceeded: input.symbolsSucceeded,
          symbolsFailed: input.symbolsFailed,
          durationMs: input.durationMs,
          error: input.error,
          metadata: input.metadata as any,
          startedAt: input.startedAt,
          completedAt: input.completedAt,
        },
      });

      this.performanceMonitor.recordTiming('scheduler', 'save_job_run', start, {
        jobName: input.jobName,
      });

      this.eventBus.publish('persistence.job_run.saved', 'scheduler', {
        jobName: input.jobName,
        status: input.status,
        recordId: record.id,
      }, { source: 'PersistenceService', severity: 'info' });

      this.auditLog.record({
        module: 'scheduler',
        entity: 'scheduler_job_run',
        entityId: record.id,
        action: 'CREATED',
        severity: input.status === 'failed' ? 'ERROR' : 'INFO',
        user: null,
        oldValue: null,
        newValue: {
          jobName: input.jobName,
          status: input.status,
          durationMs: input.durationMs,
        },
        metadata: {},
      });

      this.logger.debug(`Saved job run for ${input.jobName} (${Date.now() - start}ms)`);
      return record as unknown as SchedulerJobRunRecord;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save job run for ${input.jobName}: ${errorMsg}`);
      return null;
    }
  }

  async getJobHistory(options: JobRunQueryOptions): Promise<SchedulerJobRunRecord[]> {
    if (!this.isAvailable()) return [];

    try {
      const where: Record<string, unknown> = {};
      if (options.jobName) where.jobName = options.jobName;
      if (options.since) {
        where.startedAt = { gte: options.since };
      }

      const records = await this.prisma.schedulerJobRun.findMany({
        where: where as any,
        orderBy: { startedAt: 'desc' },
        take: options.limit ?? 50,
      });
      return records as unknown as SchedulerJobRunRecord[];
    } catch (error) {
      this.logger.error(`Failed to fetch job history: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async getLatestJobRun(jobName: string): Promise<SchedulerJobRunRecord | null> {
    if (!this.isAvailable()) return null;

    try {
      const record = await this.prisma.schedulerJobRun.findFirst({
        where: { jobName },
        orderBy: { startedAt: 'desc' },
      });
      return record as unknown as SchedulerJobRunRecord | null;
    } catch (error) {
      this.logger.error(`Failed to fetch latest job run for ${jobName}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  // ==========================================================
  // Statistics
  // ==========================================================

  async getPersistenceStats(): Promise<Record<string, number>> {
    if (!this.isAvailable()) return {};

    try {
      const [analysisCount, scannerCount, backtestCount, healthCount, jobCount] = await Promise.all([
        this.prisma.analysisResult.count(),
        this.prisma.scannerRun.count(),
        this.prisma.backtestPipelineRun.count(),
        this.prisma.providerHealthRecord.count(),
        this.prisma.schedulerJobRun.count(),
      ]);

      return {
        analysisResults: analysisCount,
        scannerRuns: scannerCount,
        backtestPipelineRuns: backtestCount,
        providerHealthRecords: healthCount,
        schedulerJobRuns: jobCount,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch persistence stats: ${error instanceof Error ? error.message : String(error)}`);
      return {};
    }
  }
}
