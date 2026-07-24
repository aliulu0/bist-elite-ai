import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MarketDataProviderRegistry } from './market-data.provider-registry';
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

const mockMarketDataService = {
  fetchLatest: jest.fn(),
  fetchData: jest.fn(),
  getSupportedTimeframes: jest.fn().mockReturnValue(['4h', '1d', '1w', '1m', '3m', '6m']),
  isTimeframeSupported: jest
    .fn()
    .mockImplementation((tf: string) => ['4h', '1d', '1w', '1m', '3m', '6m'].includes(tf)),
  healthCheck: jest.fn().mockResolvedValue({ 'yahoo-finance': true }),
  getAvailableProviders: jest.fn().mockReturnValue(['yahoo-finance']),
};

const mockRegistry = {
  getActiveProvider: jest.fn().mockResolvedValue({ name: 'yahoo-finance' }),
  healthCheck: jest.fn().mockResolvedValue({ 'yahoo-finance': true }),
};

describe('MarketDataController', () => {
  let controller: MarketDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketDataController],
      providers: [
        { provide: MarketDataService, useValue: mockMarketDataService },
        { provide: MarketDataProviderRegistry, useValue: mockRegistry },
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
      mockMarketDataService.fetchLatest.mockResolvedValue(mockDataPoint);
      const result = await controller.getLatestPrice('THYAO.IS');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDataPoint);
      expect(result.timestamp).toBeDefined();
    });

    it('should uppercase symbol', async () => {
      mockMarketDataService.fetchLatest.mockResolvedValue(mockDataPoint);
      await controller.getLatestPrice('thyao.is');
      expect(mockMarketDataService.fetchLatest).toHaveBeenCalledWith('THYAO.IS');
    });

    it('should throw BadRequestException for empty symbol', async () => {
      await expect(controller.getLatestPrice('')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace symbol', async () => {
      await expect(controller.getLatestPrice('   ')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no data found', async () => {
      mockMarketDataService.fetchLatest.mockResolvedValue(null);
      await expect(controller.getLatestPrice('NONEXISTENT')).rejects.toThrow(NotFoundException);
    });

    it('should throw ServiceUnavailableException when no provider', async () => {
      mockRegistry.getActiveProvider.mockResolvedValueOnce(null);
      await expect(controller.getLatestPrice('THYAO.IS')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('getHistory', () => {
    it('should return historical data', async () => {
      mockMarketDataService.fetchData.mockResolvedValue([mockDataPoint]);
      const result = await controller.getHistory('THYAO.IS', {
        timeframe: '1d',
        from: '2025-01-01',
        to: '2025-06-01',
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should pass fetch options to service', async () => {
      mockMarketDataService.fetchData.mockResolvedValue([]);
      await controller.getHistory('THYAO.IS', {
        timeframe: '1w',
        from: '2025-01-01',
        to: '2025-06-01',
      });
      expect(mockMarketDataService.fetchData).toHaveBeenCalledWith('THYAO.IS', '1w', {
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
      mockMarketDataService.isTimeframeSupported.mockReturnValueOnce(false);
      await expect(controller.getHistory('THYAO.IS', { timeframe: '2d' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ServiceUnavailableException when no provider', async () => {
      mockRegistry.getActiveProvider.mockResolvedValueOnce(null);
      await expect(controller.getHistory('THYAO.IS', { timeframe: '1d' })).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should handle missing optional date params', async () => {
      mockMarketDataService.fetchData.mockResolvedValue([mockDataPoint]);
      const result = await controller.getHistory('THYAO.IS', { timeframe: '1d' });
      expect(result.success).toBe(true);
      expect(mockMarketDataService.fetchData).toHaveBeenCalledWith('THYAO.IS', '1d', {
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  describe('getTimeframes', () => {
    it('should return supported timeframes', () => {
      const result = controller.getTimeframes();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(['4h', '1d', '1w', '1m', '3m', '6m']);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getProviders', () => {
    it('should return provider statuses', async () => {
      const result = await controller.getProviders();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ name: 'yahoo-finance', healthy: true }]);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle multiple providers', async () => {
      mockMarketDataService.healthCheck.mockResolvedValue({
        'yahoo-finance': true,
        fintables: false,
      });
      const result = await controller.getProviders();
      expect(result.data).toHaveLength(2);
    });
  });
});
