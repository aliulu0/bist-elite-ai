import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger.service';
import { LogLevel } from '../types';

class MockConfigService {
  private data: Record<string, string> = {
    LOG_LEVEL: 'debug',
    LOG_CONSOLE: 'true',
    LOG_FILE: 'false',
    LOG_RETENTION_DAYS: '30',
  };

  get(key: string, defaultValue?: string): string | undefined {
    return this.data[key] ?? defaultValue;
  }
}

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new AppLoggerService(new MockConfigService() as unknown as ConfigService);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('returns logger config', () => {
      const config = service.getConfig();
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.enableConsole).toBe(true);
      expect(config.enableFile).toBe(false);
      expect(config.maskSensitiveFields).toContain('password');
      expect(config.maskSensitiveFields).toContain('token');
      expect(config.maskSensitiveFields).toContain('apiKey');
    });

    it('returns a copy of config', () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('log levels', () => {
    it('logs at configured level', () => {
      expect(() => service.log('test message', 'TestContext')).not.toThrow();
    });

    it('logs debug messages', () => {
      expect(() => service.debug('debug message', 'TestContext')).not.toThrow();
    });

    it('logs trace messages', () => {
      expect(() => service.trace('trace message', 'TestContext')).not.toThrow();
    });

    it('logs warn messages', () => {
      expect(() => service.warn('warn message', 'TestContext')).not.toThrow();
    });

    it('logs error messages', () => {
      expect(() => service.error('error message', 'stack', 'TestContext')).not.toThrow();
    });

    it('logs fatal messages', () => {
      expect(() => service.fatal('fatal message', 'stack', 'TestContext')).not.toThrow();
    });
  });

  describe('sensitive data masking', () => {
    it('masks password fields', () => {
      const entry = { password: 'secret123', username: 'admin' };
      const result = service.getConfig();
      expect(result.maskSensitiveFields).toContain('password');
    });

    it('masks token fields', () => {
      const result = service.getConfig();
      expect(result.maskSensitiveFields).toContain('token');
      expect(result.maskSensitiveFields).toContain('accessToken');
      expect(result.maskSensitiveFields).toContain('refreshToken');
    });

    it('masks apiKey fields', () => {
      const result = service.getConfig();
      expect(result.maskSensitiveFields).toContain('apiKey');
      expect(result.maskSensitiveFields).toContain('api_key');
    });

    it('masks secret fields', () => {
      const result = service.getConfig();
      expect(result.maskSensitiveFields).toContain('secret');
      expect(result.maskSensitiveFields).toContain('privateKey');
      expect(result.maskSensitiveFields).toContain('credentials');
    });
  });

  describe('logRequest', () => {
    it('logs request without error', () => {
      expect(() => service.logRequest('req-1', 'GET', '/api/health', 'user-1')).not.toThrow();
    });

    it('logs request with anonymous user', () => {
      expect(() => service.logRequest('req-2', 'POST', '/api/data')).not.toThrow();
    });
  });

  describe('logResponse', () => {
    it('logs successful response at INFO level', () => {
      expect(() => service.logResponse('req-1', 'GET', '/api/health', 200, 50)).not.toThrow();
    });

    it('logs client error at WARN level', () => {
      expect(() => service.logResponse('req-2', 'GET', '/api/missing', 404, 10)).not.toThrow();
    });

    it('logs server error at ERROR level', () => {
      expect(() => service.logResponse('req-3', 'POST', '/api/data', 500, 1000)).not.toThrow();
    });
  });

  describe('logEvent', () => {
    it('logs event with metadata', () => {
      expect(() =>
        service.logEvent('Scanner', 'Scan completed', { stockCount: 500, duration: 1200 }),
      ).not.toThrow();
    });

    it('logs event without metadata', () => {
      expect(() => service.logEvent('Scheduler', 'Cron job triggered')).not.toThrow();
    });
  });
});
