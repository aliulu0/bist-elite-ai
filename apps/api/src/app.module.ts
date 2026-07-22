import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './health.controller';
import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './common/auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';
import { SecurityModule } from './common/security/security.module';
import { CacheModule } from './common/cache/cache.module';
import { PerformanceModule } from './common/performance/performance.module';
import { ExplainabilityModule } from './common/explainability/explainability.module';
import { EliteScoreModule } from './common/elite-score/elite-score.module';
import { MultiTimeframeConsensusModule } from './common/multi-timeframe-consensus/multi-timeframe-consensus.module';
import { StrategyValidationModule } from './common/strategy-validation/strategy-validation.module';
import { AdaptiveCalibrationModule } from './common/adaptive-calibration/adaptive-calibration.module';
import { PaperPortfolioModule } from './common/paper-portfolio/paper-portfolio.module';
import { RecommendationTrackerModule } from './common/recommendation-tracker/recommendation-tracker.module';
import { MarketRegimeModule } from './common/market-regime/market-regime.module';
import { OpportunityLifecycleModule } from './common/opportunity-lifecycle/opportunity-lifecycle.module';
import { PortfolioIntelligenceModule } from './common/portfolio-intelligence/portfolio-intelligence.module';
import { ProductionReadinessModule } from './common/production-readiness/production-readiness.module';
import { AuthGuard } from './common/auth/guards/auth.guard';
import { RolesGuard } from './common/auth/guards/roles.guard';
import { PermissionsGuard } from './common/auth/guards/permissions.guard';
import { RateLimitGuard } from './common/security/guards/rate-limit.guard';
import { AuditLogInterceptor } from './common/auth/interceptors/audit-log.interceptor';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { RequestSizeInterceptor } from './common/security/interceptors/request-size.interceptor';
import { CacheInterceptor } from './common/cache/cache.interceptor';
import { CompressionInterceptor, ETagInterceptor } from './common/performance/compression.interceptor';
import { RequestDeduplicationInterceptor } from './common/performance/request-deduplication.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LoggerModule,
    MonitoringModule,
    SecurityModule,
    CacheModule,
    PerformanceModule,
    ExplainabilityModule,
    EliteScoreModule,
    MultiTimeframeConsensusModule,
    StrategyValidationModule,
    AdaptiveCalibrationModule,
    PaperPortfolioModule,
    RecommendationTrackerModule,
    MarketRegimeModule,
    OpportunityLifecycleModule,
    PortfolioIntelligenceModule,
    ProductionReadinessModule,
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
