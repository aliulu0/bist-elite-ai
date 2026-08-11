import { Injectable, Optional } from '@nestjs/common';
import { BaseResearchProvider } from './base-research.provider';
import { CircuitBreakerService } from '../../market-data/circuit-breaker/circuit-breaker.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { ResearchArticle, ResearchFilter, ResearchImportance } from '../interfaces/research.types';
import {
  AgentReachSource,
  AgentReachSearchResult,
  CompanyResearchResult,
  DiscoveredPDF,
  DiscoveredRSS,
  PDFType,
  SourceClassification,
  SourceCategory,
} from '../interfaces/agent-reach.types';
import { SerpApiResponse, SerpSearchResultItem, SerpNewsResult } from './serp-api.research-provider';
import { normalizeTurkish } from '../turkish-text.util';

@Injectable()
export class AgentReachProvider extends BaseResearchProvider {
  readonly name = 'agent-reach';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly searchEngine: string;
  private readonly financeEngine: string;
  private quotaUsed = 0;

  constructor(
    circuitBreaker: CircuitBreakerService,
    private readonly symbolRegistry: SymbolRegistryService,
    @Optional() config?: { apiKey?: string; baseUrl?: string; searchEngine?: string; financeEngine?: string; timeout?: number; retries?: number },
  ) {
    super('AgentReachProvider', circuitBreaker, config?.timeout, config?.retries);
    this.apiKey = config?.apiKey ?? process.env.SERPAPI_API_KEY ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.SERPAPI_BASE_URL ?? 'https://serpapi.com/search.json';
    this.searchEngine = config?.searchEngine ?? process.env.SERPAPI_SEARCH_ENGINE ?? 'google';
    this.financeEngine = config?.financeEngine ?? process.env.SERPAPI_FINANCE_ENGINE ?? 'google_finance';
    this.connected = !!this.apiKey;
  }

  async validateConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const json = await this.searchRaw({ engine: this.searchEngine, q: 'BIST İstanbul', num: '1' });
      return json !== null && !json.error && json.search_metadata?.status === 'Success';
    } catch {
      return false;
    }
  }

  getQuota(): { used: number; limit: number | null } | null {
    return null;
  }

  async searchCompany(ticker: string, filter?: ResearchFilter): Promise<AgentReachSearchResult> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const query = filter?.keywords?.length ? filter.keywords.join(' ') : `"${companyName}" ${ticker} BIST`;
    const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toSearchResult(query, 'google_search', json);
  }

  async searchSector(sector: string, filter?: ResearchFilter): Promise<AgentReachSearchResult> {
    const query = filter?.keywords?.length ? filter.keywords.join(' ') : `"${sector}" BIST sektör`;
    const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toSearchResult(query, 'google_search', json);
  }

  async searchMarket(): Promise<AgentReachSearchResult> {
    const query = 'BIST borsa İstanbul piyasa güncel gelişmeler';
    const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toSearchResult(query, 'google_search', json);
  }

  async searchKeyword(keyword: string): Promise<AgentReachSearchResult> {
    const json = await this.searchRaw({ engine: this.searchEngine, q: keyword, num: '10', hl: 'tr', gl: 'tr' });
    return this.toSearchResult(keyword, 'google_search', json);
  }

  async searchCompanyWebsite(ticker: string): Promise<string | null> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const json = await this.searchRaw({ engine: this.searchEngine, q: `${companyName} ${ticker} resmi web sitesi`, num: '5', hl: 'tr', gl: 'tr' });
    if (!json?.organic_results?.length) return null;
    const link = json.organic_results[0].link;
    return link ?? null;
  }

  async searchInvestorRelations(ticker: string): Promise<string | null> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const json = await this.searchRaw({ engine: this.searchEngine, q: `${companyName} ${ticker} yatırımcı ilişkileri`, num: '5', hl: 'tr', gl: 'tr' });
    if (!json?.organic_results?.length) return null;
    const link = json.organic_results[0].link;
    return link ?? null;
  }

  async searchPDFs(ticker: string, types: PDFType[] = ['annual-report', 'quarterly-report', 'investor-presentation', 'sustainability-report']): Promise<DiscoveredPDF[]> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const typeLabels: Record<PDFType, string> = {
      'annual-report': 'yıllık rapor',
      'quarterly-report': 'çeyrek rapor',
      'investor-presentation': 'yatırımcı sunumu',
      'sustainability-report': 'sürdürülebilirlik raporu',
      'governance-report': 'yönetim kurulu raporu',
      'esg-report': 'ESG raporu',
      'other': 'diğer',
    };
    const pdfs: DiscoveredPDF[] = [];

    for (const type of types) {
      const label = typeLabels[type];
      const json = await this.searchRaw({
        engine: this.searchEngine,
        q: `${companyName} ${ticker} ${label} filetype:pdf`,
        num: '5',
        hl: 'tr',
        gl: 'tr',
      });
      if (!json?.organic_results?.length) continue;

      for (const result of json.organic_results) {
        if (!result.link?.toLowerCase().endsWith('.pdf')) continue;
        const pdf: DiscoveredPDF = {
          id: `pdf-${ticker}-${type}-${this.hashId(result.link)}`,
          url: result.link,
          fileName: result.title ?? `${companyName} ${label}`,
          date: result.date ?? new Date().toISOString(),
          type,
          company: ticker,
          discoveredAt: new Date().toISOString(),
          source: 'serpapi',
          classification: this.classifySource(result.link, result.title ?? ''),
        };
        pdfs.push(pdf);
      }
    }
    return pdfs;
  }

  async searchRSS(ticker: string): Promise<DiscoveredRSS[]> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const rssFeeds: DiscoveredRSS[] = [];

    const companyRss = await this.searchRaw({
      engine: this.searchEngine,
      q: `${companyName} ${ticker} rss feed`,
      num: '5',
      hl: 'tr',
      gl: 'tr',
    });
    if (companyRss?.organic_results?.length) {
      for (const result of companyRss.organic_results) {
        if (this.isRSSLink(result.link ?? '')) {
          rssFeeds.push({
            id: `rss-${ticker}-company-${this.hashId(result.link ?? '')}`,
            url: result.link ?? '',
            category: 'company',
            company: ticker,
            discoveredAt: new Date().toISOString(),
            source: 'serpapi',
            classification: 'Company',
            isOfficial: true,
          });
        }
      }
    }

    const sectorRss = await this.searchRaw({
      engine: this.searchEngine,
      q: `BIST ${ticker} sektör rss`,
      num: '5',
      hl: 'tr',
      gl: 'tr',
    });
    if (sectorRss?.organic_results?.length) {
      for (const result of sectorRss.organic_results) {
        if (this.isRSSLink(result.link ?? '')) {
          rssFeeds.push({
            id: `rss-${ticker}-sector-${this.hashId(result.link ?? '')}`,
            url: result.link ?? '',
            category: 'sector',
            company: ticker,
            discoveredAt: new Date().toISOString(),
            source: 'serpapi',
            classification: 'News',
            isOfficial: false,
          });
        }
      }
    }

    return rssFeeds;
  }

  async searchPressReleases(ticker: string): Promise<AgentReachSource[]> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const json = await this.searchRaw({
      engine: this.searchEngine,
      q: `${companyName} ${ticker} basın açıklaması`,
      num: '10',
      hl: 'tr',
      gl: 'tr',
    });
    return this.toSources(json, 'press-release', ticker);
  }

  async searchNews(ticker: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
    const query = filter?.keywords?.length ? filter.keywords.join(' ') : `"${companyName}" ${ticker} haber`;
    const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toArticles(json, ticker, this.symbolRegistry.getSector(ticker));
  }

  async searchESG(ticker: string): Promise<DiscoveredPDF[]> {
    return this.searchPDFs(ticker, ['esg-report', 'sustainability-report']);
  }

  async searchGovernance(ticker: string): Promise<DiscoveredPDF[]> {
    return this.searchPDFs(ticker, ['governance-report']);
  }

  async fetchNews(filter?: ResearchFilter): Promise<ResearchArticle[]> {
    if (filter?.ticker) return this.searchNews(filter.ticker, filter);
    if (filter?.company) return this.searchNews(filter.company, filter);
    const json = await this.searchRaw({ engine: this.searchEngine, q: 'BIST İstanbul haber', num: '10', hl: 'tr', gl: 'tr' });
    return this.toArticles(json);
  }

  async fetchCompanyNews(ticker: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    return this.searchNews(ticker, filter);
  }

  async fetchSectorNews(sector: string, filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const json = await this.searchRaw({ engine: this.searchEngine, q: `"${sector}" BIST`, num: '10', hl: 'tr', gl: 'tr' });
    return this.toArticles(json, undefined, sector);
  }

  async fetchEconomicNews(filter?: ResearchFilter): Promise<ResearchArticle[]> {
    const query = filter?.keywords?.length ? filter.keywords.join(' ') : 'Türkiye ekonomi piyasalar';
    const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
    return this.toArticles(json);
  }

  async fetchKAPAnnouncements(): Promise<ResearchArticle[]> {
    return [];
  }

  async fetchTCMBAnnouncements(): Promise<ResearchArticle[]> {
    return [];
  }

  async getCompanyResearch(ticker: string): Promise<CompanyResearchResult> {
    const clean = ticker.trim().toUpperCase();
    const companyName = this.symbolRegistry.getCompanyName(clean) ?? clean;
    const sector = this.symbolRegistry.getSector(clean) ?? '';

    const [website, irUrl, pdfs, rssFeeds, pressReleases, newsSources] = await Promise.all([
      this.searchCompanyWebsite(clean),
      this.searchInvestorRelations(clean),
      this.searchPDFs(clean),
      this.searchRSS(clean),
      this.searchPressReleases(clean),
      this.searchNews(clean),
    ]);

    const sources = [
      ...newsSources.map((a) => ({
        id: `src-${clean}-${this.hashId(a.url)}`,
        url: a.url,
        title: a.title,
        classification: this.classifySource(a.url, a.title),
        category: 'news' as SourceCategory,
        company: clean,
        sector,
        discoveredAt: new Date().toISOString(),
        isOfficial: false,
        isActive: true,
        reliabilityScore: 0.7,
      })),
      ...pressReleases.map((a) => ({
        id: `pr-${clean}-${this.hashId(a.url)}`,
        url: a.url,
        title: a.title,
        classification: this.classifySource(a.url, a.title),
        category: 'press-release' as SourceCategory,
        company: clean,
        sector,
        discoveredAt: new Date().toISOString(),
        isOfficial: true,
        isActive: true,
        reliabilityScore: 0.9,
      })),
    ];

    const annualReports = pdfs.filter((p) => p.type === 'annual-report');
    const quarterlyReports = pdfs.filter((p) => p.type === 'quarterly-report');
    const investorPresentations = pdfs.filter((p) => p.type === 'investor-presentation');
    const sustainabilityReports = pdfs.filter((p) => p.type === 'sustainability-report');
    const governanceDocuments = pdfs.filter((p) => p.type === 'governance-report');
    const esgReports = pdfs.filter((p) => p.type === 'esg-report');

    const officialCount = sources.filter((s) => s.isOfficial).length + annualReports.length + quarterlyReports.length + governanceDocuments.length + esgReports.length;

    const result: CompanyResearchResult = {
      ticker: clean,
      companyName,
      sector,
      officialWebsite: website,
      investorRelationsUrl: irUrl,
      annualReports,
      quarterlyReports,
      investorPresentations,
      sustainabilityReports,
      governanceDocuments,
      esgReports,
      pressReleases,
      newsUrls: sources.filter((s) => s.category === 'news'),
      rssUrls: rssFeeds,
      sources,
      evidenceCount: sources.length + pdfs.length + rssFeeds.length,
      officialCount,
      discoveredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    return result;
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
    }, `agent-reach(${params.engine ?? 'google'})`);
    return result;
  }

  private toSearchResult(query: string, engine: string, json: SerpApiResponse | null): AgentReachSearchResult {
    const organic = Array.isArray(json?.organic_results) ? json!.organic_results : [];
    const finance = Array.isArray(json?.finance_results) ? json!.finance_results : [];
    const sources: AgentReachSource[] = [
      ...organic.map((item: SerpSearchResultItem) => ({
        id: `reach-${this.hashId(item.link ?? item.title ?? '')}`,
        url: item.link ?? '',
        title: item.title ?? '',
        classification: this.classifySource(item.link ?? '', item.title ?? ''),
        category: 'news' as SourceCategory,
        discoveredAt: new Date().toISOString(),
        isOfficial: false,
        isActive: true,
        reliabilityScore: 0.6,
      })),
      ...finance.map((item: SerpSearchResultItem) => ({
        id: `reach-fin-${this.hashId(item.link ?? '')}`,
        url: item.link ?? '',
        title: item.title ?? '',
        classification: this.classifySource(item.link ?? '', item.title ?? ''),
        category: 'news' as SourceCategory,
        discoveredAt: new Date().toISOString(),
        isOfficial: false,
        isActive: true,
        reliabilityScore: 0.7,
      })),
    ];
    return {
      query,
      engine,
      results: sources,
      totalResults: sources.length,
      searchTime: json?.search_metadata?.total_time_taken ?? 0,
      discoveredAt: new Date().toISOString(),
    };
  }

  private toSources(json: SerpApiResponse | null, category: SourceCategory, ticker?: string): AgentReachSource[] {
    if (!json) return [];
    const organic = Array.isArray(json.organic_results) ? json.organic_results : [];
    return organic
      .filter((item: SerpSearchResultItem) => item.title && item.link)
      .map((item: SerpSearchResultItem) => ({
        id: `src-${ticker ?? 'unknown'}-${this.hashId(item.link ?? '')}`,
        url: item.link ?? '',
        title: item.title ?? '',
        classification: this.classifySource(item.link ?? '', item.title ?? ''),
        category,
        company: ticker,
        discoveredAt: new Date().toISOString(),
        isOfficial: category === 'press-release',
        isActive: true,
        reliabilityScore: category === 'press-release' ? 0.9 : 0.6,
      }));
  }

  private toArticles(json: SerpApiResponse | null, ticker?: string, sector?: string): ResearchArticle[] {
    if (!json) return [];
    const organic = Array.isArray(json.organic_results) ? json.organic_results : [];
    const news = Array.isArray(json.news_results) ? json.news_results : [];
    const items = [
      ...organic.map((item: SerpSearchResultItem) => ({ title: item.title, link: item.link, snippet: item.snippet, date: item.date })),
      ...news.map((item: SerpNewsResult) => ({ title: item.title, link: item.link, snippet: item.snippet, date: item.date })),
    ];
    return items
      .filter((item: SerpSearchResultItem) => item.title)
      .slice(0, 20)
      .map((item: SerpSearchResultItem) => ({
        id: `reach-${this.hashId(item.link ?? item.title ?? '')}`,
        source: this.extractSource(item.link),
        provider: this.name,
        title: item.title ?? '',
        summary: (item.snippet ?? item.title ?? ''),
        publishedAt: this.parseDate(item.date) ?? new Date().toISOString(),
        url: item.link ?? '',
        company: ticker,
        sector,
        country: 'TR',
        language: 'tr',
        importance: this.inferImportance(item.title ?? ''),
        tags: ['agent-reach', 'research'],
      }));
  }

  private classifySource(url: string, title: string): SourceClassification {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const combined = `${lowerUrl} ${lowerTitle}`;

    if (combined.includes('gov.tr') || combined.includes('government') || combined.includes('resmi')) return 'Government';
    if (combined.includes('bist.com.tr') || combined.includes('borsa') || combined.includes('exchange')) return 'Exchange';
    if (combined.includes('kap.org.tr') || combined.includes('kayyum')) return 'Official';
    if (combined.includes('rss') || combined.includes('feed')) return 'News';
    if (combined.includes('research') || combined.includes('analiz') || combined.includes('rapor')) return 'Research';
    if (combined.includes('investor') || combined.includes('yatırımcı') || combined.includes('ir')) return 'Company';
    if (combined.includes('news') || combined.includes('haber') || combined.includes('gazete')) return 'News';
    return 'Unknown';
  }

  private isRSSLink(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('rss') || lower.includes('feed') || lower.endsWith('.xml') || lower.includes('atom');
  }

  private parseDate(value?: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  private extractSource(url?: string): string {
    if (!url) return 'Google';
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return 'Google';
    }
  }

  private inferImportance(title: string): ResearchImportance {
    const lower = normalizeTurkish(title);
    const critical = ['kayyum', 'iflas', 'satış durduruldu', 'soruşturma', 'spk ceza'];
    const high = ['sermaye artışırım', 'temettü', 'kar payı', 'birleşme', 'devralma', 'ihale', 'rekor', 'satın alma'];
    if (critical.some((word) => lower.includes(word))) return ResearchImportance.CRITICAL;
    if (high.some((word) => lower.includes(word))) return ResearchImportance.HIGH;
    return ResearchImportance.MEDIUM;
  }

  private hashId(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}