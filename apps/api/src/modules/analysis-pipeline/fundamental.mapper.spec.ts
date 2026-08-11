import { mapToFundamentalData, mapToFinancialData, FundamentalProviderInputs } from './fundamental.mapper';

describe('FundamentalMapper', () => {
  describe('mapToFundamentalData', () => {
    const fullInputs: FundamentalProviderInputs = {
      profile: {
        symbol: 'THYAO',
        companyName: 'Türk Hava Yolları',
        sector: 'Ulaştırma',
        marketCap: 450_000_000_000,
        lastUpdated: '2025-01-01',
        source: 'fintables',
      },
      ratios: {
        symbol: 'THYAO',
        priceToBook: 1.1,
        enterpriseValueToEBITDA: 8.3,
        lastUpdated: '2025-01-01',
        source: 'fintables',
      },
      balance: {
        symbol: 'THYAO',
        equity: 410_500_000_000,
        totalDebt: 320_000_000_000,
        totalAssets: 800_000_000_000,
        sharesOutstanding: 1_200_000_000,
        lastUpdated: '2025-01-01',
        source: 'fintables',
      },
      income: {
        symbol: 'THYAO',
        netProfit: 70_120_000_000,
        lastUpdated: '2025-01-01',
        source: 'fintables',
      },
      sector: {
        symbol: 'THYAO',
        sector: 'Ulaştırma',
        lastUpdated: '2025-01-01',
        source: 'fintables',
      },
    };

    it('should map all fields from full provider inputs', () => {
      const result = mapToFundamentalData(fullInputs);
      expect(result.priceToBook).toBe(1.1);
      expect(result.evToEBITDA).toBe(8.3);
      expect(result.netProfit).toBe(70_120_000_000);
      expect(result.equity).toBe(410_500_000_000);
      expect(result.totalDebt).toBe(320_000_000_000);
      expect(result.totalAssets).toBe(800_000_000_000);
      expect(result.sharesOutstanding).toBe(1_200_000_000);
      expect(result.marketCap).toBe(450_000_000_000);
      expect(result.sector).toBe('Ulaştırma');
      expect(result.companyName).toBe('Türk Hava Yolları');
    });

    it('should use sector from sector provider when available', () => {
      const result = mapToFundamentalData({
        ...fullInputs,
        sector: { symbol: 'THYAO', sector: 'Finans', lastUpdated: '2025-01-01', source: 'fintables' },
      });
      expect(result.sector).toBe('Finans');
    });

    it('should fall back to profile.sector when sector provider is null', () => {
      const result = mapToFundamentalData({
        ...fullInputs,
        sector: null,
      });
      expect(result.sector).toBe('Ulaştırma');
    });

    it('should set all fields to null when all inputs are null', () => {
      const result = mapToFundamentalData({
        profile: null,
        ratios: null,
        balance: null,
        income: null,
        sector: null,
      });
      expect(result.priceToBook).toBeNull();
      expect(result.evToEBITDA).toBeNull();
      expect(result.netProfit).toBeNull();
      expect(result.equity).toBeNull();
      expect(result.totalDebt).toBeNull();
      expect(result.totalAssets).toBeNull();
      expect(result.sharesOutstanding).toBeNull();
      expect(result.marketCap).toBeNull();
      expect(result.sector).toBeNull();
      expect(result.companyName).toBeNull();
    });

    it('should set all fields to null when inputs are undefined', () => {
      const result = mapToFundamentalData({});
      expect(result.priceToBook).toBeNull();
      expect(result.evToEBITDA).toBeNull();
      expect(result.netProfit).toBeNull();
      expect(result.equity).toBeNull();
      expect(result.totalDebt).toBeNull();
      expect(result.totalAssets).toBeNull();
      expect(result.sharesOutstanding).toBeNull();
      expect(result.marketCap).toBeNull();
      expect(result.sector).toBeNull();
      expect(result.companyName).toBeNull();
    });

    it('should handle partial inputs with only ratios', () => {
      const result = mapToFundamentalData({
        ratios: { symbol: 'THYAO', priceToBook: 2.5, enterpriseValueToEBITDA: 10, lastUpdated: '2025-01-01', source: 'fintables' },
      });
      expect(result.priceToBook).toBe(2.5);
      expect(result.evToEBITDA).toBe(10);
      expect(result.netProfit).toBeNull();
      expect(result.equity).toBeNull();
      expect(result.marketCap).toBeNull();
    });

    it('should handle partial inputs with only balance sheet', () => {
      const result = mapToFundamentalData({
        balance: { symbol: 'THYAO', equity: 100, totalDebt: 50, totalAssets: 200, sharesOutstanding: 1000, lastUpdated: '2025-01-01', source: 'fintables' },
      });
      expect(result.equity).toBe(100);
      expect(result.totalDebt).toBe(50);
      expect(result.totalAssets).toBe(200);
      expect(result.sharesOutstanding).toBe(1000);
      expect(result.priceToBook).toBeNull();
    });

    it('should handle null values within non-null objects', () => {
      const result = mapToFundamentalData({
        ratios: { symbol: 'THYAO', priceToBook: null, enterpriseValueToEBITDA: null, lastUpdated: '2025-01-01', source: 'fintables' },
        balance: { symbol: 'THYAO', equity: null, totalDebt: null, totalAssets: null, sharesOutstanding: null, lastUpdated: '2025-01-01', source: 'fintables' },
      });
      expect(result.priceToBook).toBeNull();
      expect(result.evToEBITDA).toBeNull();
      expect(result.equity).toBeNull();
      expect(result.totalDebt).toBeNull();
      expect(result.totalAssets).toBeNull();
      expect(result.sharesOutstanding).toBeNull();
    });
  });

  describe('mapToFinancialData', () => {
    it('should map FundamentalData to FinancialData correctly', () => {
      const fundamentals = {
        priceToBook: 1.1,
        evToEBITDA: 8.3,
        netProfit: 70_120_000_000,
        equity: 410_500_000_000,
        totalDebt: 320_000_000_000,
        totalAssets: 800_000_000_000,
        sharesOutstanding: 1_200_000_000,
        marketCap: 450_000_000_000,
        sector: 'Ulaştırma',
        companyName: 'Türk Hava Yolları',
      };

      const result = mapToFinancialData('THYAO', fundamentals);
      expect(result.symbol).toBe('THYAO');
      expect(result.priceToBook).toBe(1.1);
      expect(result.enterpriseValueToEBITDA).toBe(8.3);
      expect(result.netProfit).toBe(70_120_000_000);
      expect(result.netProfitPrevious).toBeNull();
      expect(result.equity).toBe(410_500_000_000);
      expect(result.equityPrevious).toBeNull();
      expect(result.totalDebt).toBe(320_000_000_000);
      expect(result.totalAssets).toBe(800_000_000_000);
      expect(result.sector).toBe('Ulaştırma');
    });

    it('should use totalAssets from fundamentals when available', () => {
      const fundamentals = {
        priceToBook: 1,
        evToEBITDA: 5,
        netProfit: 100,
        equity: 200,
        totalDebt: 50,
        totalAssets: 500,
        sharesOutstanding: 1000,
        marketCap: 300,
        sector: 'Test',
        companyName: 'Test',
      };

      const result = mapToFinancialData('TEST', fundamentals);
      expect(result.totalAssets).toBe(500);
    });

    it('should fall back to marketCap when totalAssets is null', () => {
      const fundamentals = {
        priceToBook: 1,
        evToEBITDA: 5,
        netProfit: 100,
        equity: 200,
        totalDebt: 50,
        totalAssets: null,
        sharesOutstanding: 1000,
        marketCap: 300,
        sector: 'Test',
        companyName: 'Test',
      };

      const result = mapToFinancialData('TEST', fundamentals);
      expect(result.totalAssets).toBe(300);
    });

    it('should fall back to marketCap when totalAssets is undefined', () => {
      const fundamentals = {
        priceToBook: 1,
        evToEBITDA: 5,
        netProfit: 100,
        equity: 200,
        totalDebt: 50,
        sharesOutstanding: 1000,
        marketCap: 300,
        sector: 'Test',
        companyName: 'Test',
      } as any;

      const result = mapToFinancialData('TEST', fundamentals);
      expect(result.totalAssets).toBe(300);
    });

    it('should preserve null values throughout', () => {
      const fundamentals = {
        priceToBook: null,
        evToEBITDA: null,
        netProfit: null,
        equity: null,
        totalDebt: null,
        totalAssets: null,
        sharesOutstanding: null,
        marketCap: null,
        sector: null,
        companyName: null,
      };

      const result = mapToFinancialData('THYAO', fundamentals);
      expect(result.priceToBook).toBeNull();
      expect(result.enterpriseValueToEBITDA).toBeNull();
      expect(result.netProfit).toBeNull();
      expect(result.netProfitPrevious).toBeNull();
      expect(result.equity).toBeNull();
      expect(result.equityPrevious).toBeNull();
      expect(result.totalDebt).toBeNull();
      expect(result.totalAssets).toBeNull();
      expect(result.sector).toBeNull();
    });

    it('should always set netProfitPrevious and equityPrevious to null', () => {
      const fundamentals = {
        priceToBook: 1,
        evToEBITDA: 5,
        netProfit: 100,
        equity: 200,
        totalDebt: 50,
        totalAssets: 500,
        sharesOutstanding: 1000,
        marketCap: 300,
        sector: 'Test',
        companyName: 'Test',
      };

      const result = mapToFinancialData('TEST', fundamentals);
      expect(result.netProfitPrevious).toBeNull();
      expect(result.equityPrevious).toBeNull();
    });

    it('should map sector correctly', () => {
      const fundamentals = {
        priceToBook: null,
        evToEBITDA: null,
        netProfit: null,
        equity: null,
        totalDebt: null,
        totalAssets: null,
        sharesOutstanding: null,
        marketCap: null,
        sector: 'Bankacılık',
        companyName: 'Test',
      };

      const result = mapToFinancialData('TEST', fundamentals);
      expect(result.sector).toBe('Bankacılık');
    });
  });

  describe('consumer compatibility', () => {
    it('should produce output compatible with FinancialRulesEngine input', () => {
      const fundamentals = {
        priceToBook: 2.5,
        evToEBITDA: 12,
        netProfit: 5_000_000_000,
        equity: 20_000_000_000,
        totalDebt: 10_000_000_000,
        totalAssets: 80_000_000_000,
        sharesOutstanding: 1_000_000_000,
        marketCap: 50_000_000_000,
        sector: 'Transportation',
        companyName: 'Turkish Airlines',
      };

      const result = mapToFinancialData('THYAO', fundamentals);

      expect(typeof result.symbol).toBe('string');
      expect(typeof result.priceToBook).toBe('number');
      expect(typeof result.enterpriseValueToEBITDA).toBe('number');
      expect(typeof result.netProfit).toBe('number');
      expect(result.netProfitPrevious).toBeNull();
      expect(typeof result.equity).toBe('number');
      expect(result.equityPrevious).toBeNull();
      expect(typeof result.totalDebt).toBe('number');
      expect(typeof result.totalAssets).toBe('number');
      expect(typeof result.sector).toBe('string');
    });

    it('should handle BIST tracked symbols', () => {
      const symbols = ['THYAO', 'ASELS', 'GARAN', 'AKBNK', 'EREGL', 'BIMAS', 'KCHOL', 'SAHOL', 'TUPRS', 'ISCTR'];
      for (const symbol of symbols) {
        const fundamentals = {
          priceToBook: 1 + Math.random() * 5,
          evToEBITDA: 5 + Math.random() * 15,
          netProfit: Math.random() * 100_000_000_000,
          equity: Math.random() * 200_000_000_000,
          totalDebt: Math.random() * 100_000_000_000,
          totalAssets: Math.random() * 500_000_000_000,
          sharesOutstanding: Math.random() * 2_000_000_000,
          marketCap: Math.random() * 500_000_000_000,
          sector: 'Test',
          companyName: symbol,
        };

        const result = mapToFinancialData(symbol, fundamentals);
        expect(result.symbol).toBe(symbol);
        expect(result.totalAssets).toBeGreaterThan(0);
      }
    });
  });
});
