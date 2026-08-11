import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MarketDataController } from './market-data.controller';
import { MarketDataOrchestrator } from './orchestrator/market-data-orchestrator';
import { IncrementalMarketDataService } from './incremental/incremental-market-data.service';
import { LatestPriceIncrementalService } from './incremental/latest-price-incremental.service';
import { MarketDataHealthService } from './health/market-data-health.service';
import { CoverageReportService } from './coverage/coverage-report.service';
import { MarketDataPoint } from './interfaces';

const mockDataPoint: MarketDataPoint = {
  symbol: 'THYAO.IS',
  timeframe: '1d',
  open: 100,
  high: 110,
  low: 95,
  close: 105,
  volume: 1000000,
  timestamp: '2025-01-15T00:00:00.000Z',
  validationStatus: 'valid',
};

const mockOrchestrator = {
  getProviderDashboard: jest.fn().mockReturnValue([]),
  getProviderConfiguration: jest.fn().mockReturnValue([]),
  getTimeframeStatusReport: jest.fn().mockReturnValue([]),
  fetchLatestPrice: jest.fn(),
  fetchHistoricalData: jest.fn(),
  getSupportedTimeframes: jest.fn().mockReturnValue(['4h', '1d', '1w', '1m', '3m', '6m']),
  getAvailableProviders: jest.fn().mockReturnValue(['fintables', 'yahoo']),
  getProviderHealth: jest.fn().mockResolvedValue({ fintables: true, yahoo: true }),
};

const mockIncrementalService = {
  fetchHistoricalData: jest.fn(),
};

const mockLatestPriceIncrementalService = {
  getLatestPriceIncremental: jest.fn(),
  getFreshnessMessage: jest.fn().mockReturnValue('Veri güncel.'),
};

const mockHealthService = {
  getHealthReport: jest.fn(),
};

const mockCoverageService = {
  generate: jest.fn(),
};

describe('MarketDataController', () => {
  let controller: MarketDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketDataController],
      providers: [
        { provide: MarketDataOrchestrator, useValue: mockOrchestrator },
        { provide: IncrementalMarketDataService, useValue: mockIncrementalService },
        { provide: LatestPriceIncrementalService, useValue: mockLatestPriceIncrementalService },
        { provide: MarketDataHealthService, useValue: mockHealthService },
        { provide: CoverageReportService, useValue: mockCoverageService },
      ],
    }).compile();

    controller = module.get(MarketDataController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLatestPrice', () => {
    it('should return latest price for valid symbol', async () => {
      mockOrchestrator.fetchLatestPrice.mockResolvedValue({
        data: mockDataPoint,
        provider: 'yahoo',
        cached: false,
        timestamp: new Date().toISOString(),
      });
      const result = await controller.getLatestPrice('THYAO.IS');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDataPoint);
      expect(result.timestamp).toBeDefined();
    });

    it('should uppercase symbol', async () => {
      mockOrchestrator.fetchLatestPrice.mockResolvedValue({
        data: mockDataPoint,
        provider: 'yahoo',
        cached: false,
        timestamp: new Date().toISOString(),
      });
      await controller.getLatestPrice('thyao.is');
      expect(mockOrchestrator.fetchLatestPrice).toHaveBeenCalledWith('THYAO.IS');
    });

    it('should throw BadRequestException for empty symbol', async () => {
      await expect(controller.getLatestPrice('')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace symbol', async () => {
      await expect(controller.getLatestPrice('   ')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no data found', async () => {
      mockOrchestrator.fetchLatestPrice.mockResolvedValue(null);
      await expect(controller.getLatestPrice('NONEXISTENT')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when provider returns null data', async () => {
      mockOrchestrator.fetchLatestPrice.mockResolvedValue({
        data: null,
        provider: 'yahoo',
        cached: false,
        timestamp: new Date().toISOString(),
      });
      await expect(controller.getLatestPrice('NONEXISTENT')).rejects.toThrow(NotFoundException);
    });

    it('should throw ServiceUnavailableException when no provider', async () => {
      mockOrchestrator.getAvailableProviders.mockReturnValueOnce([]);
      await expect(controller.getLatestPrice('THYAO.IS')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should use incremental latest price when timeframe is provided', async () => {
      mockLatestPriceIncrementalService.getLatestPriceIncremental.mockResolvedValue({
        symbol: 'THYAO.IS',
        timeframe: '1d',
        price: 105,
        previousPrice: 100,
        change: 5,
        changePercent: 5,
        timestamp: '2025-01-15T00:00:00.000Z',
        provider: 'yahoo',
        sourceTimeframe: '1d',
        dataFreshness: 'fresh',
        lastSuccessfulUpdate: '2025-01-15T12:00:00.000Z',
      });
      const result = await controller.getLatestPrice('THYAO.IS', '1d');
      expect(mockLatestPriceIncrementalService.getLatestPriceIncremental).toHaveBeenCalledWith(
        'THYAO.IS',
        '1d',
      );
      expect(result.success).toBe(true);
      expect(result.price).toBe(105);
      expect(result.changePercent).toBe(5);
      expect(result.dataFreshness).toBe('fresh');
      expect(result.data?.close).toBe(105);
    });

    it('should throw BadRequestException for unsupported timeframe', async () => {
      await expect(controller.getLatestPrice('THYAO.IS', '2d')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when incremental latest price has no data', async () => {
      mockLatestPriceIncrementalService.getLatestPriceIncremental.mockResolvedValue(null);
      await expect(controller.getLatestPrice('THYAO.IS', '1d')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getHistory', () => {
    it('should return historical data', async () => {
      mockIncrementalService.fetchHistoricalData.mockResolvedValue({
        data: [mockDataPoint],
        provider: 'yahoo',
        cached: false,
        timestamp: new Date().toISOString(),
        incremental: {
          cacheHit: false,
          incrementalUpdate: false,
          providerUsed: 'yahoo',
          previousBarCount: 0,
          newBarCount: 1,
          mergedBarCount: 1,
          lastCachedTimestamp: null,
          latestTimestamp: '2025-01-15T00:00:00.000Z',
          dataFreshness: 'fresh',
          validationStatus: 'validated',
        },
      });
      const result = await controller.getHistory('THYAO.IS', {
        timeframe: '1d',
        from: '2025-01-01',
        to: '2025-06-01',
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.provider).toBe('yahoo');
      expect(result.cached).toBe(false);
      expect(result.incremental?.newBarCount).toBe(1);
    });

    it('should pass fetch options to incremental service', async () => {
      mockIncrementalService.fetchHistoricalData.mockResolvedValue({
        data: [],
        provider: 'yahoo',
        cached: false,
        timestamp: new Date().toISOString(),
      });
      await controller.getHistory('THYAO.IS', {
        timeframe: '1w',
        from: '2025-01-01',
        to: '2025-06-01',
      });
      expect(mockIncrementalService.fetchHistoricalData).toHaveBeenCalledWith('THYAO.IS', '1w', {
        startDate: '2025-01-01',
        endDate: '2025-06-01',
      });
    });

    it('should throw BadRequestException for empty symbol', async () => {
      await expect(controller.getHistory('', { timeframe: '1d' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for unsupported timeframe', async () => {
      await expect(controller.getHistory('THYAO.IS', { timeframe: '2d' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ServiceUnavailableException when no provider', async () => {
      mockOrchestrator.getAvailableProviders.mockReturnValueOnce([]);
      await expect(controller.getHistory('THYAO.IS', { timeframe: '1d' })).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should handle missing optional date params', async () => {
      mockIncrementalService.fetchHistoricalData.mockResolvedValue({
        data: [mockDataPoint],
        provider: 'yahoo',
        cached: false,
        timestamp: new Date().toISOString(),
      });
      const result = await controller.getHistory('THYAO.IS', { timeframe: '1d' });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockIncrementalService.fetchHistoricalData).toHaveBeenCalledWith('THYAO.IS', '1d', {
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should return empty data when incremental service returns null', async () => {
      mockIncrementalService.fetchHistoricalData.mockResolvedValue(null);
      const result = await controller.getHistory('THYAO.IS', { timeframe: '1d' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getTimeframes', () => {
    it('should return supported timeframes', () => {
      const result = controller.getTimeframes();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(['4h', '1d', '1w', '1m', '3m', '6m']);
      expect(result.timestamp).toBeDefined();
    });

    it('should include per-timeframe status details', () => {
      mockOrchestrator.getTimeframeStatusReport.mockReturnValue([
        {
          timeframe: '4h',
          status: 'DERIVED',
          predictionTarget: '4h',
          providers: ['yahoo'],
          sourceTimeframe: '4h',
        },
      ]);
      const result = controller.getTimeframes();
      expect(result.details).toHaveLength(1);
      expect(result.details![0].status).toBe('DERIVED');
    });
  });

  describe('getProviders', () => {
    it('should return provider statuses', async () => {
      const result = await controller.getProviders();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ name: 'fintables', healthy: true }, { name: 'yahoo', healthy: true }]);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle multiple providers', async () => {
      mockOrchestrator.getProviderHealth.mockResolvedValue({
        fintables: true,
        yahoo: false,
      });
      const result = await controller.getProviders();
      expect(result.data).toHaveLength(2);
      expect(result.data).toContainEqual({ name: 'yahoo', healthy: false });
    });
  });

  describe('getProviderDashboard', () => {
    it('should return dashboard entries with timestamp', () => {
      mockOrchestrator.getProviderDashboard.mockReturnValue([
        {
          name: 'yahoo',
          enabled: true,
          priority: 4,
          status: 'healthy',
          circuitState: 'CLOSED',
          latencyMs: 10,
          totalRequests: 1,
          successfulRequests: 1,
          failedRequests: 0,
          lastSync: null,
          authConfigured: true,
          cacheEntries: 0,
          coverage: 0,
        },
      ]);
      const result = controller.getProviderDashboard();
      expect(result).toHaveLength(1);
      expect(result[0].timestamp).toBeDefined();
      expect(result[0].name).toBe('yahoo');
    });
  });

  describe('getProviderConfiguration', () => {
    it('should return provider configuration entries with timestamp', () => {
      mockOrchestrator.getProviderConfiguration.mockReturnValue([
        {
          name: 'finnhub',
          enabled: true,
          configured: false,
          authenticated: false,
          priority: 10,
          timeoutMs: 15000,
          retries: 3,
          baseUrlHost: 'finnhub.io',
          public: false,
        },
      ]);
      const result = controller.getProviderConfiguration();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('finnhub');
      expect(result.data[0]).not.toHaveProperty('apiKey');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getHealth', () => {
    it('should delegate to health service', () => {
      const report = {
        overall: 'HEALTHY' as const,
        providers: [],
        generatedAt: new Date().toISOString(),
      };
      mockHealthService.getHealthReport.mockReturnValue(report);
      const result = controller.getHealth();
      expect(result).toEqual(report);
      expect(mockHealthService.getHealthReport).toHaveBeenCalled();
    });
  });

  describe('getCoverage', () => {
    it('should delegate to coverage service', () => {
      const report = { generatedAt: new Date().toISOString() };
      mockCoverageService.generate.mockReturnValue(report);
      const result = controller.getCoverage();
      expect(result).toEqual(report);
      expect(mockCoverageService.generate).toHaveBeenCalled();
    });
  });
});
