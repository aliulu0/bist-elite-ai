import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../../common/cache/cache.service';
import { MarketDataConfig, getMarketDataConfig } from '../config/market-data.config';

const CACHE_NAMESPACE = 'marketData';

@Injectable()
export class MarketDataCacheService {
  private readonly logger = new Logger(MarketDataCacheService.name);
  private readonly config: MarketDataConfig;

  constructor(private readonly cacheService: CacheService) {
    this.config = getMarketDataConfig();
  }

  get<T>(provider: string, type: string, symbol: string): T | undefined {
    const key = this.buildKey(provider, type, symbol);
    return this.cacheService.get<T>(key, CACHE_NAMESPACE);
  }

  set<T>(provider: string, type: string, symbol: string, data: T, ttlMs?: number): void {
    const key = this.buildKey(provider, type, symbol);
    const ttl = ttlMs ?? this.getTtlForType(type);
    this.cacheService.set(key, data, ttl, CACHE_NAMESPACE);
  }

  getOrSet<T>(
    provider: string,
    type: string,
    symbol: string,
    factory: () => T | Promise<T>,
    ttlMs?: number,
  ): T | Promise<T> {
    const key = this.buildKey(provider, type, symbol);
    const ttl = ttlMs ?? this.getTtlForType(type);
    return this.cacheService.getOrSet(key, factory, ttl, CACHE_NAMESPACE);
  }

  invalidate(provider: string, type: string, symbol: string): boolean {
    const key = this.buildKey(provider, type, symbol);
    return this.cacheService.delete(key, CACHE_NAMESPACE);
  }

  clearAll(): number {
    return this.cacheService.clear(CACHE_NAMESPACE);
  }

  getProviderCacheEntries(provider: string): number {
    const prefix = `${provider}:`;
    return this.cacheService
      .getKeys(CACHE_NAMESPACE)
      .filter((key) => key.startsWith(prefix)).length;
  }

  getCacheKeysForProvider(provider: string): string[] {
    const prefix = `${provider}:`;
    return this.cacheService
      .getKeys(CACHE_NAMESPACE)
      .filter((key) => key.startsWith(prefix));
  }

  private buildKey(provider: string, type: string, symbol: string): string {
    return `${provider}:${type}:${symbol}`;
  }

  private getTtlForType(type: string): number {
    const { cache } = this.config;
    switch (type) {
      case 'company':
        return cache.companyTtlMs;
      case 'financials':
      case 'balanceSheet':
      case 'incomeStatement':
      case 'cashFlow':
      case 'sector':
        return cache.financialTtlMs;
      case 'disclosures':
        return cache.disclosureTtlMs;
      case 'macroIndicators':
        return cache.macroIndicatorsTtlMs;
      case 'tcmb':
        return cache.tcmbTtlMs;
      case 'mkk':
        return cache.mkkTtlMs;
      case 'historical':
        return cache.historicalTtlMs;
      default:
        return cache.financialTtlMs;
    }
  }
}
