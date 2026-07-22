import { ConfigValidatorService } from '../config-validator.service';
import {
  ReadinessStatus,
  Severity,
} from '../types';

describe('ConfigValidatorService', () => {
  let service: ConfigValidatorService;
  const originalEnv = process.env;

  beforeEach(() => {
    service = new ConfigValidatorService();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validate', () => {
    it('should return PASS when all required vars are present and valid', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '2.0.0';

      const result = service.validate();
      expect(result.status).toBe(ReadinessStatus.PASS);
      expect(result.totalRequired).toBe(5);
      expect(result.totalPresent).toBeGreaterThanOrEqual(5);
    });

    it('should return FAIL when required vars are missing', () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      delete process.env.APP_VERSION;

      const result = service.validate();
      expect(result.status).toBe(ReadinessStatus.FAIL);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.every((i) => i.severity === Severity.CRITICAL)).toBe(true);
    });

    it('should flag invalid PORT values', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = 'invalid';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '1.0.0';

      const result = service.validate();
      const portItem = result.items.find((i) => i.key === 'PORT');
      expect(portItem?.valid).toBe(false);
    });

    it('should accept valid PORT values', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '8080';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '1.0.0';

      const result = service.validate();
      const portItem = result.items.find((i) => i.key === 'PORT');
      expect(portItem?.valid).toBe(true);
    });

    it('should flag invalid DATABASE_URL', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'mysql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '1.0.0';

      const result = service.validate();
      const dbItem = result.items.find((i) => i.key === 'DATABASE_URL');
      expect(dbItem?.valid).toBe(false);
    });

    it('should flag invalid REDIS_URL', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'invalid-redis';
      process.env.APP_VERSION = '1.0.0';

      const result = service.validate();
      const redisItem = result.items.find((i) => i.key === 'REDIS_URL');
      expect(redisItem?.valid).toBe(false);
    });

    it('should mask sensitive values', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '1.0.0';
      process.env.JWT_SECRET = 'super-secret-key';

      const result = service.validate();
      const jwtItem = result.items.find((i) => i.key === 'JWT_SECRET');
      expect(jwtItem?.sensitive).toBe(true);
      expect(jwtItem?.resolvedValue).toBe('[REDACTED]');
    });

    it('should include timestamp in result', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '1.0.0';

      const result = service.validate();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should accept postgres:// as valid DATABASE_URL', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'postgres://user:pass@localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '1.0.0';

      const result = service.validate();
      const dbItem = result.items.find((i) => i.key === 'DATABASE_URL');
      expect(dbItem?.valid).toBe(true);
    });
  });
});
