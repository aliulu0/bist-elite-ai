import { getSecurityConfig, parseSecurityConfigFromEnv } from '../security.config';

describe('SecurityConfig', () => {
  describe('getSecurityConfig', () => {
    it('returns default config when no overrides', () => {
      const config = getSecurityConfig();
      expect(config).toBeDefined();
      expect(config.rateLimit.enabled).toBe(true);
      expect(config.rateLimit.maxRequests).toBe(100);
      expect(config.rateLimit.windowMs).toBe(60000);
      expect(config.headers.xFrameOptions).toBe('DENY');
      expect(config.headers.xContentTypeOptions).toBe('nosniff');
      expect(config.headers.referrerPolicy).toBe('strict-origin-when-cross-origin');
      expect(config.request.maxBodySize).toBe('10mb');
      expect(config.request.timeoutMs).toBe(30000);
      expect(config.cors.credentials).toBe(true);
      expect(config.fileUpload.maxFileSize).toBe(5 * 1024 * 1024);
      expect(config.sanitize.stripHtml).toBe(true);
    });

    it('returns a copy (not reference)', () => {
      const config1 = getSecurityConfig();
      const config2 = getSecurityConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });

    it('applies rate limit overrides', () => {
      const config = getSecurityConfig({
        rateLimit: { enabled: false, windowMs: 30000, maxRequests: 50, message: 'test', skipPaths: [] },
      });
      expect(config.rateLimit.enabled).toBe(false);
      expect(config.rateLimit.maxRequests).toBe(50);
      expect(config.rateLimit.windowMs).toBe(30000);
    });

    it('applies header overrides', () => {
      const config = getSecurityConfig({
        headers: {
          ...getSecurityConfig().headers,
          xFrameOptions: 'SAMEORIGIN',
        },
      });
      expect(config.headers.xFrameOptions).toBe('SAMEORIGIN');
    });

    it('applies CORS overrides', () => {
      const config = getSecurityConfig({
        cors: {
          ...getSecurityConfig().cors,
          origin: ['https://example.com'],
        },
      });
      expect(config.cors.origin).toEqual(['https://example.com']);
    });

    it('applies file upload overrides', () => {
      const config = getSecurityConfig({
        fileUpload: {
          ...getSecurityConfig().fileUpload,
          maxFileSize: 1024,
        },
      });
      expect(config.fileUpload.maxFileSize).toBe(1024);
    });
  });

  describe('parseSecurityConfigFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('returns empty object when no env vars set', () => {
      delete process.env.SECURITY_RATE_LIMIT_ENABLED;
      delete process.env.SECURITY_MAX_BODY_SIZE;
      delete process.env.SECURITY_TIMEOUT_MS;
      delete process.env.CORS_ORIGINS;
      delete process.env.SECURITY_FILE_MAX_SIZE;

      const config = parseSecurityConfigFromEnv();
      expect(Object.keys(config)).toHaveLength(0);
    });

    it('parses rate limit config from env', () => {
      process.env.SECURITY_RATE_LIMIT_ENABLED = 'true';
      process.env.SECURITY_RATE_LIMIT_MAX = '200';
      process.env.SECURITY_RATE_LIMIT_WINDOW_MS = '30000';

      const config = parseSecurityConfigFromEnv();
      expect(config.rateLimit).toBeDefined();
      expect(config.rateLimit!.enabled).toBe(true);
      expect(config.rateLimit!.maxRequests).toBe(200);
      expect(config.rateLimit!.windowMs).toBe(30000);
    });

    it('parses CORS origins from env', () => {
      process.env.CORS_ORIGINS = 'https://app.example.com,https://admin.example.com';

      const config = parseSecurityConfigFromEnv();
      expect(config.cors).toBeDefined();
      expect(config.cors!.origin).toEqual(['https://app.example.com', 'https://admin.example.com']);
    });

    it('parses request config from env', () => {
      process.env.SECURITY_MAX_BODY_SIZE = '5mb';
      process.env.SECURITY_TIMEOUT_MS = '60000';

      const config = parseSecurityConfigFromEnv();
      expect(config.request).toBeDefined();
      expect(config.request!.maxBodySize).toBe('5mb');
      expect(config.request!.timeoutMs).toBe(60000);
    });

    it('parses file upload config from env', () => {
      process.env.SECURITY_FILE_MAX_SIZE = '10485760';

      const config = parseSecurityConfigFromEnv();
      expect(config.fileUpload).toBeDefined();
      expect(config.fileUpload!.maxFileSize).toBe(10485760);
    });
  });
});
