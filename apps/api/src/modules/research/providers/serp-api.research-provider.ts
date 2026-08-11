import { Injectable, Optional } from '@nestjs/common';
import { BaseResearchProvider } from './base-research.provider';
import { CircuitBreakerService } from '../../market-data/circuit-breaker/circuit-breaker.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { ResearchArticle, ResearchFilter, ResearchImportance } from '../interfaces/research.types';
import {
  AiResearchSummary,
  AiSource,
  GoogleFinanceCompany,
  GoogleFinanceHighlight,
  GoogleFinanceKnowledgeGraph,
  GoogleFinanceRelatedCompany,
  ResearchEngine,
  SerpSearchResults,
} from '../interfaces/research-intelligence.types';
import { normalizeTurkish } from '../turkish-text.util';

export interface SerpApiConfig {
  apiKey?: string;
  baseUrl?: string;
  searchEngine?: string;
  financeEngine?: string;
  newsEngine?: string;
  aiModeEngine?: string;
  timeout?: number;
  retries?: number;
  planLimit?: number;
}

export interface SerpSearchResultItem {
  position?: number;
  title?: string;
  link?: string;
  url?: string;
  displayedLink?: string;
  snippet?: string;
  source?: string;
  date?: string;
}

export interface SerpNewsResult {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  source?: { name?: string };
}

export interface SerpApiResponse {
  search_metadata?: { status?: string; total_time_taken?: number; engine?: string; id?: string };
  search_information?: { total_results?: number | string };
  organic_results?: SerpSearchResultItem[];
  knowledge_graph?: { title?: string; description?: string; url?: string };
  related_companies?: Array<{ title?: string; symbol?: string; link?: string }>;
  key_financial_highlights?: Array<{ label?: string; value?: string }>;
  news_results?: SerpNewsResult[];
  finance_results?: SerpSearchResultItem[];
  answer?: string;
  ai_mode?: { answer?: string; sources?: Array<{ title?: string; link?: string; source?: string }> };
  sources?: Array<{ title?: string; link?: string; source?: string }>;
  error?: string;
  error_message?: string;
}

function createId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return `serp-${Math.abs(hash).toString(36)}`;
}

function parseDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function inferImportance(title: string): ResearchImportance {
  const lower = normalizeTurkish(title);
  const critical = ['kayyum', 'iflas', 'satış durduruldu', 'soruşturma', 'spk ceza'];
  const high = ['sermaye artırımı', 'temettü', 'kar payı', 'birleşme', 'devralma', 'ihale', 'rekor', 'satın alma'];
  if (critical.some((word) => lower.includes(word))) return ResearchImportance.CRITICAL;
  if (high.some((word) => lower.includes(word))) return ResearchImportance.HIGH;
  return ResearchImportance.MEDIUM;
}

@Injectable()
export class SerpApiResearchProvider extends BaseResearchProvider {
  readonly name = 'serp-api';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly searchEngine: string;
  private readonly financeEngine: string;
  private readonly newsEngine: string;
  private readonly aiModeEngine: string;
  private readonly planLimit: number | null;
  private quotaUsed = 0;

  constructor(
    circuitBreaker: CircuitBreakerService,
    private readonly symbolRegistry: SymbolRegistryService,
    @Optional() config?: SerpApiConfig,
  ) {
    super('SerpApiResearchProvider', circuitBreaker, config?.timeout, config?.retries);
    this.apiKey = config?.apiKey ?? process.env.SERPAPI_API_KEY ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.SERPAPI_BASE_URL ?? 'https://serpapi.com/search.json';
    this.searchEngine = config?.searchEngine ?? process.env.SERPAPI_SEARCH_ENGINE ?? 'google';
    this.financeEngine = config?.financeEngine ?? process.env.SERPAPI_FINANCE_ENGINE ?? 'google_finance';
    this.newsEngine = config?.newsEngine ?? process.env.SERPAPI_NEWS_ENGINE ?? 'google_news';
    this.aiModeEngine = config?.aiModeEngine ?? process.env.SERPAPI_AI_MODE_ENGINE ?? 'google_ai_mode';
    const limit = config?.planLimit ?? (process.env.SERPAPI_PLAN_LIMIT ? parseInt(process.env.SERPAPI_PLAN_LIMIT, 10) : null);
    this.planLimit = typeof limit === 'number' && Number.isFinite(limit) ? limit : null;
    this.connected = !!this.apiKey;
  }

  async validateConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    const json = await this.searchRaw({ engine: this.searchEngine, q: 'BIST İstanbul', num: '1' });
    return json !== null && !json.error && json.search_metadata?.status === 'Success';
  }

  getEngine(): ResearchEngine {
    return 'google_search';
  }

  getQuota(): { used: number; limit: number | null } | null {
    if (this.planLimit === null && this.quotaUsed === 0) return null;
    return { used: this.quotaUsed, limit: this.planLimit };
  }

  async searchCompany(ticker: string, filter?: ResearchFilter): Promise<SerpSearchResults> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const query = filter?.keywords?.length ? filter.keywords.join(' ') : `"${companyName}" ${ticker} BIST`;
    const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toSearchResults(query, 'google_search', json);
  }

  async searchSector(sector: string, filter?: ResearchFilter): Promise<SerpSearchResults> {
    const query = filter?.keywords?.length ? filter.keywords.join(' ') : `"${sector}" BIST sektör`;
    const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toSearchResults(query, 'google_search', json);
  }

  async searchMarket(): Promise<SerpSearchResults> {
    const query = 'BIST borsa İstanbul piyasa güncel gelişmeler';
    const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toSearchResults(query, 'google_search', json);
  }

  async searchKeyword(keyword: string): Promise<SerpSearchResults> {
    const json = await this.searchRaw({ engine: this.searchEngine, q: keyword, num: '10', hl: 'tr', gl: 'tr' });
    return this.toSearchResults(keyword, 'google_search', json);
  }

  async searchFinancial(ticker: string): Promise<GoogleFinanceCompany | null> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const json = await this.searchRaw({ engine: this.financeEngine, q: `${companyName} ${ticker}`, hl: 'tr', gl: 'tr' });
    if (json) {
      const company = this.toGoogleFinance(ticker, json);
      if (company) return company;
    }
    // google_finance returns no results for this account/tier (verified: empty for every ticker incl. AAPL).
    // Fall back to google search so callers still receive a company card with organic + news data.
    const fallback = await this.searchRaw({ engine: this.searchEngine, q: `${companyName} ${ticker}`, num: '10', hl: 'tr', gl: 'tr' });
    if (!fallback) return null;
    return this.toGoogleFinance(ticker, fallback);
  }

  async searchNews(ticker: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const query = filter?.keywords?.length ? filter.keywords.join(' ') : `"${companyName}" ${ticker} haber`;
    const json = await this.searchRaw({ engine: this.newsEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toArticles(json, ticker, this.symbolRegistry.getSector(ticker));
  }

  async searchAiMode(query: string): Promise<AiResearchSummary | null> {
    if (!this.apiKey) return null;
    const json = await this.searchRaw({ engine: this.aiModeEngine, q: query, hl: 'tr', gl: 'tr' });
    if (!json) return null;
    return this.toAiSummary(query, json);
  }

  async fetchNews(filter?: ResearchFilter): Promise<ResearchArticle[]> {
    if (filter?.ticker) return this.searchNews(filter.ticker, filter);
    if (filter?.company) return this.searchNews(filter.company, filter);
    const json = await this.searchRaw({ engine: this.newsEngine, q: 'BIST İstanbul haber', num: '10', hl: 'tr', gl: 'tr' });
    return this.toArticles(json);
  }

  async fetchCompanyNews(ticker: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    return this.searchNews(ticker, filter);
  }

  async fetchSectorNews(sector: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const json = await this.searchRaw({ engine: this.newsEngine, q: `"${sector}" BIST`, num: '10', hl: 'tr', gl: 'tr' });
    return this.toArticles(json, undefined, sector);
  }

  async fetchEconomicNews(filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const query = filter?.keywords?.length ? filter.keywords.join(' ') : 'Türkiye ekonomi piyasalar';
    const json = await this.searchRaw({ engine: this.newsEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toArticles(json);
  }

  async fetchKAPAnnouncements(): Promise<ResearchArticle[]> {
    return [];
  }

  async fetchTCMBAnnouncements(): Promise<ResearchArticle[]> {
    return [];
  }

  private async searchRaw(params: Record<string, string>): Promise<SerpApiResponse | null> {
    if (!this.apiKey) {
      this.logger.warn('SERPAPI_API_KEY not configured, skipping search');
      return null;
    }
    const result = await this.withRetry(async () => {
      const query = new URLSearchParams({ api_key: this.apiKey, ...params });
      const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = (await response.json()) as SerpApiResponse;
      this.quotaUsed++;
      if (json.error || json.error_message) {
        throw new Error(json.error_message || json.error || 'SerpAPI error');
      }
      return json;
    }, `search(${params.engine ?? 'google'})`);
    return result;
  }

  private toSearchResults(query: string, engine: ResearchEngine, json: SerpApiResponse | null): SerpSearchResults {
    const organic = Array.isArray(json?.organic_results) ? json!.organic_results : [];
    const finance = Array.isArray(json?.finance_results) ? json!.finance_results : [];
    const merged = [...organic, ...finance];
    return {
      query,
      engine,
      results: merged,
      totalResults: this.parseTotalResults(json?.search_information?.total_results),
      searchTime: json?.search_metadata?.total_time_taken,
    };
  }

  private toArticles(json: SerpApiResponse | null, ticker?: string, sector?: string): ResearchArticle[] {
    if (!json) return [];
    const organic = Array.isArray(json.organic_results) ? json.organic_results : [];
    const news = Array.isArray(json.news_results) ? json.news_results : [];
    const items = [
      ...organic.map((item) => ({ title: item.title, link: item.link, snippet: item.snippet, date: item.date })),
      ...news.map((item) => ({ title: item.title, link: item.link, snippet: item.snippet, date: item.date })),
    ];

    return items
      .filter((item) => item.title)
      .slice(0, 20)
      .map((item) => ({
        id: createId(item.link ?? item.title!),
        source: this.extractSource(item.link),
        provider: this.name,
        title: item.title!,
        summary: item.snippet || item.title!,
        publishedAt: parseDate(item.date) ?? new Date().toISOString(),
        url: item.link ?? '',
        company: ticker,
        sector,
        country: 'TR',
        language: 'tr',
        importance: inferImportance(item.title!),
        tags: ['search'],
      }));
  }

  private toGoogleFinance(ticker: string, json: SerpApiResponse): GoogleFinanceCompany | null {
    const name =
      json.knowledge_graph?.title ||
      json.organic_results?.[0]?.title ||
      json.organic_results?.[0]?.source ||
      undefined;
    if (!name && !json.knowledge_graph && !json.organic_results?.length && !json.related_companies?.length) {
      return null;
    }

    const relatedCompanies: GoogleFinanceRelatedCompany[] = (json.related_companies ?? [])
      .map((item) => ({ name: item.title ?? '', ticker: item.symbol }))
      .filter((item) => item.name);

    const knowledgeGraph: GoogleFinanceKnowledgeGraph | undefined =
      json.knowledge_graph?.title || json.knowledge_graph?.description
        ? { title: json.knowledge_graph.title, description: json.knowledge_graph.description, url: json.knowledge_graph.url }
        : undefined;

    const financialHighlights: GoogleFinanceHighlight[] = (json.key_financial_highlights ?? [])
      .map((item) => ({ label: item.label ?? '', value: item.value ?? '' }))
      .filter((item) => item.label);

    const recentNews: ResearchArticle[] = (json.news_results ?? [])
      .filter((item) => item.title)
      .slice(0, 10)
      .map((item) => ({
        id: createId(item.link ?? item.title!),
        source: item.source?.name ?? this.extractSource(item.link),
        provider: this.name,
        title: item.title!,
        summary: item.snippet || item.title!,
        publishedAt: parseDate(item.date) ?? new Date().toISOString(),
        url: item.link ?? '',
        company: ticker,
        sector: this.symbolRegistry.getSector(ticker),
        country: 'TR',
        language: 'tr',
        importance: inferImportance(item.title!),
        tags: ['finance-news'],
      }));

    const marketSummary: SerpSearchResultItem[] = (json.finance_results ?? []).slice(0, 10);

    return {
      ticker,
      name,
      exchange: undefined,
      price: undefined,
      currency: undefined,
      marketCap: undefined,
      peRatio: undefined,
      summary: knowledgeGraph?.description ?? json.organic_results?.[0]?.snippet,
      recentNews,
      relatedCompanies,
      knowledgeGraph,
      marketSummary,
      financialHighlights,
    };
  }

  private toAiSummary(query: string, json: SerpApiResponse): AiResearchSummary | null {
    const ai = json.ai_mode ?? {};
    const answer = ai.answer || json.answer || json.organic_results?.[0]?.snippet;
    if (!answer) return null;

    const rawSources = ai.sources?.length ? ai.sources : json.sources?.length ? json.sources : json.organic_results ?? [];
    const sources: AiSource[] = rawSources
      .map((item) => ({
        title: item.title ?? item.source ?? 'Source',
        url: (item.link ?? '') as string,
        source: item.source ?? this.extractSource(item.link),
      }))
      .filter((item) => item.url);

    return {
      summary: answer,
      sources,
      citations: sources.map((item) => ({ title: item.title, url: item.url })),
      confidence: answer && sources.length > 0 ? 0.9 : 0.6,
      generatedAt: new Date().toISOString(),
      engine: 'google_ai_mode',
    };
  }

  private extractSource(url?: string): string {
    if (!url) return 'Google';
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return 'Google';
    }
  }

  private parseTotalResults(value?: number | string): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numeric = value.replace(/[^0-9]/g, '');
      if (numeric) return parseInt(numeric, 10);
    }
    return undefined;
  }
}
