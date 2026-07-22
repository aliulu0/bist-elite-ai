import { BadRequestException } from '@nestjs/common';
import { InputSanitizationMiddleware } from '../middleware/input-sanitization.middleware';

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

function createMockReqRes(query: any = {}, body: any = {}, params: any = {}) {
  const req = {
    query,
    body,
    params,
    headers: {},
    url: '/api/test',
    method: 'GET',
    route: { path: '/api/test' },
    ip: '127.0.0.1',
    userContext: undefined,
    connection: { remoteAddress: '127.0.0.1' },
  };

  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  return { req, res };
}

describe('InputSanitizationMiddleware', () => {
  let middleware: InputSanitizationMiddleware;

  beforeEach(() => {
    middleware = new InputSanitizationMiddleware(new MockLogger() as any);
  });

  it('allows normal input', () => {
    const { req, res } = createMockReqRes({ search: 'Istanbul' });
    const next = jest.fn();
    middleware.use(req as any, res as any, next);
    expect(next).toHaveBeenCalled();
  });

  it('detects path traversal in query', () => {
    const { req, res } = createMockReqRes({ file: '../../../etc/passwd' });
    const next = jest.fn();
    expect(() => middleware.use(req as any, res as any, next)).toThrow(BadRequestException);
  });

  it('detects /etc/passwd', () => {
    const { req, res } = createMockReqRes({ path: '/etc/passwd' });
    const next = jest.fn();
    expect(() => middleware.use(req as any, res as any, next)).toThrow(BadRequestException);
  });

  it('detects /proc/', () => {
    const { req, res } = createMockReqRes({ path: '/proc/self/environ' });
    const next = jest.fn();
    expect(() => middleware.use(req as any, res as any, next)).toThrow(BadRequestException);
  });

  it('detects __proto__ string values in query', () => {
    const { req, res } = createMockReqRes({ key: '__proto__' });
    const next = jest.fn();
    expect(() => middleware.use(req as any, res as any, next)).toThrow(BadRequestException);
  });

  it('detects cmd.exe patterns', () => {
    const { req, res } = createMockReqRes({ cmd: 'cmd.exe /c dir' });
    const next = jest.fn();
    expect(() => middleware.use(req as any, res as any, next)).toThrow(BadRequestException);
  });

  it('detects eval() patterns', () => {
    const { req, res } = createMockReqRes({ code: 'eval(malicious)' });
    const next = jest.fn();
    expect(() => middleware.use(req as any, res as any, next)).toThrow(BadRequestException);
  });

  it('scans body parameters', () => {
    const { req, res } = createMockReqRes({}, { payload: '/etc/shadow' });
    const next = jest.fn();
    expect(() => middleware.use(req as any, res as any, next)).toThrow(BadRequestException);
  });

  it('scans params', () => {
    const { req, res } = createMockReqRes({}, {}, { id: '../../windows/system32' });
    const next = jest.fn();
    expect(() => middleware.use(req as any, res as any, next)).toThrow(BadRequestException);
  });

  it('allows normal body', () => {
    const { req, res } = createMockReqRes({}, { name: 'Ali', age: 30 });
    const next = jest.fn();
    middleware.use(req as any, res as any, next);
    expect(next).toHaveBeenCalled();
  });
});
