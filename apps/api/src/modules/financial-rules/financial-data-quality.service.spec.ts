import { FinancialDataQualityService } from './financial-data-quality.service';
import { DataQualityContext, FinancialDataQualityReport } from './financial-data-quality.types';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { FundamentalBundle } from './fundamental-integration.service';
import { FundamentalValidationReport } from './fundamental-validation.service';
import { AIConsensus } from '../ai-research/ai-research.types';
import { CacheService } from '../../common/cache/cache.service';

function makePoint(timestamp: string, overrides: Partial<MarketDataPoint> = {}): MarketDataPoint {
  return {
    symbol: 'THYAO',
    timeframe: '1d',
    open: 100,
    high: 105,
    low: 99,
    close: 104,
    volume: 1_000_000,
    timestamp,
    validationStatus: 'valid',
    ...overrides,
  };
}

function makeFundamentalBundle(): FundamentalBundle {
  return {
    report: {
      symbol: 'THYAO',
      overallStatus: 'PASS',
      score: 85,
      availableFilters: [],
      unknownFilters: [],
      reasons: [],
      timestamp: new Date().toISOString(),
    } as unknown as FundamentalValidationReport,
    marketCap: 185_000_000_000,
    dataQuality: 'VALID',
  };
}

function makeConsensus(): AIConsensus {
  return {
    ticker: 'THYAO',
    chatgptSummary: null,
    geminiSummary: null,
    perplexitySummary: null,
    grokSummary: null,
    newsSummary: '',
    researchSources: [],
    agreementLevel: 80,
    conflicts: [],
    confidence: 80,
    consensusScore: 85,
    providerSummaries: { chatgpt: 'summary' },
    totalEvidence: 1,
    duplicatesRemoved: 0,
    timestamp: new Date().toISOString(),
  };
}

function makeContext(overrides: Partial<DataQualityContext> = {}): DataQualityContext {
  const now = new Date();
  const ts = (msAgo: number) => new Date(now.getTime() - msAgo).toISOString();
  const history = [makePoint(ts(2 * 86_400_000)), makePoint(ts(86_400_000)), makePoint(ts(60_000))];
  return {
    price: history[history.length - 1],
    priceProvider: 'yahoo',
    priceFallbackUsed: false,
    priceTimestamp: ts(60_000),
    history,
    fundamental: makeFundamentalBundle(),
    consensus: makeConsensus(),
    providers: ['yahoo'],
    now: now.getTime(),
    ...overrides,
  };
}

describe('FinancialDataQualityService', () => {
  let cache: CacheService;
  let service: FinancialDataQualityService;

  beforeEach(() => {
    cache = new CacheService();
    service = new FinancialDataQualityService(cache);
  });

  afterEach(() => {
    cache.onModuleDestroy();
  });

  it('returns DATA_VERIFIED for a complete, fresh, consistent context', async () => {
    const report = await service.assess(makeContext());

    expect(report.status).toBe('DATA_VERIFIED');
    expect(report.qualityScore).toBeGreaterThanOrEqual(80);
    expect(report.ticker).toBe('THYAO');
    expect(report.freshness.overall).toBe('fresh');
    expect(report.marketIntegrity.valid).toBe(true);
    expect(report.fundamental?.status).toBe('PASS');
    expect(report.missingFields).toEqual([]);
    expect(report.providerConsistencyStatus).toBe('consistent');
  });

  it('degrades the report when price is missing', async () => {
    const report = await service.assess(makeContext({ price: null, priceTimestamp: undefined }));

    expect(report.status).not.toBe('DATA_VERIFIED');
    expect(report.errors).toContain('Fiyat verisi yok');
    expect(report.marketIntegrity.valid).toBe(false);
    expect(report.completenessScore).toBeLessThan(100);
  });

  it('flags market integrity errors for invalid OHLC data', async () => {
    const price = makePoint(new Date().toISOString(), { high: 10, low: 20 });
    const report = await service.assess(makeContext({ price, priceTimestamp: new Date().toISOString() }));

    expect(report.marketIntegrity.valid).toBe(false);
    expect(report.marketIntegrity.errors).toContain('High < Low');
  });

  it('lowers consistency when a fallback provider was used for price', async () => {
    const report = await service.assess(makeContext({ priceFallbackUsed: true }));

    expect(report.providerConsistencyStatus).toBe('partial');
    expect(report.conflicts).toContain('Fiyat verisinde fallback sağlayıcı kullanıldı');
    expect(report.providerConsistencyScore).toBeLessThan(100);
  });

  it('records missing fields when fundamental and research are absent', async () => {
    const report = await service.assess(makeContext({ fundamental: null, consensus: null }));

    expect(report.missingFields).toEqual(expect.arrayContaining(['fundamental', 'research']));
    expect(report.completenessScore).toBeLessThan(100);
  });

  it('serves repeated assessments from the cache namespace', async () => {
    const context = makeContext();
    const first = await service.assess(context);
    const second = await service.assess(context);

    expect(second).toBe(first);
    expect(second.status).toBe(first.status);
  });

  it('explains the report in Turkish with the quality label', async () => {
    const report: FinancialDataQualityReport = await service.assess(makeContext());

    const text = service.explain(report);

    expect(text).toContain('Veri kalitesi');
    expect(text).toContain('yüksek');
    expect(text).toContain(`${report.qualityScore}/100`);
  });
});
