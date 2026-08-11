import { Injectable, Logger, Optional } from '@nestjs/common';
import { BaseResearchProvider } from './base-research.provider';
import { CircuitBreakerService } from '../../market-data/circuit-breaker/circuit-breaker.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { ResearchArticle, ResearchFilter, ResearchImportance } from '../interfaces/research.types';
import { parseRssFeed, RssItem } from './rss-xml-parser';

function createId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return `google-news-${Math.abs(hash).toString(36)}`;
}

function parseDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function matchesFilter(item: RssItem, filter?: ResearchFilter): boolean {
  if (!filter) return true;
  const text = `${item.title} ${item.description}`.toLowerCase();

  if (filter.fromDate) {
    const from = new Date(filter.fromDate).getTime();
    if (!Number.isNaN(from) && new Date(item.pubDate).getTime() < from) return false;
  }
  if (filter.toDate) {
    const to = new Date(filter.toDate).getTime();
    if (!Number.isNaN(to) && new Date(item.pubDate).getTime() > to) return false;
  }
  if (filter.source && item.source && !item.source.toLowerCase().includes(filter.source.toLowerCase())) {
    return false;
  }
  if (filter.keywords && filter.keywords.length > 0) {
    const found = filter.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    if (!found) return false;
  }
  return true;
}

@Injectable()
export class GoogleNewsProvider extends BaseResearchProvider {
  readonly name = 'google-news';
  private readonly baseUrl: string;

  constructor(
    circuitBreaker: CircuitBreakerService,
    private readonly symbolRegistry: SymbolRegistryService,
    @Optional() config?: { baseUrl?: string; timeout?: number; retries?: number },
  ) {
    super('GoogleNewsProvider', circuitBreaker, config?.timeout, config?.retries);
    this.baseUrl = config?.baseUrl ?? 'https://news.google.com/rss/search';
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.buildUrl('BIST İstanbul', 1), {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchNews(filter?: ResearchFilter): Promise<ResearchArticle[]> {
    if (filter?.ticker) return this.fetchCompanyNews(filter.ticker, filter);
    if (filter?.company) return this.fetchCompanyNews(filter.company, filter);
    if (filter?.sector) return this.fetchSectorNews(filter.sector, filter);

    const query = this.buildKeywordQuery(filter?.keywords ?? []);
    const articles = await this.fetchRss(query, filter);
    return this.decorate(articles, filter);
  }

  async fetchCompanyNews(ticker: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const query = `"${companyName}" OR "${ticker}"`;
    const articles = await this.fetchRss(query, filter);
    const decorated = this.decorate(articles, filter, ticker);
    return decorated.map((article) => ({
      ...article,
      company: ticker,
      sector: this.symbolRegistry.getSector(ticker),
    }));
  }

  async fetchSectorNews(sector: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const query = `"${sector}" BIST`;
    const articles = await this.fetchRss(query, filter);
    return this.decorate(articles, filter, undefined, sector);
  }

  async fetchEconomicNews(filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const query = 'Türkiye ekonomi piyasalar';
    const articles = await this.fetchRss(query, filter);
    return this.decorate(articles, filter);
  }

  async fetchKAPAnnouncements(): Promise<ResearchArticle[]> {
    return [];
  }

  async fetchTCMBAnnouncements(): Promise<ResearchArticle[]> {
    return [];
  }

  private async fetchRss(query: string, filter?: ResearchFilter): Promise<RssItem[]> {
    const limit = filter?.keywords?.length ? 20 : 10;
    const result = await this.withRetry(async () => {
      const response = await fetch(this.buildUrl(query, limit), {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      return parseRssFeed(xml).items;
    }, `fetchRss(${query.slice(0, 60)})`);

    if (!result) return [];
    return result.filter((item) => matchesFilter(item, filter));
  }

  private buildUrl(query: string, limit: number): string {
    const params = new URLSearchParams({
      q: query,
      hl: 'tr',
      gl: 'TR',
      ceid: 'TR:tr',
      num: String(Math.max(1, limit)),
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  private buildKeywordQuery(keywords: string[]): string {
    if (!keywords || keywords.length === 0) return 'BIST İstanbul borsa';
    return keywords.map((keyword) => `"${keyword}"`).join(' OR ');
  }

  private decorate(
    items: RssItem[],
    filter?: ResearchFilter,
    company?: string,
    sector?: string,
  ): ResearchArticle[] {
    return items.map((item) => {
      const publishedAt = parseDate(item.pubDate);
      const importance = this.inferImportance(item.title);

      return {
        id: createId(item.link),
        source: item.source ?? 'Google News',
        provider: this.name,
        title: item.title,
        summary: item.description || item.title,
        publishedAt,
        url: item.link,
        company,
        sector,
        country: 'TR',
        language: filter?.language ?? 'tr',
        importance,
        tags: ['news'],
      };
    });
  }

  private inferImportance(title: string): ResearchImportance {
    const lower = title.toLowerCase();
    const critical = ['kayyum', 'iflas', 'satış durduruldu', 'ortaklıktan çıkarma'];
    const high = ['sermaye artırımı', 'temettü', 'kâr', 'kar açıklaması', 'rekor', 'birleşme', 'devralma'];
    if (critical.some((word) => lower.includes(word))) return ResearchImportance.CRITICAL;
    if (high.some((word) => lower.includes(word))) return ResearchImportance.HIGH;
    return ResearchImportance.MEDIUM;
  }
}
