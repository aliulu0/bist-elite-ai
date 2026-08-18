import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './health.controller';

// ── Infrastructure Modules ──
import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './common/auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';
import { SecurityModule } from './common/security/security.module';

// ── Shared / Common Modules ──
import { CacheModule } from './common/cache/cache.module';
import { PerformanceModule } from './common/performance/performance.module';
import { ExplainabilityModule } from './common/explainability/explainability.module';
import { EliteScoreModule } from './common/elite-score/elite-score.module';
import { MultiTimeframeConsensusModule } from './common/multi-timeframe-consensus/multi-timeframe-consensus.module';
import { StrategyValidationModule } from './common/strategy-validation/strategy-validation.module';
import { AdaptiveCalibrationModule } from './common/adaptive-calibration/adaptive-calibration.module';
import { MarketRegimeModule } from './common/market-regime/market-regime.module';
import { OpportunityLifecycleModule } from './common/opportunity-lifecycle/opportunity-lifecycle.module';
import { PortfolioIntelligenceModule as PortfolioIntelligenceDashboardModule } from './common/portfolio-intelligence/portfolio-intelligence.module';
import { ProductionReadinessModule } from './common/production-readiness/production-readiness.module';
import { PaperPortfolioModule } from './common/paper-portfolio/paper-portfolio.module';
import { RecommendationTrackerModule } from './common/recommendation-tracker/recommendation-tracker.module';
import { PersistenceModule } from './modules/persistence/persistence.module';
import { EventBusModule } from './modules/event-bus/event-bus.module';

// ── Provider Modules ──
import { SymbolRegistryModule } from './modules/market-data/symbol-registry/symbol-registry.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import { HistoricalMarketDataModule } from './modules/market-data/historical/historical-market-data.module';
import { ResearchModule } from './modules/research/research.module';
import { AggregationModule } from './modules/market-data/aggregation/aggregation.module';
import { ProviderHealthMonitorModule } from './modules/provider-health-monitor/provider-health-monitor.module';
import { HistoricalDataModule } from './modules/historical-data/historical-data.module';

// ── Analysis / Indicator Modules (Core Engines tier) ──
import { FinancialRulesModule } from './modules/financial-rules/financial-rules.module';
import { IndicatorsModule } from './modules/indicators/indicators.module';
import { MarketStructureModule } from './modules/market-structure/market-structure.module';
import { SmartMoneyModule } from './modules/smart-money/smart-money.module';
import { TechnicalRulesModule } from './modules/technical-rules/technical-rules.module';
import { TechnicalScoreModule } from './modules/technical-score/technical-score.module';
import { TechnicalSummaryModule } from './modules/technical-summary/technical-summary.module';
import { TechnicalAnalysisModule } from './modules/technical-analysis/technical-analysis.module';
import { ConfluenceModule } from './modules/confluence/confluence.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { OpportunityModule } from './modules/opportunity/opportunity.module';
import { EliteScoreModule as PipelineEliteScoreModule } from './modules/elite-score/elite-score.module';
import { AiAnalysisModule } from './modules/ai-analysis/ai-analysis.module';
import { OpportunityDetectionModule } from './modules/opportunity-detection/opportunity-detection.module';

// ── Scanner / Ranking / Scheduler / Workflow (Core Engines) ──
import { MarketScannerModule } from './modules/market-scanner/market-scanner.module';
import { ScannerModule } from './modules/scanner/scanner.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { DecisionModule } from './modules/decision/decision.module';
import { OpportunityModule as AiOpportunityModule } from './modules/ai-opportunity/opportunity.module';
import { OpportunityCenterModule } from './modules/opportunity-center/opportunity-center.module';
import { EliteScoreModule as AiEliteScoreModule } from './modules/ai-elite-score/elite-score.module';
import { TomorrowModule as AiTomorrowModule } from './modules/tomorrow/tomorrow.module';
import { EntryModule as AiEntryModule } from './modules/entry/entry.module';
import { AnalystModule as AiAnalystModule } from './modules/analyst/analyst.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { AnalysisPipelineModule } from './modules/analysis-pipeline/analysis-pipeline.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { WorkflowQueueModule } from './modules/workflow-queue/workflow-queue.module';
import { WorkflowIntegrationModule } from './modules/workflow-integration/workflow-integration.module';
import { BacktestValidationModule } from './modules/backtest-validation/backtest-validation.module';
import { BacktestModule } from './modules/backtest/backtest.module';
import { BenchmarkModule } from './modules/benchmark/benchmark.module';
import { RuleAnalyticsModule } from './modules/rule-analytics/rule-analytics.module';
import { WeightOptimizerModule } from './modules/weight-optimizer/weight-optimizer.module';
import { AIResearchHubModule } from './modules/ai-research/ai-research.module';
import { VerificationAIModule } from './modules/verification-ai/verification-ai.module';
import { CatalystModule } from './modules/catalyst/catalyst.module';
import { PredictionModule } from './modules/prediction/prediction.module';
import { IndicatorCacheModule } from './modules/indicator-cache/indicator-cache.module';
import { PerformanceMetricsModule } from './modules/performance-metrics/performance-metrics.module';

// ── Pipeline ──
import { PipelineOrchestratorModule } from './modules/pipeline-orchestrator/pipeline-orchestrator.module';

// ── Early Opportunity Engine ──
import { EarlyOpportunityModule } from './modules/ai-early-opportunity/early-opportunity.module';
import { RadarModule } from './modules/ai-early-opportunity/radar/radar.module';

// ── Early Opportunity Backtest (R2-046) ──
import { EarlyOpportunityBacktestModule } from './modules/early-opportunity-backtest/early-opportunity-backtest.module';

// ── Data Research Pipeline (R2-031) ──
import { DataResearchPipelineModule } from './modules/data-research-pipeline/data-research-pipeline.module';

// ── Portfolio ──
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { PortfolioIntelligenceModule } from './modules/portfolio-intelligence/portfolio-intelligence.module';

// ── Alerts ──
import { AlertsModule } from './modules/alerts/alerts.module';

// ── Macro ──
import { MacroModule } from './modules/macro/macro.module';

// ── Dashboard / Diagnostics / API ──
import { OpenAPIModule } from './modules/openapi/openapi.module';
import { SDKGeneratorModule } from './modules/sdk-generator/sdk-generator.module';
import { ContractValidatorModule } from './modules/contract-validator/contract-validator.module';
import { SystemDiagnosticsModule } from './modules/system-diagnostics/system-diagnostics.module';
import { PerformanceMonitorModule } from './modules/performance-monitor/performance-monitor.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { ConfigurationModule } from './modules/configuration/configuration.module';

// ── AI Assistant / Reports / Advisor ──
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';

// ── Multi Market Support ──
import { MultiMarketModule } from './modules/multi-market/multi-market.module';

// ── Portfolio Optimization ──
import { PortfolioOptimizationModule } from './modules/portfolio-optimization/portfolio-optimization.module';

// ── WebSocket Gateway ──
import { WebSocketGatewayModule } from './modules/websocket-gateway/websocket-gateway.module';

// ── Guards & Interceptors ──
import { AuthGuard } from './common/auth/guards/auth.guard';
import { RolesGuard } from './common/auth/guards/roles.guard';
import { PermissionsGuard } from './common/auth/guards/permissions.guard';
import { RateLimitGuard } from './common/security/guards/rate-limit.guard';
import { AuditLogInterceptor } from './common/auth/interceptors/audit-log.interceptor';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { RequestSizeInterceptor } from './common/security/interceptors/request-size.interceptor';
import { CacheInterceptor } from './common/cache/cache.interceptor';
import {
  CompressionInterceptor,
  ETagInterceptor,
} from './common/performance/compression.interceptor';
import { RequestDeduplicationInterceptor } from './common/performance/request-deduplication.interceptor';

@Module({
  imports: [
    // ── Infrastructure ──
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LoggerModule,
    MonitoringModule,
    SecurityModule,

    // ── Shared / Common ──
    CacheModule,
    PerformanceModule,
    ExplainabilityModule,
    EliteScoreModule,
    MultiTimeframeConsensusModule,
    StrategyValidationModule,
    AdaptiveCalibrationModule,
    MarketRegimeModule,
    OpportunityLifecycleModule,
    PortfolioIntelligenceDashboardModule,
    ProductionReadinessModule,
    PaperPortfolioModule,
    RecommendationTrackerModule,
    PersistenceModule,
    EventBusModule,

    // ── Provider Modules ──
    SymbolRegistryModule,
    MarketDataModule,
    HistoricalMarketDataModule,
    ResearchModule,
    AggregationModule,
    ProviderHealthMonitorModule,
    HistoricalDataModule,

    // ── Core Engines: Analysis / Indicators ──
    FinancialRulesModule,
    IndicatorsModule,
    MarketStructureModule,
    SmartMoneyModule,
    TechnicalRulesModule,
    TechnicalScoreModule,
    TechnicalSummaryModule,
    TechnicalAnalysisModule,
    ConfluenceModule,
    CandidateModule,
    OpportunityModule,
    PipelineEliteScoreModule,
    AiAnalysisModule,
    OpportunityDetectionModule,

    // ── Core Engines: Scanner / Ranking / Scheduler / Workflow ──
    MarketScannerModule,
    ScannerModule,
    ScoringModule,
    DecisionModule,
    AiOpportunityModule,
    OpportunityCenterModule,
    AiEliteScoreModule,
    AiTomorrowModule,
    AiEntryModule,
    AiAnalystModule,
    RankingModule,
    AnalysisPipelineModule,
    SchedulerModule,
    WorkflowModule,
    WorkflowQueueModule,
    WorkflowIntegrationModule,
    BacktestValidationModule,
    BacktestModule,
    BenchmarkModule,
    RuleAnalyticsModule,
    WeightOptimizerModule,

    // ── AI Research Hub ──
    AIResearchHubModule,

    // ── Verification AI ──
    VerificationAIModule,

    // ── Catalyst Engine ──
    CatalystModule,

    // ── Prediction Engine ──
    PredictionModule,

    // ── Indicator Cache & Dedup Engine (R2-043) ──
    IndicatorCacheModule,

    // ── Performance Metrics (R2-043) ──
    PerformanceMetricsModule,

    // ── Early Opportunity Engine ──
    EarlyOpportunityModule,

    // ── Live Opportunity Monitoring & Radar Engine (R2-048) ──
    RadarModule,

    // ── Early Opportunity Backtest (R2-046) ──
    EarlyOpportunityBacktestModule,

    // ── Data Research Pipeline (R2-031) ──
    DataResearchPipelineModule,

    // ── Pipeline ──
    PipelineOrchestratorModule,

    // ── Portfolio Intelligence (R2-030) ──
    PortfolioIntelligenceModule,

    // ── Portfolio ──
    PortfolioModule,

    // ── Portfolio Optimization Engine ──
    PortfolioOptimizationModule,

    // ── Alerts ──
    AlertsModule,

    // ── Macro ──
    MacroModule,

    // ── Dashboard / Diagnostics / API ──
    OpenAPIModule,
    SDKGeneratorModule,
    ContractValidatorModule,
    SystemDiagnosticsModule,
    PerformanceMonitorModule,
    AuditLogModule,
    ConfigurationModule,

    // ── AI Assistant / Reports / Advisor ──
    AiAssistantModule,

    // ── Multi Market Support ──
    MultiMarketModule,

    // ── Portfolio Optimization ──
    PortfolioOptimizationModule,

    // ── WebSocket Gateway ──
    WebSocketGatewayModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestSizeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CompressionInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ETagInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RequestDeduplicationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
  ],
})
export class AppModule {}
