import { Injectable, Logger, Optional } from '@nestjs/common';
import { CircuitBreakerService } from '../../market-data/circuit-breaker/circuit-breaker.service';
import { CacheService } from '../../../common/cache/cache.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { NewsAggregationService } from '../../research/news-aggregation.service';
import { ResearchEvidenceService } from '../services/research-evidence.service';
import { AgentReachAdapterStatus, ResearchEvidence } from '../interfaces';

const CACHE_NAMESPACE = 'agent-reach';
const AGENT_REACH_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AgentReachAdapter {
  private readonly logger = new Logger(AgentReachAdapter.name);
  private connected = false;
  private quotaUsed = 0;
  private quotaLimit: number | null = null;
  private lastSync: string | null = null;
  private lastError: string | null = null;

  constructor(
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly symbolRegistry: SymbolRegistryService,
    private readonly newsAggregation: NewsAggregationService,
    private readonly researchEvidence: ResearchEvidenceService,
    private readonly cache: CacheService,
    @Optional() config?: { apiKey?: string; baseUrl?: string; timeout?: number; retries?: number },
  ) {
    this.apiKey = config?.apiKey ?? process.env.SERPAPI_API_KEY ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.SERPAPI_BASE_URL ?? 'https://serpapi.com/search.json';
    this.connected = !!this.apiKey;
  }

  private apiKey: string;
  private baseUrl: string;
  private searchEngine: string = 'google';
  private financeEngine: string = 'google_finance';

  async validateConnection(): Promise<boolean> {
    if (!this.apiKey) {
      this.connected = false;
      return false;
    }
    try {
      const json = await this.searchRaw({ engine: this.searchEngine, q: 'BIST İstanbul', num: '1' });
      this.connected = json !== null && !json.error && json.search_metadata?.status === 'Success';
      return this.connected;
    } catch {
      this.connected = false;
      return false;
    }
  }

  async getStatus(): Promise<AgentReachAdapterStatus> {
    return {
      available: this.connected,
      lastSync: this.lastSync,
      lastError: this.lastError,
      quotaUsed: this.quotaUsed,
      quotaLimit: this.quotaLimit,
    };
  }

  async searchCompany(ticker: string): Promise<ResearchEvidence[]> {
    if (!this.connected) {
      this.logger.warn('Agent Reach not available, skipping company search');
      return [];
    }

    try {
      const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
      const query = `"${companyName}" ${ticker} BIST`;
      const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
      const evidence = await this.researchEvidence.normalizeEvidence(
        json?.organic_results ?? [],
        ticker,
        'agent-reach'
      );
      return evidence;
    } catch (error) {
      this.logger.error(`Agent Reach search failed for ${ticker}: ${error instanceof Error ? error.message : String(error)}`);
      this.lastError = error instanceof Error ? error.message : String(error);
      return [];
    }
  }

  async searchNews(ticker: string): Promise<ResearchEvidence[]> {
    if (!this.connected) return [];
    
    try {
      const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
      const query = `"${companyName}" ${ticker} haber`;
      const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
      return this.researchEvidence.normalizeEvidence(
        [...(json?.organic_results ?? []), ...(json?.news_results ?? [])],
        ticker,
        'agent-reach'
      );
    } catch (error) {
      this.logger.error(`Agent Reach news search failed for ${ticker}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async searchSector(sector: string): Promise<ResearchEvidence[]> {
    if (!this.connected) return [];
    
    try {
      const query = `"${sector}" BIST sektör`;
      const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
      return this.researchEvidence.normalizeEvidence(
        json?.organic_results ?? [],
        sector,
        'agent-reach'
      );
    } catch (error) {
      this.logger.error(`Agent Reach sector search failed for ${sector}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async searchMarket(): Promise<ResearchEvidence[]> {
    if (!this.connected) return [];
    
    try {
      const query = 'BIST borsa İstanbul piyasa güncel gelişmeler';
      const json = await this.searchRaw({ engine: this.searchEngine, q: query, num: '10', hl: 'tr', gl: 'tr' });
      return this.researchEvidence.normalizeEvidence(
        json?.organic_results ?? [],
        'MARKET',
        'agent-reach'
      );
    } catch (error) {
      this.logger.error(`Agent Reach market search failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async searchKeyword(keyword: string): Promise<ResearchEvidence[]> {
    if (!this.connected) return [];
    
    try {
      const json = await this.searchRaw({ engine: this.searchEngine, q: keyword, num: '10', hl: 'tr', gl: 'tr' });
      return this.researchEvidence.normalizeEvidence(
        json?.organic_results ?? [],
        'KEYWORD',
        'agent-reach'
      );
    } catch (error) {
      this.logger.error(`Agent Reach keyword search failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async searchCompanyWebsite(ticker: string): Promise<string | null> {
    if (!this.connected) return null;
    
    try {
      const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
      const json = await this.searchRaw({ engine: this.searchEngine, q: `${companyName} ${ticker} resmi web sitesi`, num: '5', hl: 'tr', gl: 'tr' });
      if (!json?.organic_results?.length) return null;
      return json.organic_results[0].link ?? null;
    } catch {
      return null;
    }
  }

  async searchInvestorRelations(ticker: string): Promise<string | null> {
    if (!this.connected) return null;
    
    try {
      const companyName = this.symbolRegistry.getCompanyName(ticker) ?? ticker;
      const json = await this.searchRaw({ engine: this.searchEngine, q: `${companyName} ${ticker} yatırımcı ilişkileri`, num: '5', hl: 'tr', gl: 'tr' });
      if (!json?.organic_results?.length) return null;
      return json.organic_results[0].link ?? null;
    } catch {
      return null;
    }
  }

  private async searchRaw(params: Record<string, string>): Promise<any> {
    if (!this.apiKey) {
      this.logger.warn('SERPAPI_API_KEY not configured, skipping search');
      this.lastError = 'SERPAPI_API_KEY not configured';
      return null;
    }

    const result = await this.withRetry(async () => {
      const query = new URLSearchParams({ api_key: this.apiKey, ...params });
      const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = (await response.json()) as any;
      this.quotaUsed++;
      if (json.error || json.error_message) {
        throw new Error(json.error_message || json.error || 'SerpAPI error');
      }
      return json;
    }, `agent-reach(${params.engine ?? 'google'})`);

    return result;
  }

  private async withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error | null = null;
    for (let i = 0; i < 3; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`${context} retry ${i + 1}/3 failed: ${lastError.message}`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    throw lastError!;
  }
}