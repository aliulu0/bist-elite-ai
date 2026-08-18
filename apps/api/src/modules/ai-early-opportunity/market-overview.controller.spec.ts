import { MarketOverviewController } from './market-overview.controller';

describe('MarketOverviewController', () => {
  let controller: MarketOverviewController;

  const registry = {
    getSymbols: jest.fn(),
    getActiveSymbols: jest.fn(),
    getSymbolsBySector: jest.fn(),
    getCompanyName: jest.fn(),
    getSector: jest.fn(),
  };

  const latestPrice = {
    getLatestPriceIncremental: jest.fn(),
  };

  function priceState(ticker: string, price: number, changePercent: number, volume = 1000) {
    return {
      symbol: ticker,
      timeframe: '1d',
      price,
      change: price * 0.01,
      changePercent,
      volume,
      timestamp: '2026-01-01T12:00:00.000Z',
      provider: 'yahoo',
      sourceTimeframe: '1d',
      dataFreshness: 'fresh',
      lastSuccessfulUpdate: '2026-01-01T12:00:00.000Z',
    };
  }

  beforeEach(() => {
    jest.resetAllMocks();
    registry.getSymbols.mockReturnValue([
      {
        canonicalTicker: 'THYAO',
        companyName: 'Türk Hava Yolları',
        sector: 'Ulaştırma',
        active: true,
        isin: null,
        exchange: 'BIST',
        providers: {},
      },
      {
        canonicalTicker: 'AKBNK',
        companyName: 'Akbank',
        sector: 'Bankacılık',
        active: true,
        isin: null,
        exchange: 'BIST',
        providers: {},
      },
    ]);
    registry.getActiveSymbols.mockReturnValue([
      {
        canonicalTicker: 'THYAO',
        companyName: 'Türk Hava Yolları',
        sector: 'Ulaştırma',
        active: true,
        isin: null,
        exchange: 'BIST',
        providers: {},
      },
      {
        canonicalTicker: 'AKBNK',
        companyName: 'Akbank',
        sector: 'Bankacılık',
        active: true,
        isin: null,
        exchange: 'BIST',
        providers: {},
      },
    ]);
    latestPrice.getLatestPriceIncremental.mockImplementation(async (ticker: string) =>
      ticker === 'THYAO'
        ? priceState('THYAO', 300, 2.5, 5000)
        : ticker === 'AKBNK'
          ? priceState('AKBNK', 150, -1.2, 3000)
          : undefined,
    );
  });

  it('builds overview with real price-derived leaders', async () => {
    controller = new MarketOverviewController(
      {} as any,
      latestPrice as any,
      registry as any,
      undefined,
      undefined,
    );
    const res = await controller.getOverview();
    expect(res.bist100.value).toBeGreaterThan(0);
    expect(res.sectorHeatmap).toHaveLength(2);
    expect(res.topGainers[0].ticker).toBe('THYAO');
    expect(res.topLosers[0].ticker).toBe('AKBNK');
    expect(res.volumeLeaders[0].ticker).toBe('THYAO');
    // Without engines injected the leader lists stay empty rather than fabricated
    expect(res.smartMoneyLeaders).toHaveLength(0);
    expect(res.catalystLeaders).toHaveLength(0);
  });

  it('fills smart money and catalyst leaders from real engines when injected', async () => {
    const smartMoney = {
      getSmartMoney: jest.fn(async () => ({
        ticker: 'THYAO',
        smartMoneyScore: 82,
        accumulationLevel: 'strong',
        isValid: true,
      })),
    };
    const catalyst = {
      getCatalyst: jest.fn(async () => ({
        ticker: 'THYAO',
        catalystScore: 74,
        verifiedCount: 2,
        isValid: true,
      })),
    };
    controller = new MarketOverviewController(
      {} as any,
      latestPrice as any,
      registry as any,
      smartMoney as any,
      catalyst as any,
    );
    const res = await controller.getOverview();
    expect(res.smartMoneyLeaders[0]).toMatchObject({
      ticker: 'THYAO',
      smartMoneyScore: 82,
      accumulation: 'strong',
    });
    expect(res.catalystLeaders[0]).toMatchObject({
      ticker: 'THYAO',
      catalystScore: 74,
      verified: true,
    });
  });

  it('tolerates provider/engine failures per symbol', async () => {
    latestPrice.getLatestPriceIncremental.mockImplementation(async () => {
      throw new Error('provider down');
    });
    controller = new MarketOverviewController(
      {} as any,
      latestPrice as any,
      registry as any,
      undefined,
      undefined,
    );
    const res = await controller.getOverview();
    expect(res.bist100.value).toBe(0);
    expect(res.sectorHeatmap).toHaveLength(0);
    expect(res.smartMoneyLeaders).toHaveLength(0);
  });
});
