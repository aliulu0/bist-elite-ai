import { Test, TestingModule } from '@nestjs/testing';
import { FintablesProvider } from './fintables.provider';

const mockCompanyResponse = {
  data: {
    symbol: 'THYAO',
    company_name: 'Türk Hava Yolları',
    sector: 'Ulaştırma',
    market_cap: 450000000000,
  },
  error: undefined,
};

const mockRatiosResponse = {
  data: {
    symbol: 'THYAO',
    price_to_book: 2.5,
    ev_to_ebitda: 8.3,
  },
  error: undefined,
};

const mockBalanceSheetResponse = {
  data: {
    symbol: 'THYAO',
    equity: 180000000000,
    total_debt: 95000000000,
    shares_outstanding: 1200000000,
  },
  error: undefined,
};

const mockIncomeResponse = {
  data: {
    symbol: 'THYAO',
    net_profit: 32000000000,
  },
  error: undefined,
};

const mockSectorResponse = {
  data: {
    symbol: 'THYAO',
    sector: 'Ulaştırma',
  },
  error: undefined,
};

const mockErrorResponse = {
  data: null,
  error: 'Not found',
};

describe('FintablesProvider', () => {
  let provider: FintablesProvider;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FintablesProvider],
    }).compile();

    provider = module.get(FintablesProvider);
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('fintables');
  });

  describe('validateConnection', () => {
    it('should return true when Fintables is reachable', async () => {
      fetchSpy.mockResolvedValue({ ok: true } as Response);
      const result = await provider.validateConnection();
      expect(result).toBe(true);
    });

    it('should return false when Fintables returns error', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 500 } as Response);
      const result = await provider.validateConnection();
      expect(result).toBe(false);
    });

    it('should return false on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await provider.validateConnection();
      expect(result).toBe(false);
    });
  });

  describe('getCompanyProfile', () => {
    it('should return normalized company profile', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockCompanyResponse,
      } as Response);

      const result = await provider.getCompanyProfile('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.companyName).toBe('Türk Hava Yolları');
      expect(result!.sector).toBe('Ulaştırma');
      expect(result!.marketCap).toBe(450000000000);
      expect(result!.source).toBe('fintables');
      expect(result!.lastUpdated).toBeDefined();
    });

    it('should return null on API error', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await provider.getCompanyProfile('INVALID');
      expect(result).toBeNull();
    });

    it('should return null when data is null', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await provider.getCompanyProfile('INVALID');
      expect(result).toBeNull();
    });

    it('should return null on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await provider.getCompanyProfile('THYAO');
      expect(result).toBeNull();
    });

    it('should handle null market_cap', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { ...mockCompanyResponse.data, market_cap: null },
        }),
      } as Response);

      const result = await provider.getCompanyProfile('THYAO');
      expect(result!.marketCap).toBe(0);
    });
  });

  describe('getFinancialRatios', () => {
    it('should return normalized financial ratios', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockRatiosResponse,
      } as Response);

      const result = await provider.getFinancialRatios('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.priceToBook).toBe(2.5);
      expect(result!.enterpriseValueToEBITDA).toBe(8.3);
      expect(result!.source).toBe('fintables');
    });

    it('should return null on API error', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await provider.getFinancialRatios('INVALID');
      expect(result).toBeNull();
    });

    it('should return null when data is null', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await provider.getFinancialRatios('INVALID');
      expect(result).toBeNull();
    });

    it('should handle null ratio values', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { symbol: 'THYAO', price_to_book: null, ev_to_ebitda: null },
        }),
      } as Response);

      const result = await provider.getFinancialRatios('THYAO');
      expect(result!.priceToBook).toBeNull();
      expect(result!.enterpriseValueToEBITDA).toBeNull();
    });
  });

  describe('getBalanceSheet', () => {
    it('should return normalized balance sheet', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockBalanceSheetResponse,
      } as Response);

      const result = await provider.getBalanceSheet('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.equity).toBe(180000000000);
      expect(result!.totalDebt).toBe(95000000000);
      expect(result!.sharesOutstanding).toBe(1200000000);
      expect(result!.source).toBe('fintables');
    });

    it('should return null on API error', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await provider.getBalanceSheet('INVALID');
      expect(result).toBeNull();
    });

    it('should return null when data is null', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await provider.getBalanceSheet('INVALID');
      expect(result).toBeNull();
    });

    it('should handle null financial values', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { symbol: 'THYAO', equity: null, total_debt: null, shares_outstanding: null },
        }),
      } as Response);

      const result = await provider.getBalanceSheet('THYAO');
      expect(result!.equity).toBeNull();
      expect(result!.totalDebt).toBeNull();
      expect(result!.sharesOutstanding).toBeNull();
    });
  });

  describe('getIncomeStatement', () => {
    it('should return normalized income statement', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockIncomeResponse,
      } as Response);

      const result = await provider.getIncomeStatement('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.netProfit).toBe(32000000000);
      expect(result!.source).toBe('fintables');
    });

    it('should return null on API error', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await provider.getIncomeStatement('INVALID');
      expect(result).toBeNull();
    });

    it('should return null when data is null', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await provider.getIncomeStatement('INVALID');
      expect(result).toBeNull();
    });

    it('should handle null net_profit', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { symbol: 'THYAO', net_profit: null },
        }),
      } as Response);

      const result = await provider.getIncomeStatement('THYAO');
      expect(result!.netProfit).toBeNull();
    });
  });

  describe('getSector', () => {
    it('should return normalized sector data', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockSectorResponse,
      } as Response);

      const result = await provider.getSector('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.sector).toBe('Ulaştırma');
      expect(result!.source).toBe('fintables');
    });

    it('should return null on API error', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await provider.getSector('INVALID');
      expect(result).toBeNull();
    });

    it('should return null when data is null', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await provider.getSector('INVALID');
      expect(result).toBeNull();
    });

    it('should return null on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await provider.getSector('THYAO');
      expect(result).toBeNull();
    });
  });
});
