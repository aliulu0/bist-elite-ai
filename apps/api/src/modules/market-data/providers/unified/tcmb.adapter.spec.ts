import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
import { TCMBAdapter } from './tcmb.adapter';

function evdsResponse(items: Record<string, string | null>[]) {
  return {
    items,
    success: true,
  };
}

function mockFetchSequence(bodies: unknown[]) {
  const mock = jest.fn();
  bodies.forEach((body) => {
    mock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(body),
    });
  });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

describe('TCMBAdapter', () => {
  let circuitBreaker: CircuitBreakerService;
  let adapter: TCMBAdapter;

  const baseConfig = {
    apiKey: 'test-key',
    baseUrl: 'https://evds2.tcmb.gov.tr/service/evds',
    timeout: 5000,
    retries: 1,
  };

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService();
    adapter = new TCMBAdapter(circuitBreaker, baseConfig);
    jest.restoreAllMocks();
  });

  describe('getMacroIndicators', () => {
    it('should return empty when api key is missing', async () => {
      const noKey = new TCMBAdapter(circuitBreaker, { ...baseConfig, apiKey: '' });
      await expect(noKey.getMacroIndicators()).resolves.toEqual([]);
    });

    it('should map EVDS series to macro indicators', async () => {
      const series = [
        {
          Tarih: '01-07-2026',
          'TP.PF.TMPB.04': '45.00',
          'TP.FG.J0': '38.25',
          'TP.DK.USD.S.YTL': '40.1000',
          'TP.DK.EUR.S.YTL': '47.5000',
        },
        {
          Tarih: '01-08-2026',
          'TP.PF.TMPB.04': '42.50',
          'TP.FG.J0': '37.10',
          'TP.DK.USD.S.YTL': '42.5000',
          'TP.DK.EUR.S.YTL': '49.5000',
        },
      ];
      mockFetchSequence([evdsResponse(series)]);

      const indicators = await adapter.getMacroIndicators();

      const policyRate = indicators.find((i) => i.symbol === 'tcmb_policy_rate');
      const inflation = indicators.find((i) => i.symbol === 'inflation');
      const usdtry = indicators.find((i) => i.symbol === 'usdtry');
      const eurusd = indicators.find((i) => i.symbol === 'eurusd');

      expect(policyRate).toBeDefined();
      expect(policyRate!.value).toBe(42.5);
      expect(policyRate!.change).toBe(-2.5);
      expect(policyRate!.source).toBe('tcmb');

      expect(inflation).toBeDefined();
      expect(inflation!.value).toBe(37.1);

      expect(usdtry).toBeDefined();
      expect(usdtry!.value).toBe(42.5);

      expect(eurusd).toBeDefined();
      expect(eurusd!.value).toBeCloseTo(49.5 / 42.5, 4);
    });

    it('should skip missing series values', async () => {
      mockFetchSequence([
        evdsResponse([
          {
            Tarih: '01-08-2026',
            'TP.PF.TMPB.04': '42.50',
            'TP.FG.J0': null,
            'TP.DK.USD.S.YTL': '42.5000',
            'TP.DK.EUR.S.YTL': null,
          },
        ]),
      ]);

      const indicators = await adapter.getMacroIndicators();
      expect(indicators.map((i) => i.symbol)).toEqual(['tcmb_policy_rate', 'usdtry']);
    });

    it('should return empty on EVDS failure', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ items: [], success: false, message: 'Invalid key' }),
      }) as unknown as typeof fetch;

      await expect(adapter.getMacroIndicators()).resolves.toEqual([]);
    });
  });

  describe('getExchangeRates', () => {
    it('should return USD and EUR rows per date', async () => {
      const series = [
        {
          Tarih: '01-08-2026',
          'TP.DK.USD.S.YTL': '42.5000',
          'TP.DK.EUR.S.YTL': '49.5000',
        },
      ];
      mockFetchSequence([evdsResponse(series)]);

      const rates = await adapter.getExchangeRates();
      expect(rates).toHaveLength(2);
      expect(rates[0]).toEqual({ currency: 'USD', rate: 42.5, date: expect.any(String) });
      expect(rates[1]).toEqual({ currency: 'EUR', rate: 49.5, date: expect.any(String) });
    });
  });

  describe('getMonetaryPolicyData', () => {
    it('should return latest policy rate', async () => {
      mockFetchSequence([
        evdsResponse([
          { Tarih: '01-07-2026', 'TP.PF.TMPB.04': '45.00' },
          { Tarih: '01-08-2026', 'TP.PF.TMPB.04': '42.50' },
        ]),
      ]);

      const data = await adapter.getMonetaryPolicyData();
      expect(data).not.toBeNull();
      expect(data!.policyRate).toBe(42.5);
    });

    it('should return null when no data', async () => {
      mockFetchSequence([evdsResponse([])]);
      await expect(adapter.getMonetaryPolicyData()).resolves.toBeNull();
    });
  });

  describe('getInterestDecisionDates', () => {
    it('should compute rate changes between consecutive decisions', async () => {
      mockFetchSequence([
        evdsResponse([
          { Tarih: '01-06-2026', 'TP.PF.TMPB.04': '45.00' },
          { Tarih: '01-07-2026', 'TP.PF.TMPB.04': '45.00' },
          { Tarih: '01-08-2026', 'TP.PF.TMPB.04': '42.50' },
        ]),
      ]);

      const decisions = await adapter.getInterestDecisionDates();
      const july = decisions.find((d) => d.date.includes('2026-07'));
      const aug = decisions.find((d) => d.date.includes('2026-08'));

      expect(july!.change).toBe(0);
      expect(aug!.change).toBe(-2.5);
    });
  });

  describe('helpers', () => {
    it('should parse Turkish EVDS dates', async () => {
      mockFetchSequence([
        evdsResponse([
          { Tarih: '01-08-2026', 'TP.PF.TMPB.04': '42.50' },
        ]),
      ]);
      const indicators = await adapter.getMacroIndicators();
      expect(indicators[0].timestamp).toContain('2026-08-01');
    });
  });
});
