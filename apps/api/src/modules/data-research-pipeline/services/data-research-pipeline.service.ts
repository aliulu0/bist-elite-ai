import { Injectable, Logger } from '@nestjs/common';
import { MarketDataOrchestrator } from '../../market-data/orchestrator/market-data-orchestrator';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { ProviderHealthService } from './provider-health.service';
import { DataFreshnessService } from './data-freshness.service';
import { SourceQualityService } from './source-quality.service';
import { ResearchEvidenceService } from './research-evidence.service';
import { DataQualityService } from './data-quality.service';
import { MTFCoverageService } from './mtf-coverage.service';
import { IndicatorCoverageService } from './indicator-coverage.service';
import { VectorBTAdapter } from '../providers/vectorbt.adapter';
import { AgentReachAdapter } from '../providers/agent-reach.adapter';
import { CacheService } from '../../../common/cache/cache.service';
import { NewsAggregationService } from '../../research/news-aggregation.service';
import {
  DataHealthReport,
  DataFreshnessReport,
  SourceQualityReport,
  ResearchEvidenceReport,
  DataQualityReport,
  MTFCoverageReport,
  IndicatorCoverageReport,
  AgentReachAdapterStatus,
  VectorBTAdapterReport,
} from '../interfaces';

@Injectable()
export class DataResearchPipelineService {
  private readonly logger = new Logger(DataResearchPipelineService.name);

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly symbolRegistry: SymbolRegistryService,
    private readonly providerHealth: ProviderHealthService,
    private readonly freshness: DataFreshnessService,
    private readonly sourceQuality: SourceQualityService,
    private readonly researchEvidence: ResearchEvidenceService,
    private readonly dataQuality: DataQualityService,
    private readonly mtfCoverage: MTFCoverageService,
    private readonly indicatorCoverage: IndicatorCoverageService,
    private readonly vectorBT: VectorBTAdapter,
    private readonly agentReach: AgentReachAdapter,
    private readonly cache: CacheService,
    private readonly newsAggregation: NewsAggregationService,
  ) {}

  // Provider Health
  async getDataHealth(): Promise<any> {
    return this.providerHealth.getDataHealthReport();
  }

  async getProviderHealth(): Promise<any[]> {
    return this.providerHealth.getProviderHealth();
  }

  // Data Freshness
  async getDataFreshness(): Promise<any> {
    return this.freshness.getFreshnessReport();
  }

  async getFreshnessForProvider(providerName: string): Promise<any> {
    return this.freshness.getFreshnessForProvider(providerName);
  }

  // Source Quality
  async getSourceQuality(): Promise<any> {
    return this.sourceQuality.getSourceQualityReport();
  }

  async getSourceQualityForProvider(providerName: string): Promise<any> {
    return this.sourceQuality.getSourceQualityForProvider(providerName);
  }

  // Research Evidence
  async getResearchEvidence(ticker: string): Promise<any> {
    return this.researchEvidence.getEvidenceForTicker(ticker);
  }

  async getStoriesForTicker(ticker: string): Promise<any[]> {
    return this.researchEvidence.getStoriesForTicker(ticker);
  }

  // Data Quality
  async getDataQuality(ticker: string, timeframe: string = '1d'): Promise<any> {
    return this.dataQuality.validateDataForTicker(ticker, timeframe);
  }

  // MTF Coverage
  async getMTFCoverage(ticker: string): Promise<any> {
    return this.mtfCoverage.getMTFCoverageForTicker(ticker);
  }

  async getMTFCoverageForTickers(tickers: string[]): Promise<any[]> {
    return this.mtfCoverage.getMTFCoverageForTickers(tickers);
  }

  async getOverallMTFCoverage(): Promise<any> {
    return this.mtfCoverage.getOverallMTFCoverage();
  }

  // Indicator Coverage
  async getIndicatorCoverage(): Promise<any> {
    return this.indicatorCoverage.getIndicatorCoverage();
  }

  // VectorBT
  async getVectorBTStatus(): Promise<any> {
    return this.vectorBT.getStatus();
  }

  // Agent Reach
  async getAgentReachStatus(): Promise<any> {
    return this.agentReach.getStatus();
  }

  async agentReachSearchCompany(ticker: string): Promise<any[]> {
    return this.agentReach.searchCompany(ticker);
  }

  async agentReachSearchNews(ticker: string): Promise<any[]> {
    return this.agentReach.searchNews(ticker);
  }

  // Unified Reports
  async getFullDataReport(ticker?: string): Promise<{
    health: any;
    freshness: any;
    sourceQuality: any;
    evidence?: any;
    dataQuality?: any;
    mtfCoverage?: any;
    indicatorCoverage?: any;
    vectorBT?: any;
    agentReach?: any;
  }> {
    const [health, freshness, sourceQuality, indicatorCoverage, vectorBT, agentReach] = await Promise.all([
      this.getDataHealth(),
      this.getDataFreshness(),
      this.getSourceQuality(),
      this.getIndicatorCoverage(),
      this.vectorBT.getStatus(),
      this.agentReach.getStatus(),
    ]);

    const result: any = {
      health,
      freshness,
      sourceQuality,
      indicatorCoverage,
      vectorBT,
      agentReach,
    };

    if (ticker) {
      const [evidence, dataQuality, mtfCoverage] = await Promise.all([
        this.getResearchEvidence(ticker),
        this.getDataQuality(ticker),
        this.getMTFCoverage(ticker),
      ]);
      result.evidence = evidence;
      result.dataQuality = dataQuality;
      result.mtfCoverage = mtfCoverage;
    }

    return result;
  }

  // Cache management
  async clearCaches(): Promise<{ cleared: number }> {
    const namespaces = [
      'data-health',
      'data-freshness',
      'source-quality',
      'research-evidence',
    ];
    let totalCleared = 0;
    for (const ns of namespaces) {
      totalCleared += this.cache.clear(ns);
    }
    return { cleared: totalCleared };
  }
}