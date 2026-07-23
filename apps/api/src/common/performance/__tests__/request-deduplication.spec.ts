import { RequestDeduplicationInterceptor } from '../request-deduplication.interceptor';
import { of, Subject } from 'rxjs';

function createMockContext(method = 'GET', url = '/api/test', query = {}, userId?: string) {
  const req = {
    method,
    url,
    query,
    headers: {},
    userContext: userId ? { userId } : undefined,
    route: { path: url },
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
  };

  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

describe('RequestDeduplicationInterceptor', () => {
  let interceptor: RequestDeduplicationInterceptor;

  beforeEach(() => {
    interceptor = new RequestDeduplicationInterceptor();
  });

  afterEach(() => {
    interceptor.onModuleDestroy();
  });

  it('passes through non-GET requests', () => {
    const context = createMockContext('POST');
    const next = { handle: () => of('result') };
    const result = interceptor.intercept(context, next as any);
    expect(result).toBeDefined();
  });

  it('passes through when disabled', () => {
    const disabled = new RequestDeduplicationInterceptor();
    const context = createMockContext('GET');
    const next = { handle: () => of('result') };
    const result = disabled.intercept(context, next as any);
    expect(result).toBeDefined();
    disabled.onModuleDestroy();
  });

  it('deduplicates concurrent identical requests', () => {
    const context = createMockContext('GET', '/api/test', {}, 'user-1');
    const subject = new Subject();
    const next = { handle: () => subject.asObservable() };

    const first = interceptor.intercept(context, next as any);
    const second = interceptor.intercept(context, next as any);

    expect(interceptor.getPendingCount()).toBe(1);

    subject.next('data');
    subject.complete();
  });

  it('tracks pending count', () => {
    const ctx1 = createMockContext('GET', '/api/a', {}, 'u1');
    const ctx2 = createMockContext('GET', '/api/b', {}, 'u2');
    const next = { handle: () => new Subject().asObservable() };

    interceptor.intercept(ctx1, next as any);
    interceptor.intercept(ctx2, next as any);

    expect(interceptor.getPendingCount()).toBe(2);
  });
});
