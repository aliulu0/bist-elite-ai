import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
import { KAPAdapter } from './kap.adapter';

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

describe('KAPAdapter', () => {
  let circuitBreaker: CircuitBreakerService;
  let adapter: KAPAdapter;

  const baseConfig = {
    apiKey: 'test-key',
    baseUrl: 'https://www.kap.org.tr/tr/api',
    timeout: 5000,
    retries: 0,
  };

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService();
    adapter = new KAPAdapter(circuitBreaker, baseConfig);
    jest.restoreAllMocks();
  });

  describe('validateConnection', () => {
    it('should return true when member lookup succeeds', async () => {
      mockFetchSequence([{ companyCode: 'THYAO' }]);
      await expect(adapter.validateConnection()).resolves.toBe(true);
    });

    it('should return false on fetch failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;
      await expect(adapter.validateConnection()).resolves.toBe(false);
    });
  });

  describe('fetchCompany', () => {
    it('should map member lookup to company', async () => {
      mockFetchSequence([{ companyCode: 'THYAO', title: 'TÜRK HAVA YOLLARI A.O.', mkkMemberOid: '123' }]);

      const company = await adapter.fetchCompany('THYAO');
      expect(company).not.toBeNull();
      expect(company!.name).toBe('TÜRK HAVA YOLLARI A.O.');
      expect(company!.symbol).toBe('THYAO');
      expect(company!.exchange).toBe('BIST');
      expect(company!.currency).toBe('TRY');
      expect(company!.source).toBe('kap');
    });

    it('should return null when member has no title', async () => {
      mockFetchSequence([{ companyCode: 'XXX' }]);
      await expect(adapter.fetchCompany('XXX')).resolves.toBeNull();
    });
  });

  describe('fetchSector', () => {
    it('should resolve sector from company items', async () => {
      mockFetchSequence([
        [
          {
            kapMemberOid: '1',
            stockCode: 'THYAO',
            sector: 'Ulaştırma',
            industryGroup: 'Hava Taşımacılığı',
            subSector: 'Havayolu',
          },
          { kapMemberOid: '2', stockCode: 'ASELS', sector: 'Teknoloji' },
        ],
      ]);

      const sector = await adapter.fetchSector('thyao');
      expect(sector).not.toBeNull();
      expect(sector!.sector).toBe('Ulaştırma');
      expect(sector!.subSector).toBe('Havayolu');
      expect(sector!.source).toBe('kap');
    });

    it('should fall back to industryGroup when sector missing', async () => {
      mockFetchSequence([
        [{ stockCode: 'ASELS', industryGroup: 'Elektronik', subSector: null }],
      ]);

      const sector = await adapter.fetchSector('ASELS');
      expect(sector!.sector).toBe('Elektronik');
    });

    it('should return null when symbol not in list', async () => {
      mockFetchSequence([[{ stockCode: 'THYAO' }]]);
      await expect(adapter.fetchSector('GARAN')).resolves.toBeNull();
    });
  });

  describe('fetchDisclosures', () => {
    it('should filter disclosures by symbol and map fields', async () => {
      mockFetchSequence([
        { companyCode: 'THYAO', title: 'TÜRK HAVA YOLLARI A.O.', mkkMemberOid: '123' },
        [
          {
            publishDate: '15.07.2026 09:30:00',
            subject: 'Finansal Rapor',
            summary: '2026/2 Dönemi Finansal Rapor',
            disclosureCategory: 'finansal-rapor',
            disclosureIndex: 12345,
            relatedStocks: 'THYAO',
          },
          {
            publishDate: '10.07.2026 08:00:00',
            subject: 'Pay Geri Alımı',
            relatedStocks: 'GARAN',
            disclosureIndex: 12000,
          },
        ],
      ]);

      const disclosures = await adapter.fetchDisclosures('THYAO');
      expect(disclosures).toHaveLength(1);
      expect(disclosures[0].title).toBe('Finansal Rapor');
      expect(disclosures[0].category).toBe('finansal-rapor');
      expect(disclosures[0].url).toBe('https://www.kap.org.tr/tr/Bildirim/12345');
      expect(disclosures[0].source).toBe('kap');
    });

    it('should return empty array when no disclosures', async () => {
      mockFetchSequence([{ companyCode: 'THYAO', mkkMemberOid: '123' }, []]);
      await expect(adapter.fetchDisclosures('THYAO')).resolves.toEqual([]);
    });

    it('should parse Turkish publication dates', async () => {
      mockFetchSequence([
        { companyCode: 'THYAO', mkkMemberOid: '123' },
        [
          {
            publishDate: '15.07.2026 09:30:00',
            subject: 'Genel Kurul',
            relatedStocks: 'THYAO',
            disclosureIndex: 999,
          },
        ],
      ]);

      const disclosures = await adapter.fetchDisclosures('THYAO');
      expect(disclosures[0].date).toContain('2026-07-15');
    });
  });

  describe('getCompanyProfile', () => {
    it('should map company to profile', async () => {
      mockFetchSequence([{ companyCode: 'THYAO', title: 'TÜRK HAVA YOLLARI A.O.' }]);

      const profile = await adapter.getCompanyProfile('THYAO');
      expect(profile).not.toBeNull();
      expect(profile!.companyName).toBe('TÜRK HAVA YOLLARI A.O.');
      expect(profile!.source).toBe('kap');
    });
  });
});
