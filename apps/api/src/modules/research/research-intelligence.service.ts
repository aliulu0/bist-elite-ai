import { Injectable, Logger } from '@nestjs/common';
import {
  CompanyResearchBundle,
  ResearchIntelligenceDashboard,
  ResearchProviderStatusEntry,
} from './interfaces/research-intelligence.types';
import { NewsAggregationService } from './news-aggregation.service';
import { ResearchAggregatorService } from './research-aggregator.service';
import { ResearchScoreService } from './research-score.service';
import { ResearchVerificationService } from './research-verification.service';
import { CatalystDetectionService } from './catalyst-detection.service';
import { ResearchRepository } from './research-repository.service';
import { ResearchCacheService } from './research-cache.service';
import { GoogleNewsProvider } from './providers/google-news.provider';
import { SerpApiResearchProvider } from './providers/serp-api.research-provider';
import { AgentReachProvider } from './providers/agent-reach.provider';
import { CompanyResearchResult } from './interfaces/agent-reach.types';

@Injectable()
export class ResearchIntelligenceService {
  private readonly logger = new Logger(ResearchIntelligenceService.name);

  constructor(
    private readonly newsAggregation: NewsAggregationService,
    private readonly aggregator: ResearchAggregatorService,
    private readonly scoreService: ResearchScoreService,
    private readonly verificationService: ResearchVerificationService,
    private readonly catalystDetection: CatalystDetectionService,
    private readonly researchRepository: ResearchRepository,
    private readonly cache: ResearchCacheService,
    private readonly googleNews: GoogleNewsProvider,
    private readonly serpApi: SerpApiResearchProvider,
    private readonly agentReach: AgentReachProvider,
  ) {}

  async refreshResearch(): Promise<ResearchIntelligenceDashboard> {
    const articles = await this.newsAggregation.getNews();
    const aggregation = this.aggregator.aggregate({ news: articles });
    const score = this.scoreService.score(aggregation.items);
    const catalysts = this.catalystDetection.detect(aggregation.items);
    const verifiedSources = aggregation.items.filter((item) => item.official).length;

    const dashboard: ResearchIntelligenceDashboard = {
      researchScore: score,
      verifiedSources,
      latestResearch: aggregation.items.slice(0, 20),
      catalysts,
      googleFinanceSummary: null,
      aiSummary: null,
      generatedAt: new Date().toISOString(),
    };

    this.cache.set('research:dashboard', dashboard, 10 * 60_000);
    return dashboard;
  }

  async refreshCompanyResearch(tickers: string[]): Promise<{ refreshed: number; failed: number }> {
    let refreshed = 0;
    let failed = 0;

    for (const ticker of tickers) {
      try {
        const research = await this.agentReach.getCompanyResearch(ticker);
        if (!research) {
          failed++;
          continue;
        }
        await this.researchRepository.setCompanyResearch(ticker, research);
        const bundle = await this.buildCompanyBundle(ticker, research);
        this.cache.set(`research:company:${ticker}`, bundle, 30 * 60_000);
        refreshed++;
      } catch (error) {
        failed++;
        this.logger.warn(
          `Company research failed for ${ticker}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return { refreshed, failed };
  }

  async getCompanyResearch(ticker: string): Promise<CompanyResearchBundle> {
    const cached = this.cache.get<CompanyResearchBundle>(`research:company:${ticker}`);
    if (cached) return cached;
    const bundle = await this.refreshCompanyBundle(ticker);
    this.cache.set(`research:company:${ticker}`, bundle, 30 * 60_000);
    return bundle;
  }

  async getDashboard(ticker?: string): Promise<ResearchIntelligenceDashboard> {
    if (ticker) {
      const bundle = await this.getCompanyResearch(ticker);
      return this.toDashboard(ticker, bundle);
    }

    const cached = this.cache.get<ResearchIntelligenceDashboard>('research:dashboard');
    if (cached) return cached;
    return this.refreshResearch();
  }

  async getProviderStatus(): Promise<ResearchProviderStatusEntry[]> {
    const entries: ResearchProviderStatusEntry[] = [
      this.toProviderEntry(this.googleNews, 'google_search'),
      this.toProviderEntry(this.serpApi, this.serpApi.getEngine()),
      this.toProviderEntry(this.agentReach, 'google_search'),
    ];
    return entries;
  }

  private async refreshCompanyBundle(ticker: string): Promise<CompanyResearchBundle> {
    const research = await this.agentReach.getCompanyResearch(ticker);
    if (research) {
      await this.researchRepository.setCompanyResearch(ticker, research);
    }
    return this.buildCompanyBundle(ticker, research);
  }

  private async buildCompanyBundle(
    ticker: string,
    research: CompanyResearchResult,
  ): Promise<CompanyResearchBundle> {
    const articles = await this.newsAggregation.getCompanyNews(ticker);
    const aggregation = this.aggregator.aggregate({
      news: articles,
      ticker,
      sector: research.sector || undefined,
      companyName: research.companyName,
    });
    const finance = await this.serpApi.searchFinancial(ticker);
    const score = this.scoreService.score(aggregation.items);
    const verification = this.verificationService.verifyStatements(
      aggregation.items,
      ticker,
      research.companyName,
    );
    const catalysts = this.catalystDetection.detect(aggregation.items);

    return {
      ticker,
      companyName: research.companyName,
      sector: research.sector,
      aggregator: aggregation,
      score,
      verification,
      catalysts,
      googleFinance: finance,
      aiSummary: null,
      generatedAt: new Date().toISOString(),
    };
  }

  private toDashboard(ticker: string, bundle: CompanyResearchBundle): ResearchIntelligenceDashboard {
    return {
      ticker,
      companyName: bundle.companyName,
      researchScore: bundle.score,
      verifiedSources: bundle.aggregator.items.filter((item) => item.official).length,
      latestResearch: bundle.aggregator.items.slice(0, 20),
      catalysts: bundle.catalysts,
      googleFinanceSummary: bundle.googleFinance,
      aiSummary: bundle.aiSummary,
      generatedAt: new Date().toISOString(),
    };
  }

  private toProviderEntry(
    provider: { name: string; getStatus(): { connected?: unknown; circuitState?: unknown; avgLatencyMs?: unknown; totalRequests?: unknown; failedRequests?: unknown; lastSync?: unknown } },
    engine: string,
  ): ResearchProviderStatusEntry {
    const status = provider.getStatus();
    return {
      name: provider.name,
      engine: engine as ResearchProviderStatusEntry['engine'],
      connected: Boolean(status.connected),
      circuitState: String(status.circuitState ?? 'closed'),
      latency: typeof status.avgLatencyMs === 'number' ? status.avgLatencyMs : 0,
      requests: typeof status.totalRequests === 'number' ? status.totalRequests : 0,
      errors: typeof status.failedRequests === 'number' ? status.failedRequests : 0,
      quota: null,
      lastSync: status.lastSync ? String(status.lastSync) : null,
      cacheStatus: 'in-memory',
    };
  }
}