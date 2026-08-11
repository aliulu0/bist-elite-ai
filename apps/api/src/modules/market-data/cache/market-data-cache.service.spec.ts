import { MarketDataCacheService } from './market-data-cache.service';
import { CacheService } from '../../../common/cache/cache.service';

describe('MarketDataCacheService', () => {
  let cache: jest.Mocked<Pick<CacheService, 'get' | 'set' | 'getOrSet' | 'delete' | 'clear' | 'getKeys'>>;
  let service: MarketDataCacheService;

  beforeEach(() => {
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      getOrSet: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getKeys: jest.fn(),
    } as jest.Mocked<Pick<CacheService, 'get' | 'set' | 'getOrSet' | 'delete' | 'clear' | 'getKeys'>>;
    service = new MarketDataCacheService(cache as unknown as CacheService);
  });

  it('writes provider:type:symbol keys into the marketData namespace', () => {
    service.set('yahoo', 'historical', 'THYAO|1d', [{ close: 1 }], 1000);
    expect(cache.set).toHaveBeenCalledWith('yahoo:historical:THYAO|1d', [{ close: 1 }], 1000, 'marketData');
  });

  it('reads with the exact same key shape it writes', () => {
    service.get('any', 'latestPrice', 'THYAO');
    expect(cache.get).toHaveBeenCalledWith('any:latestPrice:THYAO', 'marketData');
  });

  it('applies a type-specific TTL when none is provided', () => {
    service.set('finnhub', 'company', 'THYAO', { name: 'THYAO' });
    expect(cache.set).toHaveBeenCalledWith('finnhub:company:THYAO', { name: 'THYAO' }, 12 * 60 * 60 * 1000, 'marketData');

    service.set('finnhub', 'historical', 'THYAO|1d', []);
    expect(cache.set).toHaveBeenCalledWith('finnhub:historical:THYAO|1d', [], 24 * 60 * 60 * 1000, 'marketData');
  });

  it('returns undefined on a miss and passes through a hit unchanged', () => {
    cache.get.mockReturnValue(undefined);
    expect(service.get('yahoo', 'historical', 'THYAO|1d')).toBeUndefined();

    const hit = { close: 42 };
    cache.get.mockReturnValue(hit);
    expect(service.get('yahoo', 'historical', 'THYAO|1d')).toBe(hit);
  });

  it('invalidates and clears the marketData namespace', () => {
    cache.delete.mockReturnValue(true);
    expect(service.invalidate('yahoo', 'historical', 'THYAO|1d')).toBe(true);
    expect(cache.delete).toHaveBeenCalledWith('yahoo:historical:THYAO|1d', 'marketData');

    cache.clear.mockReturnValue(3);
    expect(service.clearAll()).toBe(3);
    expect(cache.clear).toHaveBeenCalledWith('marketData');
  });

  it('counts and lists cache entries per provider by key prefix', () => {
    cache.getKeys.mockReturnValue([
      'yahoo:historical:THYAO|1d',
      'yahoo:latestPrice:THYAO',
      'any:historical:ASELS|1d',
    ]);

    expect(service.getProviderCacheEntries('yahoo')).toBe(2);
    expect(service.getCacheKeysForProvider('yahoo')).toEqual([
      'yahoo:historical:THYAO|1d',
      'yahoo:latestPrice:THYAO',
    ]);
  });
});
