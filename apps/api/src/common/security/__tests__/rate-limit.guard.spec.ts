import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitGuard } from '../guards/rate-limit.guard';

class MockLogger {
  log() {}
  debug() {}
  warn() {}
  error() {}
  trace() {}
  fatal() {}
  logRequest() {}
  logResponse() {}
  logEvent() {}
  getConfig() {
    return { level: 'info', maskSensitiveFields: [] };
  }
}

function createMockContext(overrides: { ip?: string; headers?: Record<string, string>; routePath?: string } = {}) {
  const req = {
    ip: overrides.ip || '127.0.0.1',
    headers: overrides.headers || {},
    route: { path: overrides.routePath || '/api/test' },
    userContext: undefined,
    connection: { remoteAddress: '127.0.0.1' },
  };

  const res = {
    setHeader: jest.fn(),
  };

  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;

  beforeEach(() => {
    guard = new RateLimitGuard(new MockLogger() as any);
  });

  afterEach(() => {
    guard.onModuleDestroy();
  });

  it('allows first request', () => {
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('tracks request count per IP', () => {
    const context = createMockContext({ ip: '192.168.1.1' });
    for (let i = 0; i < 99; i++) {
      guard.canActivate(context);
    }
    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks after max requests', () => {
    const context = createMockContext({ ip: '10.0.0.1' });
    for (let i = 0; i < 100; i++) {
      guard.canActivate(context);
    }
    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });

  it('returns 429 when rate limited', () => {
    const context = createMockContext({ ip: '10.0.0.2' });
    for (let i = 0; i < 100; i++) {
      guard.canActivate(context);
    }
    try {
      guard.canActivate(context);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('differentiates by API key', () => {
    const ctx1 = createMockContext({ headers: { 'x-api-key': 'key-a' } });
    const ctx2 = createMockContext({ headers: { 'x-api-key': 'key-b' } });

    for (let i = 0; i < 100; i++) {
      guard.canActivate(ctx1);
    }

    expect(guard.canActivate(ctx2)).toBe(true);
    expect(() => guard.canActivate(ctx1)).toThrow(HttpException);
  });

  it('differentiates by user ID', () => {
    const ctx1 = createMockContext({});
    (ctx1.switchToHttp().getRequest() as any).userContext = { userId: 'user-a' };
    const ctx2 = createMockContext({});
    (ctx2.switchToHttp().getRequest() as any).userContext = { userId: 'user-b' };

    for (let i = 0; i < 100; i++) {
      guard.canActivate(ctx1);
    }

    expect(guard.canActivate(ctx2)).toBe(true);
  });

  it('skips configured paths', () => {
    const context = createMockContext({ routePath: '/health' });
    for (let i = 0; i < 200; i++) {
      expect(guard.canActivate(context)).toBe(true);
    }
  });

  it('sets rate limit headers', () => {
    const context = createMockContext();
    guard.canActivate(context);
    const res = context.switchToHttp().getResponse();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
  });
});
