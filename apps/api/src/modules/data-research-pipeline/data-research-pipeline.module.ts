import { Module, forwardRef } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { AIResearchHubModule } from '../ai-research/ai-research.module';
import { CacheModule } from '../../common/cache/cache.module';
import { CircuitBreakerModule } from '../market-data/circuit-breaker/circuit-breaker.module';
import { ResearchModule } from '../research/research.module';
import { IndicatorsModule } from '../indicators/indicators.module';
import { BacktestModule } from '../backtest/backtest.module';
import { SymbolRegistryModule } from '../market-data/symbol-registry/symbol-registry.module';
import { DataResearchPipelineService } from './services/data-research-pipeline.service';
import { ProviderHealthService } from './services/provider-health.service';
import { DataFreshnessService } from './services/data-freshness.service';
import { SourceQualityService } from './services/source-quality.service';
import { ResearchEvidenceService } from './services/research-evidence.service';
import { DataQualityService } from './services/data-quality.service';
import { MTFCoverageService } from './services/mtf-coverage.service';
import { IndicatorCoverageService } from './services/indicator-coverage.service';
import { AgentReachAdapter } from './providers/agent-reach.adapter';
import { VectorBTAdapter } from './providers/vectorbt.adapter';
import { DataResearchPipelineController } from './controller/data-research-pipeline.controller';

@Module({
  imports: [
    forwardRef(() => MarketDataModule),
    forwardRef(() => AIResearchHubModule),
    forwardRef(() => ResearchModule),
    forwardRef(() => IndicatorsModule),
    forwardRef(() => BacktestModule),
    SymbolRegistryModule,
    CacheModule,
    CircuitBreakerModule,
  ],
  controllers: [DataResearchPipelineController],
  providers: [
    DataResearchPipelineService,
    ProviderHealthService,
    DataFreshnessService,
    SourceQualityService,
    ResearchEvidenceService,
    DataQualityService,
    MTFCoverageService,
    IndicatorCoverageService,
    AgentReachAdapter,
    VectorBTAdapter,
  ],
  exports: [
    DataResearchPipelineService,
    ProviderHealthService,
    DataFreshnessService,
    SourceQualityService,
    ResearchEvidenceService,
    DataQualityService,
    MTFCoverageService,
    IndicatorCoverageService,
    AgentReachAdapter,
    VectorBTAdapter,
  ],
})
export class DataResearchPipelineModule {}