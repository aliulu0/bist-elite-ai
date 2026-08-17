import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { CacheService } from '../../../common/cache/cache.service';
import { MarketDataCacheService } from '../cache/market-data-cache.service';
import { MarketDataValidationService } from '../market-data-validation.service';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { MarketDataConfig, getMarketDataConfig } from '../config/market-data.config';
import { FintablesUnifiedAdapter } from '../providers/unified/fintables-unified.adapter';
import { SerpApiAdapter } from '../providers/unified/serpapi.adapter';
import { YahooUnifiedAdapter } from '../providers/unified/yahoo-unified.adapter';
import { KAPAdapter } from '../providers/unified/kap.adapter';
import { TCMBAdapter } from '../providers/unified/tcmb.adapter';
import { MKKAdapter } from '../providers/unified/mkk.adapter';
import { YahooFinanceProvider } from '../providers/yahoo-finance.provider';
import { BaseProviderAdapter } from '../providers/unified/base-provider.adapter';
import { IUnifiedMarketDataProvider } from '../providers/unified/unified-provider.interface';
import { ProviderErrorClassifier, FAILURE_CATEGORIES } from '../error/error-classifier.service';
import { MarketDataPoint, FetchOptions, MacroIndicator } from '../interfaces';
import { SymbolRegistryService } from '../symbol-registry/symbol-registry.service';
import { PLATFORM_TIMEFRAMES } from '../coverage/coverage-report.types';
import {
  Company,
  FinancialStatement,
  UnifiedBalanceSheet,
  UnifiedIncomeStatement,
  CashFlow,
  Sector,
  Disclosure,
} from '../interfaces/unified-domain.types';

const RUN_SMOKE = process.env.SMOKE_TEST === '1';
const describeOrSkip = RUN_SMOKE ? describe : describe.skip;

const classifier = new ProviderErrorClassifier();

type ProbeOutcome = 'DATA' | 'EMPTY' | `ERROR:${string}`;

function outcomeOf(result: unknown): ProbeOutcome {
  if (Array.isArray(result)) return result.length > 0 ? 'DATA' : 'EMPTY';
  return result ? 'DATA' : 'EMPTY';
}

async function probePrice(
  label: string,
  fn: () => Promise<MarketDataPoint | MarketDataPoint[] | null>,
): Promise<{ label: string; outcome: ProbeOutcome; detail: string; candleCount: number }> {
  try {
    const result = await fn();
    let candleCount = 0;
    const outcome = outcomeOf(result);
    if (Array.isArray(result)) candleCount = result.length;
    return { label, outcome, detail: '', candleCount };
  } catch (error) {
    const classified = classifier.classify(error);
    const known = FAILURE_CATEGORIES.includes(classified.category);
    return {
      label,
      outcome: known ? (`ERROR:${classified.category}` as ProbeOutcome) : 'ERROR:UNCLASSIFIED',
      detail: classified.category,
      candleCount: 0,
    };
  }
}

function buildOrchestrator(
  adapters: IUnifiedMarketDataProvider[],
  config?: MarketDataConfig,
): {
  orchestrator: MarketDataOrchestrator;
  cacheService: MarketDataCacheService;
  circuitBreaker: CircuitBreakerService;
} {
  const circuitBreaker = new CircuitBreakerService();
  const cacheService = new MarketDataCacheService(new CacheService());
  const validationService = new MarketDataValidationService();

  const orchestrator = new MarketDataOrchestrator(
    circuitBreaker,
    cacheService,
    adapters,
    config,
    undefined,
    undefined,
    undefined,
    validationService,
  );

  return { orchestrator, cacheService, circuitBreaker };
}

function priceAdapters(circuitBreaker: CircuitBreakerService): IUnifiedMarketDataProvider[] {
  return [new YahooUnifiedAdapter(circuitBreaker, new YahooFinanceProvider())];
}

function allAdapters(circuitBreaker: CircuitBreakerService): IUnifiedMarketDataProvider[] {
  return [
    new FintablesUnifiedAdapter(circuitBreaker),
    new SerpApiAdapter(circuitBreaker),
    new YahooUnifiedAdapter(circuitBreaker, new YahooFinanceProvider()),
    new KAPAdapter(circuitBreaker),
    new TCMBAdapter(circuitBreaker),
    new MKKAdapter(circuitBreaker),
  ];
}

/**
 * Real-provider stand-in that always fails with a retryable network error.
 * Used ONLY to exercise the real fallback path deterministically; the fallback
 * provider behind it is the real Yahoo adapter.
 */
class FailFastProvider extends BaseProviderAdapter {
  readonly name = 'failfast';

  constructor(circuitBreaker: CircuitBreakerService) {
    super('FailFastProvider', circuitBreaker);
  }

  private async fail(): Promise<never> {
    throw new Error('Injected network failure (smoke)');
  }

  async getLatestPrice(symbol: string): Promise<MarketDataPoint | null> {
    return this.fail();
  }

  async getHistoricalData(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataPoint[]> {
    return this.fail();
  }

  getAvailableTimeframes(): string[] {
    return ['1d'];
  }

  async validateConnection(): Promise<boolean> {
    return false;
  }

  async fetchCompany(symbol: string): Promise<Company | null> {
    return null;
  }

  async fetchFinancials(symbol: string): Promise<FinancialStatement | null> {
    return null;
  }

  async fetchBalanceSheet(symbol: string): Promise<UnifiedBalanceSheet | null> {
    return null;
  }

  async fetchIncomeStatement(symbol: string): Promise<UnifiedIncomeStatement | null> {
    return null;
  }

  async fetchCashFlow(symbol: string): Promise<CashFlow | null> {
    return null;
  }

  async fetchSector(symbol: string): Promise<Sector | null> {
    return null;
  }

  async fetchDisclosures(symbol: string): Promise<Disclosure[]> {
    return [];
  }

  async getCompanyProfile(symbol: string): Promise<import('../interfaces').CompanyProfile | null> {
    return null;
  }

  async getFinancialRatios(
    symbol: string,
  ): Promise<import('../interfaces').FinancialRatios | null> {
    return null;
  }

  async getBalanceSheet(symbol: string): Promise<import('../interfaces').BalanceSheet | null> {
    return null;
  }

  async getIncomeStatement(
    symbol: string,
  ): Promise<import('../interfaces').IncomeStatement | null> {
    return null;
  }

  async getSector(symbol: string): Promise<import('../interfaces').CompanySector | null> {
    return null;
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    return [];
  }
}

function configWithFailFast(enabledFailFast: boolean, enableYahoo: boolean): MarketDataConfig {
  const base = getMarketDataConfig();
  const providers = { ...base.providers };
  for (const key of Object.keys(providers) as Array<keyof typeof providers>) {
    providers[key] = { ...providers[key], enabled: false };
  }
  const extended = {
    ...base,
    providers: {
      ...providers,
      failfast: {
        enabled: enabledFailFast,
        priority: 1,
        timeout: 2000,
        retries: 0,
        apiKey: '',
        baseUrl: '',
      },
      yahoo: { ...providers.yahoo, enabled: enableYahoo },
    },
  } as unknown as MarketDataConfig;
  return extended;
}

describeOrSkip('Real Provider Runtime Validation (SMOKE)', () => {
  jest.setTimeout(300_000);

  const SAMPLE = new SymbolRegistryService()
    .getActiveSymbols()
    .slice(0, 6)
    .map((s) => s.canonicalTicker);

  // ---------------------------------------------------------------------------
  // 1. Provider inventory / configuration report
  // ---------------------------------------------------------------------------
  describe('provider configuration report', () => {
    const { orchestrator } = buildOrchestrator(allAdapters(new CircuitBreakerService()));

    it('lists every registered provider with a complete config entry', () => {
      const configuration = orchestrator.getProviderConfiguration();
      expect(configuration.length).toBeGreaterThanOrEqual(6);
      const names = configuration.map((c) => c.name);
      for (const provider of ['fintables', 'serpapi', 'yahoo', 'kap', 'tcmb', 'mkk']) {
        expect(names).toContain(provider);
      }
      for (const entry of configuration) {
        expect(typeof entry.priority).toBe('number');
        expect(typeof entry.enabled).toBe('boolean');
        expect(typeof entry.configured).toBe('boolean');
        expect(entry).not.toHaveProperty('apiKey');
        expect(entry).not.toHaveProperty('token');
        expect(entry).not.toHaveProperty('secret');
      }
    });

    it('exposes provider status and a timeframe report without network calls', async () => {
      const status = await orchestrator.getProviderStatus();
      expect(status.length).toBeGreaterThanOrEqual(6);
      for (const entry of status) {
        expect(typeof entry.connected).toBe('boolean');
        expect(entry.circuitState).toMatch(/^(CLOSED|OPEN|HALF_OPEN)$/);
        expect(entry.uptimeMs).toBeGreaterThanOrEqual(0);
      }

      const timeframes = orchestrator.getTimeframeStatusReport();
      expect(timeframes.map((t) => t.timeframe)).toEqual([...PLATFORM_TIMEFRAMES]);
      for (const entry of timeframes) {
        expect(['REAL', 'DERIVED', 'UNAVAILABLE']).toContain(entry.status);
        expect(typeof entry.predictionTarget).toBe('string');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Connectivity + failure classification against the live APIs
  // ---------------------------------------------------------------------------
  describe('live connectivity and failure classification', () => {
    const circuitBreaker = new CircuitBreakerService();
    const adapters = allAdapters(circuitBreaker);

    it('classifies every provider outcome into a known failure category or data', async () => {
      const probes: Array<{
        label: string;
        outcome: ProbeOutcome;
        detail: string;
        candleCount: number;
      }> = [];

      for (const adapter of adapters) {
        const isPriceProvider = ['yahoo', 'fintables'].includes(adapter.name);

        if (isPriceProvider) {
          const latest = await probePrice(`${adapter.name}::latest`, () =>
            adapter.getLatestPrice('THYAO'),
          );
          const history = await probePrice(`${adapter.name}::1d`, () =>
            adapter.getHistoricalData('THYAO', '1d'),
          );
          probes.push(latest, history);
        } else {
          probes.push({
            label: `${adapter.name}::connection`,
            outcome: (await adapter.validateConnection()) ? 'DATA' : 'EMPTY',
            detail: '',
            candleCount: 0,
          });
        }
      }

      for (const probe of probes) {
        // eslint-disable-next-line no-console
        console.log(
          `[smoke] ${probe.label}: ${probe.outcome}${probe.candleCount ? ` candles=${probe.candleCount}` : ''}`,
        );
        if (probe.outcome.startsWith('ERROR:')) {
          const category = probe.outcome.replace('ERROR:', '');
          expect(FAILURE_CATEGORIES).toContain(category);
        }
      }

      const latestOutcomes = probes.filter((p) => p.label.endsWith('::latest'));
      const served = latestOutcomes.some((p) => p.outcome === 'DATA');
      // Real-data gate: at least one price provider (yahoo)
      // must return a quote for THYAO, otherwise the runtime is not usable.
      expect(served).toBe(true);
    });

    it('classifies HTTP-level failures deterministically', () => {
      expect(classifier.classify({ status: 401 }).category).toBe('AUTHENTICATION_ERROR');
      expect(classifier.classify({ status: 403 }).category).toBe('AUTHENTICATION_ERROR');
      expect(classifier.classify({ status: 404 }).category).toBe('SYMBOL_NOT_FOUND');
      expect(classifier.classify({ status: 429 }).category).toBe('RATE_LIMIT');
      expect(classifier.classify({ status: 503 }).category).toBe('PROVIDER_ERROR');
      expect(classifier.classify({ status: 400 }).category).toBe('INVALID_RESPONSE');
      expect(classifier.classify(new Error('fetch failed'))).toMatchObject({
        category: 'NETWORK_ERROR',
      });
      expect(classifier.classify(new Error('Timeout after 15000ms'))).toMatchObject({
        category: 'TIMEOUT',
      });
      expect(classifier.isRetryable('AUTHENTICATION_ERROR')).toBe(false);
      expect(classifier.isRetryable('NETWORK_ERROR')).toBe(true);
      expect(classifier.isRetryable('RATE_LIMIT')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Coverage matrix through the real orchestrator
  // ---------------------------------------------------------------------------
  describe('real coverage matrix (latest + history)', () => {
    it('serves latest price and 1d history for the active-symbol sample', async () => {
      const { orchestrator } = buildOrchestrator(priceAdapters(new CircuitBreakerService()));
      let servedLatest = 0;
      let servedHistory = 0;

      for (const symbol of SAMPLE) {
        const latest = await orchestrator.fetchLatestPrice(symbol);
        if (latest?.data) {
          servedLatest++;
          expect(latest.data.validationStatus).not.toBe('invalid');
          expect(Number.isFinite(latest.data.close)).toBe(true);
          // eslint-disable-next-line no-console
          console.log(
            `[smoke] ${symbol} latest: provider=${latest.provider} close=${latest.data.close} q=${latest.dataQuality} attempts=[${latest.attemptedProviders?.join(', ')}]`,
          );
        }

        const history = await orchestrator.fetchHistoricalData(symbol, '1d');
        if (history?.data.length) {
          servedHistory++;
          for (const point of history.data) {
            expect(point.validationStatus).not.toBe('invalid');
            expect(Number.isFinite(point.close)).toBe(true);
            expect(Number.isFinite(point.volume)).toBe(true);
          }
          // eslint-disable-next-line no-console
          console.log(
            `[smoke] ${symbol} 1d: provider=${history.provider} candles=${history.data.length} q=${history.dataQuality} attempts=[${history.attemptedProviders?.join(', ')}]`,
          );
        }
      }

      // Real-data gate: the majority of the sample must be served.
      expect(servedLatest).toBeGreaterThanOrEqual(Math.ceil(SAMPLE.length / 2));
      expect(servedHistory).toBeGreaterThanOrEqual(Math.ceil(SAMPLE.length / 2));
    });

    it('reports a timeframe resolution matrix for every platform timeframe', async () => {
      const { orchestrator } = buildOrchestrator(priceAdapters(new CircuitBreakerService()));
      const symbol = SAMPLE[0];

      for (const timeframe of PLATFORM_TIMEFRAMES) {
        const result = await orchestrator.fetchHistoricalData(symbol, timeframe);
        if (!result?.data.length) {
          // eslint-disable-next-line no-console
          console.log(`[smoke] ${symbol} ${timeframe}: NO DATA`);
          continue;
        }
        const latest = result.data[result.data.length - 1];
        expect(result.data.every((p) => p.validationStatus !== 'invalid')).toBe(true);
        // eslint-disable-next-line no-console
        console.log(
          `[smoke] ${symbol} ${timeframe}: provider=${result.provider} candles=${result.data.length} sourceTf=${result.sourceTimeframe} latest=${latest.timestamp}`,
        );
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Cache reuse through the REAL cache service (regression lock for the
  //    read-key vs write-key mismatch that prevented cache hits).
  // ---------------------------------------------------------------------------
  describe('cache reuse (real CacheService)', () => {
    it('serves the second fetch for the same symbol+timeframe from cache', async () => {
      const { orchestrator, cacheService } = buildOrchestrator(
        priceAdapters(new CircuitBreakerService()),
      );
      const symbol = SAMPLE[0];

      const first = await orchestrator.fetchHistoricalData(symbol, '1d');
      expect(first).not.toBeNull();
      expect(first!.data.length).toBeGreaterThan(0);
      expect(first!.cached).toBe(false);

      const cacheKey = `${symbol}|1d`;
      expect(cacheService.get<unknown>('any', 'historical', cacheKey)).toBeDefined();

      const second = await orchestrator.fetchHistoricalData(symbol, '1d');
      expect(second).not.toBeNull();
      expect(second!.cached).toBe(true);
      expect(second!.provider).toBe('cache');
      expect(second!.data).toBe(first!.data);

      const providerKeys = cacheService.getCacheKeysForProvider(first!.provider);
      expect(providerKeys.some((key) => key.includes('historical'))).toBe(true);
    });

    it('serves the second latest-price fetch from cache', async () => {
      const { orchestrator } = buildOrchestrator(priceAdapters(new CircuitBreakerService()));
      const symbol = SAMPLE[0];

      const first = await orchestrator.fetchLatestPrice(symbol);
      expect(first).not.toBeNull();
      expect(first!.cached).toBe(false);

      const second = await orchestrator.fetchLatestPrice(symbol);
      expect(second).not.toBeNull();
      expect(second!.cached).toBe(true);
      expect(second!.provider).toBe('cache');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Fallback behaviour against real providers
  // ---------------------------------------------------------------------------
  describe('fallback with real providers', () => {
    it('falls back to a working provider when the primary fails', async () => {
      const { orchestrator } = buildOrchestrator(
        [
          new FailFastProvider(new CircuitBreakerService()),
          ...priceAdapters(new CircuitBreakerService()),
        ],
        configWithFailFast(true, true),
      );

      const result = await orchestrator.fetchHistoricalData(SAMPLE[0], '1d');
      expect(result).not.toBeNull();
      expect(result!.data.length).toBeGreaterThan(0);
      expect(result!.provider).not.toBe('failfast');
      expect(result!.fallbackUsed).toBe(true);
      expect(result!.attemptedProviders).toContain('failfast');
      expect(result!.attemptedProviders![0]).toBe('failfast');
    });

    it('never fabricates data when every provider fails', async () => {
      const { orchestrator } = buildOrchestrator(
        [new FailFastProvider(new CircuitBreakerService())],
        configWithFailFast(true, false),
      );

      const latest = await orchestrator.fetchLatestPrice(SAMPLE[0]);
      expect(latest).toBeNull();

      const history = await orchestrator.fetchHistoricalData(SAMPLE[0], '1d');
      expect(history).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Data quality + freshness of real candles
  // ---------------------------------------------------------------------------
  describe('real data quality and freshness', () => {
    it('enforces OHLCV invariants, ordering and freshness for the 1d series', async () => {
      const { orchestrator } = buildOrchestrator(priceAdapters(new CircuitBreakerService()));
      const result = await orchestrator.fetchHistoricalData(SAMPLE[0], '1d');
      expect(result).not.toBeNull();
      expect(result!.data.length).toBeGreaterThanOrEqual(30);

      const points = result!.data;
      const timestamps = points.map((p) => Date.parse(p.timestamp));

      for (const point of points) {
        expect(point.high).toBeGreaterThanOrEqual(point.low);
        expect(point.high).toBeGreaterThanOrEqual(point.open);
        expect(point.high).toBeGreaterThanOrEqual(point.close);
        expect(point.low).toBeLessThanOrEqual(point.open);
        expect(point.low).toBeLessThanOrEqual(point.close);
        expect(point.volume).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(point.close)).toBe(true);
      }

      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
      }

      const unique = new Set(timestamps);
      expect(unique.size).toBe(timestamps.length);

      const ageMs = Date.now() - timestamps[timestamps.length - 1];
      const ageDays = ageMs / (24 * 60 * 60 * 1000);
      // eslint-disable-next-line no-console
      console.log(
        `[smoke] ${SAMPLE[0]} 1d: bars=${points.length} latestAgeDays=${ageDays.toFixed(1)}`,
      );
      // Long Turkish holidays can pause trading for ~9 days; 14 days is safe.
      expect(ageDays).toBeLessThanOrEqual(14);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Health + diagnostics after real traffic
  // ---------------------------------------------------------------------------
  describe('health and diagnostics after real traffic', () => {
    it('records per-provider request metrics and diagnostics', async () => {
      const { orchestrator, circuitBreaker } = buildOrchestrator(
        priceAdapters(new CircuitBreakerService()),
      );
      await orchestrator.fetchHistoricalData(SAMPLE[0], '1d');

      const status = await orchestrator.getProviderStatus();
      const serving = status.find((s) => s.name === 'yahoo');
      expect(serving).toBeDefined();
      expect(serving!.totalRequests).toBeGreaterThan(0);
      expect(serving!.successfulRequests).toBeGreaterThanOrEqual(1);

      const diagnostics = orchestrator.getProviderDiagnostics();
      for (const provider of ['yahoo']) {
        expect(diagnostics[provider]).toBeDefined();
        expect('lastErrorCategory' in diagnostics[provider]).toBe(true);
      }

      const health = await orchestrator.getProviderHealth();
      expect(typeof health.yahoo).toBe('boolean');
    });
  });
});
