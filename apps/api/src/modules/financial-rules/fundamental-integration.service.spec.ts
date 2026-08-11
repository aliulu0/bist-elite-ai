import { FundamentalIntegrationService } from './fundamental-integration.service';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { FundamentalValidationService } from './fundamental-validation.service';
import { FundamentalProfile } from '../market-data/interfaces/unified-domain.types';

function makeProfile(overrides: Partial<FundamentalProfile> = {}): FundamentalProfile {
  return {
    symbol: 'TEST',
    profile: { symbol: 'TEST', companyName: 'Test Co', sector: 'Banka', marketCap: 185_000_000_000, lastUpdated: '2024-01-01', source: 'test' },
    ratios: { symbol: 'TEST', priceToBook: 1.2, enterpriseValueToEBITDA: 5.0, lastUpdated: '2024-01-01', source: 'test' },
    balance: { symbol: 'TEST', equity: 100_000_000, totalDebt: 30_000_000, totalAssets: 300_000_000, sharesOutstanding: 1_000_000, lastUpdated: '2024-01-01', source: 'test' },
    income: { symbol: 'TEST', netProfit: 20_000_000, lastUpdated: '2024-01-01', source: 'test' },
    sector: { symbol: 'TEST', sector: 'Banka', subSector: null, lastUpdated: '2024-01-01', source: 'test' },
    netProfitPrevious: 18_000_000,
    equityPrevious: 95_000_000,
    lastUpdated: '2024-01-01',
    source: 'test',
    ...overrides,
  };
}

function makeValidationMock() {
  return {
    fromProviderInputs: jest.fn().mockReturnValue({
      symbol: 'TEST',
      overallStatus: 'PASS' as const,
      score: 85,
      availableFilters: [],
      unknownFilters: [],
      reasons: ['PD/DD: geçti (1.2)'],
      pdDd: { id: 'price_to_book', name: 'PD/DD', availability: 'AVAILABLE', status: 'PASS', value: 1.2, thresholds: null, reason: '' },
      fdFavok: { id: 'ev_to_ebitda', name: 'FD/FAVÖK', availability: 'AVAILABLE', status: 'PASS', value: 5.0, thresholds: null, reason: '' },
      netProfitGrowth: { id: 'net_profit_growth', name: 'Net Kar Büyüme', availability: 'AVAILABLE', status: 'PASS', value: 10, thresholds: null, reason: '' },
      equityGrowth: { id: 'equity_growth', name: 'Sermaye Büyüme', availability: 'AVAILABLE', status: 'PASS', value: 5, thresholds: null, reason: '' },
      debtRatio: { id: 'debt_ratio', name: 'Borç Oranı', availability: 'AVAILABLE', status: 'PASS', value: 0.1, thresholds: null, reason: '' },
      sectorRelative: { id: 'sector_comparison', name: 'Sektöre Göre', availability: 'AVAILABLE', status: 'PASS', value: 0, thresholds: null, reason: '' },
    }),
  };
}

describe('FundamentalIntegrationService', () => {
  let marketData: { fetchFundamentalData: jest.Mock };
  let validation: ReturnType<typeof makeValidationMock>;
  let service: FundamentalIntegrationService;

  beforeEach(() => {
    marketData = { fetchFundamentalData: jest.fn() };
    validation = makeValidationMock();
    service = new FundamentalIntegrationService(
      marketData as unknown as MarketDataOrchestrator,
      validation as unknown as FundamentalValidationService,
    );
  });

  it('returns report + marketCap from a single fundamental fetch', async () => {
    marketData.fetchFundamentalData.mockResolvedValue({ data: makeProfile(), provider: 'test', cached: false, timestamp: '2024-01-01', dataQuality: 'VALID' });

    const bundle = await service.getReportAndMarketCap('TEST');

    expect(marketData.fetchFundamentalData).toHaveBeenCalledTimes(1);
    expect(marketData.fetchFundamentalData).toHaveBeenCalledWith('TEST');
    expect(bundle.marketCap).toBe(185_000_000_000);
    expect(bundle.dataQuality).toBe('VALID');
    expect(bundle.report).not.toBeNull();
    expect(bundle.report!.score).toBe(85);
    expect(bundle.report!.overallStatus).toBe('PASS');
    const passedInputs = validation.fromProviderInputs.mock.calls[0][1] as {
      netProfitPrevious: number | null;
      equityPrevious: number | null;
    };
    expect(passedInputs.netProfitPrevious).toBe(18_000_000);
    expect(passedInputs.equityPrevious).toBe(95_000_000);
  });

  it('returns nulls when no fundamental data is available', async () => {
    marketData.fetchFundamentalData.mockResolvedValue(null);
    const bundle = await service.getReportAndMarketCap('NOPE');
    expect(bundle.report).toBeNull();
    expect(bundle.marketCap).toBeNull();
    expect(bundle.dataQuality).toBeNull();
    expect(validation.fromProviderInputs).not.toHaveBeenCalled();
  });

  it('returns nulls when the data payload is empty', async () => {
    marketData.fetchFundamentalData.mockResolvedValue({ data: null, provider: 'test', cached: false, timestamp: '2024-01-01' });
    const bundle = await service.getReportAndMarketCap('NOPE');
    expect(bundle.report).toBeNull();
    expect(bundle.marketCap).toBeNull();
  });

  it('swallows fetch errors and returns an empty bundle', async () => {
    marketData.fetchFundamentalData.mockRejectedValue(new Error('Network down'));
    const bundle = await service.getReportAndMarketCap('TEST');
    expect(bundle.report).toBeNull();
    expect(bundle.marketCap).toBeNull();
    expect(bundle.dataQuality).toBeNull();
  });

  it('still builds a report when marketCap is missing but validates data', async () => {
    marketData.fetchFundamentalData.mockResolvedValue({
      data: makeProfile({ profile: { symbol: 'TEST', companyName: 'Test Co', sector: 'Banka', marketCap: 0, lastUpdated: '2024-01-01', source: 'test' } }),
      provider: 'test',
      cached: false,
      timestamp: '2024-01-01',
    });
    const bundle = await service.getReportAndMarketCap('TEST');
    expect(bundle.report).not.toBeNull();
    expect(bundle.marketCap).toBeNull();
  });

  it('falls back to the provided sector when the profile has none', async () => {
    marketData.fetchFundamentalData.mockResolvedValue({ data: makeProfile({ profile: null, sector: null }) });
    await service.getReportAndMarketCap('TEST', 'Tekstil');
    expect(validation.fromProviderInputs).toHaveBeenCalledTimes(1);
    const inputs = validation.fromProviderInputs.mock.calls[0][1];
    expect(inputs.sector?.sector).toBe('Tekstil');
  });

  it('getFinancialData returns null on failure', async () => {
    marketData.fetchFundamentalData.mockRejectedValue(new Error('boom'));
    await expect(service.getFinancialData('TEST')).resolves.toBeNull();
  });
});
