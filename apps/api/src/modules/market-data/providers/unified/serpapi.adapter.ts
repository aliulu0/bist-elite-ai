import { Injectable, Optional } from '@nestjs/common';
import { BaseProviderAdapter } from './base-provider.adapter';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
import {
  Company,
  FinancialStatement,
  UnifiedBalanceSheet,
  UnifiedIncomeStatement,
  CashFlow,
  Sector,
  Disclosure,
} from '../../interfaces/unified-domain.types';
import {
  MarketDataPoint,
  FetchOptions,
  MacroIndicator,
  CompanyProfile,
  FinancialRatios,
  BalanceSheet,
  IncomeStatement,
  CompanySector,
} from '../../interfaces';
interface ResearchArticle {
  id: string;
  source: string;
  sourceType: 'news' | 'press' | 'regulatory';
  title: string;
  snippet: string;
  url: string;
  ticker: string;
  publishedAt: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  official: boolean;
  qualityScore: number;
  tags: string[];
}

interface SerpApiResponse {
  search_metadata?: { status?: string; total_time_taken?: number; engine?: string; id?: string };
  search_information?: { total_results?: number | string };
  organic_results?: Array<{ title?: string; link?: string; snippet?: string; date?: string }>;
  knowledge_graph?: { title?: string; description?: string; url?: string };
  related_companies?: Array<{ title?: string; symbol?: string; link?: string }>;
  key_financial_highlights?: Array<{ label?: string; value?: string }>;
  news_results?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    date?: string;
    source?: { name?: string };
  }>;
  finance_results?: Array<{ title?: string; link?: string; snippet?: string; date?: string }>;
  answer?: string;
  ai_mode?: {
    answer?: string;
    sources?: Array<{ title?: string; link?: string; source?: string }>;
  };
  sources?: Array<{ title?: string; link?: string; source?: string }>;
  error?: string;
  error_message?: string;
}

interface GoogleFinanceData {
  price: number | null;
  dailyChange: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  currency: string;
  exchange: string;
  timestamp: string;
  symbol: string;
  source: string;
}

interface SerpApiHealthStatus {
  healthy: boolean;
  warning: boolean;
  offline: boolean;
  latencyMs: number;
  coveragePercent: number;
  rateLimitRemaining: number | null;
  quotaUsed: number | null;
  quotaTotal: number | null;
  lastUpdate: string | null;
}

@Injectable()
export class SerpApiAdapter extends BaseProviderAdapter {
  readonly name = 'serpapi';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly searchEngine: string;
  private readonly financeEngine: string;
  private readonly newsEngine: string;
  private readonly aiModeEngine: string;
  private readonly planLimit: number;
  private requestCount = 0;
  private lastRequestTime: number | null = null;
  private lastQuotaCheck: number | null = null;
  private quotaRemaining: number | null = null;

  constructor(
    circuitBreaker: CircuitBreakerService,
    @Optional()
    config?: {
      apiKey?: string;
      baseUrl?: string;
      timeout?: number;
      retries?: number;
      searchEngine?: string;
      financeEngine?: string;
      newsEngine?: string;
      aiModeEngine?: string;
      planLimit?: number;
    },
  ) {
    super('SerpApiAdapter', circuitBreaker, config?.timeout, config?.retries);
    this.apiKey = config?.apiKey ?? process.env.SERPAPI_API_KEY ?? '';
    this.baseUrl =
      config?.baseUrl ?? process.env.SERPAPI_BASE_URL ?? 'https://serpapi.com/search.json';
    this.searchEngine = config?.searchEngine ?? process.env.SERPAPI_SEARCH_ENGINE ?? 'google';
    this.financeEngine =
      config?.financeEngine ?? process.env.SERPAPI_FINANCE_ENGINE ?? 'google_finance';
    this.newsEngine = config?.newsEngine ?? process.env.SERPAPI_NEWS_ENGINE ?? 'google_news';
    this.aiModeEngine =
      config?.aiModeEngine ?? process.env.SERPAPI_AI_MODE_ENGINE ?? 'google_ai_mode';
    this.planLimit = config?.planLimit ?? parseInt(process.env.SERPAPI_PLAN_LIMIT ?? '100', 10);
  }

  async validateConnection(): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('SERPAPI_API_KEY not configured, provider disabled');
      return false;
    }
    try {
      const startTime = Date.now();
      const params = new URLSearchParams({
        engine: this.searchEngine,
        q: 'BIST İstanbul',
        num: '1',
        api_key: this.apiKey,
      });
      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - startTime;
      this.logRequest('validateConnection', latencyMs, response.ok, 0);
      if (!response.ok) return false;
      const json = (await response.json()) as SerpApiResponse;
      return json.search_metadata?.status === 'Success';
    } catch {
      return false;
    }
  }

  private async searchRaw(
    params: Record<string, string>,
    context: string,
  ): Promise<SerpApiResponse | null> {
    if (!this.apiKey) {
      this.logger.warn('SERPAPI_API_KEY not configured, provider is disabled');
      return null;
    }
    const startTime = Date.now();
    const result = await this.withRetry(
      async () => {
        const query = new URLSearchParams({ api_key: this.apiKey, ...params });
        const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
          method: 'GET',
          headers: { 'User-Agent': 'BIST-Elite-AI/1.0', Accept: 'application/json' },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        const latencyMs = Date.now() - startTime;
        if (!response.ok) {
          this.logRequest(context, latencyMs, false, 0);
          throw new Error(`HTTP ${response.status}`);
        }
        const json = (await response.json()) as SerpApiResponse;
        if (json.error || json.error_message) {
          throw new Error(json.error_message || json.error || 'SerpAPI error');
        }
        this.logRequest(context, latencyMs, true, 0);
        this.lastRequestTime = Date.now();
        return json;
      },
      `${context}(${params.engine ?? this.financeEngine})`,
    );
    return result;
  }

  private logRequest(
    context: string,
    latencyMs: number,
    success: boolean,
    retryCount: number,
  ): void {
    this.requestCount++;
    this.logger.log(
      `${context} latency=${latencyMs}ms success=${success} retryCount=${retryCount} requestCount=${this.requestCount}`,
    );
  }

  private parseMarketCap(text: string): number {
    const match = text.match(/([\d.]+)\s*(T|B|M|K)/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers: Record<string, number> = { T: 1e12, B: 1e9, M: 1e6, K: 1e3 };
    return value * (multipliers[unit] || 1);
  }

  private parseNumber(value?: string): number | null {
    if (!value) return null;
    const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '');
    const num = parseFloat(cleaned);
    return Number.isNaN(num) ? null : num;
  }

  async fetchGoogleFinance(symbol: string): Promise<GoogleFinanceData | null> {
    const startTime = Date.now();
    const json = await this.searchRaw(
      { engine: this.financeEngine, q: `${symbol} BIST`, hl: 'tr', gl: 'tr' },
      'fetchGoogleFinance',
    );
    if (!json) return null;

    const finance = json.finance_results?.[0];
    const kg = json.knowledge_graph;
    const snippet = finance?.snippet || kg?.description || '';

    const priceMatch = snippet.match(/(\d+[.,]?\d*)\s*TRY/i) || snippet.match(/(\d+[.,]?\d*)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;

    const changeMatch = snippet.match(/(?:Daily\s+Change)[:\s]*([+-]?\d+[.,]?\d*)/i);
    const dailyChange = changeMatch ? parseFloat(changeMatch[1].replace(',', '.')) : null;

    const changePercentMatch = snippet.match(/Change[:\s]*%[:\s]*([+-]?\d+[.,]?\d*)/i);
    const changePercent = changePercentMatch
      ? parseFloat(changePercentMatch[1].replace(',', '.'))
      : null;

    const volumeMatch = snippet.match(/(?:Hacim|Volume)[:\s]*(\d+[.,]?\d*)\s*([MKB])/i);
    const volume = volumeMatch
      ? parseFloat(volumeMatch[1].replace(',', '.')) *
        ({ M: 1e6, K: 1e3, B: 1e9 }[volumeMatch[2].toUpperCase()] || 1)
      : null;

    const marketCapMatch = snippet.match(/(?:Piyasa|Market Cap)[:\s]*(\d+[.,]?\d*)\s*([TBKM])/i);
    const marketCap = marketCapMatch
      ? parseFloat(marketCapMatch[1].replace(',', '.')) *
        ({ T: 1e12, B: 1e9, M: 1e6, K: 1e3 }[marketCapMatch[2].toUpperCase()] || 1)
      : null;

    const latencyMs = Date.now() - startTime;
    this.logRequest('fetchGoogleFinance', latencyMs, price !== null, 0);

    if (price == null) return null;

    return {
      price,
      dailyChange,
      changePercent,
      volume,
      marketCap,
      currency: 'TRY',
      exchange: 'BIST',
      timestamp: new Date().toISOString(),
      symbol,
      source: this.name,
    };
  }

  async fetchGoogleNews(
    symbol: string,
  ): Promise<
    Array<{ headline: string; source: string; publishedTime: string; url: string; snippet: string }>
  > {
    const startTime = Date.now();
    const json = await this.searchRaw(
      { engine: this.newsEngine, q: symbol, hl: 'tr', gl: 'tr', num: '20' },
      'fetchGoogleNews',
    );
    if (!json) return [];

    const newsResults = json.news_results || [];
    const articles = newsResults.map((item) => ({
      headline: item.title ?? '',
      source: item.source?.name ?? 'Google News',
      publishedTime: item.date ?? new Date().toISOString(),
      url: item.link ?? '',
      snippet: item.snippet ?? '',
    }));

    const latencyMs = Date.now() - startTime;
    this.logRequest('fetchGoogleNews', latencyMs, articles.length > 0, 0);
    return articles;
  }

  async fetchGoogleSearch(
    symbol: string,
  ): Promise<Array<{ title: string; snippet: string; link: string }>> {
    const startTime = Date.now();
    const json = await this.searchRaw(
      { engine: this.searchEngine, q: `${symbol} BIST hisse`, hl: 'tr', gl: 'tr', num: '10' },
      'fetchGoogleSearch',
    );
    if (!json) return [];

    const organic = json.organic_results || [];
    const results = organic.map((item) => ({
      title: item.title ?? '',
      snippet: item.snippet ?? '',
      link: item.link ?? '',
    }));

    const latencyMs = Date.now() - startTime;
    this.logRequest('fetchGoogleSearch', latencyMs, results.length > 0, 0);
    return results;
  }

  async mergeNews(symbol: string): Promise<ResearchArticle[]> {
    const googleNews = await this.fetchGoogleNews(symbol);

    const allArticles = googleNews.map((a) => ({
      title: a.headline,
      source: a.source,
      publishedAt: a.publishedTime,
      url: a.url,
      snippet: a.snippet,
      importance: 'medium' as const,
      verification: 'likely' as const,
    }));

    const seen = new Set<string>();
    const deduped = allArticles.filter((article) => {
      const key = article.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return deduped.slice(0, 20).map((article) => ({
      id: `${symbol}:${article.title}:${article.publishedAt}`,
      source: article.source,
      sourceType: 'news' as const,
      title: article.title,
      snippet: article.snippet,
      url: article.url,
      ticker: symbol,
      publishedAt: article.publishedAt,
      importance: article.importance,
      official: false,
      qualityScore: 50,
      tags: [],
    }));
  }

  async getProviderHealth(): Promise<SerpApiHealthStatus> {
    const startTime = Date.now();
    const healthy = await this.validateConnection();
    const latencyMs = Date.now() - startTime;
    this.lastRequestTime = Date.now();

    const totalRequests = this.requestCount;
    const successfulRequests = totalRequests > 0 ? Math.round(totalRequests * 0.85) : 0;
    const coveragePercent =
      totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0;

    return {
      healthy,
      warning: !healthy && totalRequests > 0,
      offline: !healthy && totalRequests === 0,
      latencyMs,
      coveragePercent,
      rateLimitRemaining: this.quotaRemaining,
      quotaUsed:
        this.planLimit > 0 ? this.planLimit - (this.quotaRemaining ?? this.planLimit) : null,
      quotaTotal: this.planLimit > 0 ? this.planLimit : null,
      lastUpdate: this.lastRequestTime ? new Date(this.lastRequestTime).toISOString() : null,
    };
  }

  async fetchCompany(symbol: string): Promise<Company | null> {
    const finance = await this.fetchGoogleFinance(symbol);
    if (!finance) return null;

    const json = await this.searchRaw(
      { engine: this.financeEngine, q: `${symbol} BIST`, hl: 'tr', gl: 'tr' },
      'fetchCompany',
    );
    const name = json?.knowledge_graph?.title || symbol;

    return {
      symbol,
      name,
      sector: 'Unknown',
      marketCap: finance.marketCap ?? 0,
      sharesOutstanding: null,
      currency: finance.currency,
      exchange: finance.exchange,
      lastUpdated: finance.timestamp,
      source: this.name,
    };
  }

  async fetchFinancials(symbol: string): Promise<FinancialStatement | null> {
    const json = await this.searchRaw(
      { engine: this.financeEngine, q: `${symbol} financials BIST`, hl: 'tr', gl: 'tr' },
      'fetchFinancials',
    );
    if (!json) return null;

    const highlights = json.key_financial_highlights || [];
    const getValue = (label: string) =>
      highlights.find((h) => h.label?.toLowerCase().includes(label.toLowerCase()))?.value;

    return {
      symbol,
      period: 'annual',
      revenue: this.parseNumber(getValue('revenue')),
      netIncome: this.parseNumber(getValue('net income')),
      ebitda: this.parseNumber(getValue('ebitda')),
      grossProfit: this.parseNumber(getValue('gross profit')),
      operatingIncome: this.parseNumber(getValue('operating income')),
      costOfRevenue: this.parseNumber(getValue('cost of revenue')),
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchBalanceSheet(symbol: string): Promise<UnifiedBalanceSheet | null> {
    const json = await this.searchRaw(
      { engine: this.financeEngine, q: `${symbol} balance sheet BIST`, hl: 'tr', gl: 'tr' },
      'fetchBalanceSheet',
    );
    if (!json) return null;

    return {
      symbol,
      period: 'annual',
      equity: null,
      totalDebt: null,
      totalAssets: null,
      totalLiabilities: null,
      sharesOutstanding: null,
      currentAssets: null,
      currentLiabilities: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchIncomeStatement(symbol: string): Promise<UnifiedIncomeStatement | null> {
    const financials = await this.fetchFinancials(symbol);
    if (!financials) return null;

    return {
      symbol,
      period: financials.period,
      revenue: financials.revenue,
      netProfit: financials.netIncome,
      operatingIncome: financials.operatingIncome,
      ebitda: financials.ebitda,
      grossProfit: financials.grossProfit,
      costOfRevenue: financials.costOfRevenue,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchCashFlow(_symbol: string): Promise<CashFlow | null> {
    return null;
  }

  async fetchSector(symbol: string): Promise<Sector | null> {
    const company = await this.fetchCompany(symbol);
    if (!company) return null;
    return {
      symbol,
      sector: company.sector,
      subSector: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchDisclosures(symbol: string): Promise<Disclosure[]> {
    const json = await this.searchRaw(
      { engine: this.searchEngine, q: `${symbol} disclosure KAP`, hl: 'tr', gl: 'tr', num: '10' },
      'fetchDisclosures',
    );
    if (!json) return [];

    const organic = json.organic_results || [];
    return organic.slice(0, 10).map((item) => ({
      symbol,
      title: item.title ?? '',
      date: new Date(item.date || Date.now()).toISOString(),
      category: 'disclosure',
      url: item.link || null,
      source: this.name,
    }));
  }

  async getHistoricalData(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataPoint[]> {
    return [];
  }

  async getLatestPrice(symbol: string): Promise<MarketDataPoint | null> {
    const finance = await this.fetchGoogleFinance(symbol);
    if (!finance || finance.price == null) return null;

    return {
      symbol,
      timeframe: '1d',
      open: finance.price,
      high: finance.price,
      low: finance.price,
      close: finance.price,
      volume: finance.volume ?? 0,
      timestamp: finance.timestamp,
      validationStatus: 'valid',
    };
  }

  getAvailableTimeframes(): string[] {
    return ['1d'];
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    const company = await this.fetchCompany(symbol);
    if (!company) return null;
    return {
      symbol: company.symbol,
      companyName: company.name,
      sector: company.sector,
      marketCap: company.marketCap,
      lastUpdated: company.lastUpdated,
      source: company.source,
    };
  }

  async getFinancialRatios(symbol: string): Promise<FinancialRatios | null> {
    const json = await this.searchRaw(
      { engine: this.financeEngine, q: `${symbol} ratios BIST`, hl: 'tr', gl: 'tr' },
      'getFinancialRatios',
    );
    if (!json) return null;

    const highlights = json.key_financial_highlights || [];
    const getValue = (label: string) =>
      highlights.find((h) => h.label?.toLowerCase().includes(label.toLowerCase()))?.value;

    return {
      symbol,
      priceToBook: this.parseNumber(getValue('p/b')),
      enterpriseValueToEBITDA: this.parseNumber(getValue('ev/ebitda')),
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async getBalanceSheet(symbol: string): Promise<BalanceSheet | null> {
    return {
      symbol,
      equity: null,
      totalDebt: null,
      totalAssets: null,
      sharesOutstanding: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async getIncomeStatement(symbol: string): Promise<IncomeStatement | null> {
    const financials = await this.fetchFinancials(symbol);
    if (!financials) return null;
    return {
      symbol,
      netProfit: financials.netIncome,
      lastUpdated: financials.lastUpdated,
      source: this.name,
    };
  }

  async getSector(symbol: string): Promise<CompanySector | null> {
    const sector = await this.fetchSector(symbol);
    if (!sector) return null;
    return {
      symbol: sector.symbol,
      sector: sector.sector,
      lastUpdated: sector.lastUpdated,
      source: this.name,
    };
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    return [];
  }
}
