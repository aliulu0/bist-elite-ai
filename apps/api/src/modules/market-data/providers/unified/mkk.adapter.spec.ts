import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
import { MKKAdapter } from './mkk.adapter';

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

describe('MKKAdapter', () => {
  let circuitBreaker: CircuitBreakerService;
  let adapter: MKKAdapter;

  const fullConfig = {
    username: 'user',
    password: 'pass',
    senderMember: 'SENDER_MEMBER',
    sender: 'SENDER',
    baseUrl: 'https://api.mkk.com.tr',
    timeout: 5000,
    retries: 0,
  };

  const balanceRows = [
    {
      symbol: 'THYAO',
      stockCode: 'THYAO',
      issuerTitle: 'TÜRK HAVA YOLLARI A.O.',
      partnershipRatio: 15.5,
      nominalValue: 214000000,
      investorName: 'Aydın Doğan',
      investorType: 'REAL',
      residentType: 'DOMESTIC',
      customerType: 'GERCEK',
      totalInvestorCount: 120000,
      freeFloatRatio: 49.2,
    },
    {
      symbol: 'THYAO',
      partnershipRatio: 10.2,
      investorTitle: 'XYZ Yatırım A.Ş.',
      investorType: 'INSTITUTIONAL',
      residentType: 'DOMESTIC',
      customerType: 'KURUMSAL',
    },
    {
      symbol: 'THYAO',
      partnershipRatio: 5.1,
      investorName: 'BlackRock Fund',
      investorType: 'INSTITUTIONAL',
      residentType: 'DOMESTIC',
      customerType: 'FON',
    },
    {
      symbol: 'THYAO',
      partnershipRatio: 3.2,
      investorName: 'Foreign Partner Ltd.',
      investorType: 'REAL',
      residentType: 'FOREIGN',
      customerType: 'GERCEK',
    },
  ];

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService();
    jest.restoreAllMocks();
  });

  describe('credentials', () => {
    it('should return null without credentials', async () => {
      adapter = new MKKAdapter(circuitBreaker, { ...fullConfig, username: '', password: '' });
      await expect(adapter.getOwnershipStructure('THYAO')).resolves.toBeNull();
      await expect(adapter.validateConnection()).resolves.toBe(false);
    });

    it('should use apiKey as token when username/password absent', async () => {
      adapter = new MKKAdapter(circuitBreaker, { ...fullConfig, username: '', password: '', apiKey: 'static-key' });
      mockFetchSequence([{ data: balanceRows }]);

      await expect(adapter.validateConnection()).resolves.toBe(true);
      const structure = await adapter.getOwnershipStructure('THYAO');
      expect(structure).not.toBeNull();
    });
  });

  describe('getOwnershipStructure', () => {
    it('should authenticate and map balance report rows', async () => {
      adapter = new MKKAdapter(circuitBreaker, fullConfig);
      mockFetchSequence([{ accessToken: 'tok-123' }, { data: balanceRows }]);

      const structure = await adapter.getOwnershipStructure('THYAO');
      expect(structure).not.toBeNull();
      expect(structure!.symbol).toBe('THYAO');
      expect(structure!.issuerTitle).toBe('TÜRK HAVA YOLLARI A.O.');
      expect(structure!.totalShareholders).toBe(120000);
      expect(structure!.freeFloatRatio).toBe(49.2);
      expect(structure!.source).toBe('mkk');

      expect(structure!.topShareholders[0].shareholderName).toBe('Aydın Doğan');
      expect(structure!.topShareholders[0].shareRatio).toBe(15.5);
      expect(structure!.topShareholders[0].investorType).toBe('real');
      expect(structure!.topShareholders[1].investorType).toBe('institutional');
      expect(structure!.topShareholders[2].investorType).toBe('fund');
    });

    it('should compute domestic and foreign ratios', async () => {
      adapter = new MKKAdapter(circuitBreaker, fullConfig);
      mockFetchSequence([{ accessToken: 'tok-123' }, { data: balanceRows }]);

      const structure = await adapter.getOwnershipStructure('THYAO');
      expect(structure!.domesticRatio).toBe(30.8);
      expect(structure!.foreignRatio).toBe(3.2);
    });

    it('should cache auth token across calls', async () => {
      adapter = new MKKAdapter(circuitBreaker, fullConfig);
      mockFetchSequence([{ accessToken: 'tok-123' }, { data: balanceRows }, { data: balanceRows }]);

      await adapter.getOwnershipStructure('THYAO');
      await adapter.getOwnershipStructure('THYAO');

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should return null when balance report has no data', async () => {
      adapter = new MKKAdapter(circuitBreaker, fullConfig);
      mockFetchSequence([{ accessToken: 'tok-123' }, { data: [] }]);

      await expect(adapter.getOwnershipStructure('THYAO')).resolves.toBeNull();
    });

    it('should return null when auth fails', async () => {
      adapter = new MKKAdapter(circuitBreaker, fullConfig);
      mockFetchSequence([{ error: 'unauthorized' }]);

      await expect(adapter.getOwnershipStructure('THYAO')).resolves.toBeNull();
    });
  });

  describe('fetchCompany', () => {
    it('should map ownership structure to company', async () => {
      adapter = new MKKAdapter(circuitBreaker, fullConfig);
      mockFetchSequence([{ accessToken: 'tok-123' }, { data: balanceRows }]);

      const company = await adapter.fetchCompany('THYAO');
      expect(company).not.toBeNull();
      expect(company!.name).toBe('TÜRK HAVA YOLLARI A.O.');
      expect(company!.exchange).toBe('BIST');
      expect(company!.source).toBe('mkk');
    });
  });
});
