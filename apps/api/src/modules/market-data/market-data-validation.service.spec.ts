import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataValidationService } from './market-data-validation.service';
import { MarketDataPoint } from './interfaces';

describe('MarketDataValidationService', () => {
  let service: MarketDataValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketDataValidationService],
    }).compile();

    service = module.get(MarketDataValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateDataPoint', () => {
    const validPoint: MarketDataPoint = {
      symbol: 'THYAO',
      timeframe: '1d',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 1000000,
      timestamp: '2025-01-15T00:00:00Z',
      validationStatus: 'valid',
    };

    it('should return valid for correct data', () => {
      const result = service.validateDataPoint(validPoint);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing symbol', () => {
      const result = service.validateDataPoint({ ...validPoint, symbol: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual('symbol is required and must be a string');
    });

    it('should reject non-numeric OHLC', () => {
      const result = service.validateDataPoint({ ...validPoint, open: NaN });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('open'))).toBe(true);
    });

    it('should reject infinite OHLC values', () => {
      const result = service.validateDataPoint({ ...validPoint, close: Infinity });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('close'))).toBe(true);
    });

    it('should reject infinite volume', () => {
      const result = service.validateDataPoint({ ...validPoint, volume: -Infinity });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('volume'))).toBe(true);
    });

    it('should reject high < low', () => {
      const result = service.validateDataPoint({ ...validPoint, high: 90, low: 100 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual('high must be >= low');
    });

    it('should reject high < open', () => {
      const result = service.validateDataPoint({ ...validPoint, high: 90, open: 100 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual('high must be >= open');
    });

    it('should reject high < close', () => {
      const result = service.validateDataPoint({ ...validPoint, high: 90, close: 100 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual('high must be >= close');
    });

    it('should reject low > open', () => {
      const result = service.validateDataPoint({ ...validPoint, low: 110, open: 100 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual('low must be <= open');
    });

    it('should reject low > close', () => {
      const result = service.validateDataPoint({ ...validPoint, low: 110, close: 100 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual('low must be <= close');
    });

    it('should reject negative volume', () => {
      const result = service.validateDataPoint({ ...validPoint, volume: -1 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual('volume must be >= 0');
    });

    it('should reject invalid timestamp', () => {
      const result = service.validateDataPoint({ ...validPoint, timestamp: 'not-a-date' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual('timestamp is not a valid date');
    });

    it('should warn on future timestamp', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const result = service.validateDataPoint({
        ...validPoint,
        timestamp: future.toISOString(),
      });
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual('timestamp is in the future');
    });

    it('should warn on zero OHLC values', () => {
      const result = service.validateDataPoint({ ...validPoint, open: 0, low: 0 });
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual('OHLC values should be > 0');
    });
  });

  describe('validateDataPoints', () => {
    it('should mark valid points as valid', () => {
      const points: MarketDataPoint[] = [
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
        },
      ];
      const result = service.validateDataPoints(points);
      expect(result[0].validationStatus).toBe('valid');
    });

    it('should mark invalid points as invalid', () => {
      const points: MarketDataPoint[] = [
        {
          symbol: '',
          timeframe: '1d',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 1000000,
          timestamp: '2025-01-15T00:00:00Z',
          validationStatus: 'valid',
        },
      ];
      const result = service.validateDataPoints(points);
      expect(result[0].validationStatus).toBe('invalid');
    });

    it('should return all points (even invalid ones)', () => {
      const points: MarketDataPoint[] = [
        {
          symbol: '',
          timeframe: '1d',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 1000000,
          timestamp: '2025-01-15T00:00:00Z',
          validationStatus: 'valid',
        },
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
        },
      ];
      const result = service.validateDataPoints(points);
      expect(result).toHaveLength(2);
    });

    it('should flag duplicate candles as invalid', () => {
      const base: MarketDataPoint = {
        symbol: 'THYAO',
        timeframe: '1d',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1000000,
        timestamp: '2025-01-15T00:00:00Z',
        validationStatus: 'valid',
      };
      const result = service.validateDataPoints([
        { ...base },
        { ...base, close: 106 },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].validationStatus).toBe('valid');
      expect(result[1].validationStatus).toBe('invalid');
    });
  });

  describe('getStatus', () => {
    it('should return valid for correct data', () => {
      const status = service.getStatus({
        symbol: 'THYAO',
        timeframe: '1d',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1000000,
        timestamp: '2025-01-15T00:00:00Z',
      });
      expect(status).toBe('valid');
    });

    it('should return invalid for bad data', () => {
      const status = service.getStatus({ symbol: '', timeframe: '1d' });
      expect(status).toBe('invalid');
    });
  });
});
