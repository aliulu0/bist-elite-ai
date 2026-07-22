import { HttpException, HttpStatus } from '@nestjs/common';
import { RequestSizeInterceptor } from '../interceptors/request-size.interceptor';

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

function createMockContext(contentLength?: number) {
  const req = {
    headers: {
      ...(contentLength !== undefined ? { 'content-length': String(contentLength) } : {}),
    },
    url: '/api/test',
    method: 'POST',
  };

  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

describe('RequestSizeInterceptor', () => {
  let interceptor: RequestSizeInterceptor;

  beforeEach(() => {
    interceptor = new RequestSizeInterceptor(new MockLogger() as any);
  });

  it('allows requests without content-length', () => {
    const context = createMockContext();
    const next = { handle: () => ({ subscribe: jest.fn() }) };
    expect(interceptor.intercept(context, next as any)).toBeDefined();
  });

  it('allows small requests', () => {
    const context = createMockContext(1024);
    const next = { handle: () => ({ subscribe: jest.fn() }) };
    expect(interceptor.intercept(context, next as any)).toBeDefined();
  });

  it('rejects oversized requests', () => {
    const context = createMockContext(100 * 1024 * 1024);
    const next = { handle: () => ({ subscribe: jest.fn() }) };
    expect(() => interceptor.intercept(context, next as any)).toThrow(HttpException);
  });

  it('returns 413 for oversized requests', () => {
    const context = createMockContext(100 * 1024 * 1024);
    const next = { handle: () => ({ subscribe: jest.fn() }) };
    try {
      interceptor.intercept(context, next as any);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
    }
  });
});
