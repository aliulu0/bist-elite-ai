import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataService, DATA_PROVIDER } from './market-data.service';
import { MarketDataValidationService } from './market-data-validation.service';
import { MarketDataProviderRegistry } from './market-data.provider-registry';
import { MarketDataOrchestrator } from './orchestrator/market-data-orchestrator';
import { IDataProvider, MarketDataPoint } from './interfaces';

const mockProvider: IDataProvider = {
  name: 'mock-provider',
  getHistoricalData: jest.fn().mockResolvedValue([
    {
      symbol: 'THYAO',
      timeframe: '1d',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 1000000,
      timestamp: '2025-01-15T00:00:00Z',
      validationStatus: 'valid',
    } as MarketDataPoint,
  ]),
  getLatestPrice: jest.fn().mockResolvedValue({
    symbol: 'THYAO',
    timeframe: '1d',
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1000000,
    timestamp: '2025-01-15T00:00:00Z',
    validationStatus: 'valid',
  } as MarketDataPoint),
  getAvailableTimeframes: jest.fn().mockReturnValue(['1d', '1w', '1m']),
  validateConnection: jest.fn().mockResolvedValue(true),
};

describe('MarketDataService', () => {
  let service: MarketDataService;
  let registry: MarketDataProviderRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataValidationService,
        MarketDataProviderRegistry,
        MarketDataService,
        { provide: DATA_PROVIDER, useValue: mockProvider },
      ],
    }).compile();

    service = module.get(MarketDataService);
    registry = module.get(MarketDataProviderRegistry);
    registry.register(mockProvider);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchData', () => {
    it('should fetch and validate data through provider', async () => {
      const result = await service.fetchData('THYAO', '1d');
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('THYAO');
      expect(result[0].validationStatus).toBe('valid');
      expect(mockProvider.getHistoricalData).toHaveBeenCalledWith('THYAO', '1d', undefined);
    });

    it('should pass options to provider', async () => {
      await service.fetchData('THYAO', '1d', { startDate: '2025-01-01', limit: 10 });
      expect(mockProvider.getHistoricalData).toHaveBeenCalledWith('THYAO', '1d', {
        startDate: '2025-01-01',
        limit: 10,
      });
    });

    it('should return empty array on provider error', async () => {
      (mockProvider.getHistoricalData as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );
      const result = await service.fetchData('THYAO', '1d');
      expect(result).toEqual([]);
    });

    it('should return empty array when no provider available', async () => {
      const module = await Test.createTestingModule({
        providers: [MarketDataValidationService, MarketDataProviderRegistry, MarketDataService],
      }).compile();
      const svc = module.get(MarketDataService);
      const result = await svc.fetchData('THYAO', '1d');
      expect(result).toEqual([]);
    });
  });

  describe('fetchLatest', () => {
    it('should fetch and validate latest price', async () => {
      const result = await service.fetchLatest('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(mockProvider.getLatestPrice).toHaveBeenCalledWith('THYAO');
    });

    it('should return null on provider error', async () => {
      (mockProvider.getLatestPrice as jest.Mock).mockRejectedValueOnce(new Error('Timeout'));
      const result = await service.fetchLatest('THYAO');
      expect(result).toBeNull();
    });

    it('should return null when provider returns null', async () => {
      (mockProvider.getLatestPrice as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.fetchLatest('NONEXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('getSupportedTimeframes', () => {
    it('should return all supported timeframes', () => {
      const timeframes = service.getSupportedTimeframes();
      expect(timeframes).toEqual(['4h', '1d', '1w', '1m', '3m', '6m']);
    });
  });

  describe('isTimeframeSupported', () => {
    it('should return true for supported timeframes', () => {
      expect(service.isTimeframeSupported('1d')).toBe(true);
      expect(service.isTimeframeSupported('3m')).toBe(true);
      expect(service.isTimeframeSupported('6m')).toBe(true);
    });

    it('should return false for unsupported timeframes', () => {
      expect(service.isTimeframeSupported('2d')).toBe(false);
      expect(service.isTimeframeSupported('invalid')).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return health status of all providers', async () => {
      const health = await service.healthCheck();
      expect(health).toEqual({ 'mock-provider': true });
    });
  });

  describe('getAvailableProviders', () => {
    it('should return registered provider names', () => {
      const providers = service.getAvailableProviders();
      expect(providers).toContain('mock-provider');
    });
  });

  describe('orchestrator delegation', () => {
    it('should delegate fetchData to the orchestrator when present', async () => {
      const point = {
        symbol: 'THYAO',
        timeframe: '1d',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1000000,
        timestamp: '2025-01-15T00:00:00Z',
        validationStatus: 'valid',
      } as MarketDataPoint;
      const orchestrator = {
        fetchHistoricalData: jest.fn().mockResolvedValue({
          data: [point],
          provider: 'finnhub',
          cached: false,
          timestamp: new Date().toISOString(),
        }),
        fetchLatestPrice: jest.fn(),
      };

      const module = await Test.createTestingModule({
        providers: [
          MarketDataValidationService,
          MarketDataProviderRegistry,
          MarketDataService,
          { provide: MarketDataOrchestrator, useValue: orchestrator },
        ],
      }).compile();

      const svc = module.get(MarketDataService);
      const result = await svc.fetchData('THYAO', '1d');

      expect(orchestrator.fetchHistoricalData).toHaveBeenCalledWith('THYAO', '1d', undefined);
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('THYAO');
    });

    it('should delegate fetchLatest to the orchestrator when present', async () => {
      const orchestrator = {
        fetchHistoricalData: jest.fn(),
        fetchLatestPrice: jest.fn().mockResolvedValue(null),
      };

      const module = await Test.createTestingModule({
        providers: [
          MarketDataValidationService,
          MarketDataProviderRegistry,
          MarketDataService,
          { provide: MarketDataOrchestrator, useValue: orchestrator },
        ],
      }).compile();

      const svc = module.get(MarketDataService);
      const result = await svc.fetchLatest('THYAO');

      expect(orchestrator.fetchLatestPrice).toHaveBeenCalledWith('THYAO');
      expect(result).toBeNull();
    });
  });
});
