import { SecurityValidatorService } from '../security-validator.service';
import { ReadinessStatus } from '../types';

describe('SecurityValidatorService', () => {
  let service: SecurityValidatorService;
  const originalEnv = process.env;

  beforeEach(() => {
    service = new SecurityValidatorService();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validate', () => {
    it('should return a security result with checks', () => {
      process.env.NODE_ENV = 'test';
      const result = service.validate();
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should PASS when NODE_ENV is set', () => {
      process.env.NODE_ENV = 'production';
      const result = service.validate();
      const envCheck = result.checks.find((c) => c.name === 'Environment Configuration');
      expect(envCheck?.status).toBe(ReadinessStatus.PASS);
    });

    it('should FAIL when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const result = service.validate();
      const envCheck = result.checks.find((c) => c.name === 'Environment Configuration');
      expect(envCheck?.status).toBe(ReadinessStatus.FAIL);
    });

    it('should WARN when DEBUG is enabled in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEBUG = 'true';
      const result = service.validate();
      const envCheck = result.checks.find((c) => c.name === 'Environment Configuration');
      expect(envCheck?.status).toBe(ReadinessStatus.WARN);
    });

    it('should validate all security categories', () => {
      process.env.NODE_ENV = 'test';
      const result = service.validate();
      const categories = [...new Set(result.checks.map((c) => c.category))];
      expect(categories).toContain('environment');
      expect(categories).toContain('security');
    });

    it('should include Helmet security check', () => {
      const result = service.validate();
      expect(result.checks.some((c) => c.name === 'Security Headers')).toBe(true);
    });

    it('should include Input Validation check', () => {
      const result = service.validate();
      expect(result.checks.some((c) => c.name === 'Input Validation')).toBe(true);
    });
  });
});
