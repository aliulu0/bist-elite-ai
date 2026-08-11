import { Injectable, Logger } from '@nestjs/common';
import {
  ResearchArticle,
  ResearchFilter,
  ResearchProviderStatus,
} from './interfaces/research.types';
import { GoogleNewsProvider } from './providers/google-news.provider';
import { SerpApiResearchProvider } from './providers/serp-api.research-provider';
import { AgentReachProvider } from './providers/agent-reach.provider';
import { ResearchCacheService } from './research-cache.service';

@Injectable()
export class NewsAggregationService {
  private readonly logger = new Logger(NewsAggregationService.name);

  constructor(
    private readonly googleNews: GoogleNewsProvider,
    private readonly serpApi: SerpApiResearchProvider,
    private readonly agentReach: AgentReachProvider,
    private readonly cache: ResearchCacheService,
  ) {}

  async getNews(filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const cacheKey = `news:all:${JSON.stringify(filter ?? {})}`;
    const cached = this.cache.get<ResearchArticle[]>(cacheKey);
    if (cached) return cached;

    const providers = await Promise.all([
      this.googleNews.fetchNews(filter),
      this.serpApi.fetchNews(filter),
      this.agentReach.fetchNews(filter),
    ]);
    const merged = this.merge(providers.flat(), filter);
    this.cache.set(cacheKey, merged, 5 * 60_000);
    return merged;
  }

  async getCompanyNews(ticker: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const cacheKey = `news:company:${ticker}`;
    const cached = this.cache.get<ResearchArticle[]>(cacheKey);
    if (cached) return cached;

    const providers = await Promise.all([
      this.googleNews.fetchCompanyNews(ticker, filter),
      this.serpApi.fetchCompanyNews(ticker, filter),
      this.agentReach.fetchCompanyNews(ticker, filter),
    ]);
    const merged = this.merge(providers.flat(), filter);
    this.cache.set(cacheKey, merged, 10 * 60_000);
    return merged;
  }

  async getSectorNews(sector: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const cacheKey = `news:sector:${sector}`;
    const cached = this.cache.get<ResearchArticle[]>(cacheKey);
    if (cached) return cached;

    const providers = await Promise.all([
      this.googleNews.fetchSectorNews(sector, filter),
      this.serpApi.fetchSectorNews(sector, filter),
      this.agentReach.fetchSectorNews(sector, filter),
    ]);
    const merged = this.merge(providers.flat(), filter);
    this.cache.set(cacheKey, merged, 10 * 60_000);
    return merged;
  }

  async getEconomicNews(filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const cacheKey = 'news:economic';
    const cached = this.cache.get<ResearchArticle[]>(cacheKey);
    if (cached) return cached;

    const providers = await Promise.all([
      this.googleNews.fetchEconomicNews(filter),
      this.serpApi.fetchEconomicNews(filter),
      this.agentReach.fetchEconomicNews(filter),
    ]);
    const merged = this.merge(providers.flat(), filter);
    this.cache.set(cacheKey, merged, 5 * 60_000);
    return merged;
  }

  getProviderStatus(): ResearchProviderStatus[] {
    return [this.googleNews, this.serpApi, this.agentReach].map((provider) => {
      const status = provider.getStatus();
      return {
        name: provider.name,
        connected: status.connected ?? false,
        circuitState: status.circuitState ?? 'closed',
        lastSync: status.lastSync ?? undefined,
        latency: status.avgLatencyMs ?? 0,
        errorCount: status.failedRequests ?? 0,
        cacheStatus: 'in-memory',
      };
    });
  }

  private merge(articles: ResearchArticle[], filter?: ResearchFilter): ResearchArticle[] {
    const unique = new Map<string, ResearchArticle>();
    for (const article of articles) {
      const key = article.url || article.id;
      if (unique.has(key)) continue;
      unique.set(key, article);
    }

    let result = Array.from(unique.values());
    if (filter?.keywords?.length) {
      const keywords = filter.keywords.map((keyword) => keyword.toLowerCase());
      result = result.filter((article) => {
        const text = `${article.title} ${article.summary}`.toLowerCase();
        return keywords.some((keyword) => text.includes(keyword));
      });
    }

    return result
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 100);
  }
}