import { CompressionInterceptor, ETagInterceptor } from '../compression.interceptor';
import { of } from 'rxjs';

function createMockContext(data: any, acceptEncoding = '', ifNoneMatch = '') {
  const req = {
    method: 'GET',
    url: '/api/test',
    headers: {
      'accept-encoding': acceptEncoding,
      'if-none-match': ifNoneMatch,
    },
    query: {},
    userContext: undefined,
    route: { path: '/api/test' },
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
  };

  let sentData: any;
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn((d) => { sentData = d; }),
    getSentData: () => sentData,
  };

  return {
    context: {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any,
    res,
  };
}

describe('CompressionInterceptor', () => {
  let interceptor: CompressionInterceptor;

  beforeEach(() => {
    interceptor = new CompressionInterceptor({ threshold: 100, level: 6 });
  });

  it('skips compression for small payloads', (done) => {
    const { context, res } = createMockContext('small', 'gzip');
    const next = { handle: () => of('tiny') };

    interceptor.intercept(context, next as any).subscribe(() => {
      expect(res.setHeader).not.toHaveBeenCalledWith('Content-Encoding', expect.any(String));
      done();
    });
  });

  it('compresses large payloads with gzip', (done) => {
    const largeData = 'x'.repeat(200);
    const { context, res } = createMockContext(largeData, 'gzip');
    const next = { handle: () => of(largeData) };

    interceptor.intercept(context, next as any).subscribe({
      next: () => {
        expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
        expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
        done();
      },
    });
  });

  it('compresses large payloads with brotli', (done) => {
    const largeData = 'x'.repeat(200);
    const { context, res } = createMockContext(largeData, 'br, gzip');
    const next = { handle: () => of(largeData) };

    interceptor.intercept(context, next as any).subscribe({
      next: () => {
        expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'br');
        done();
      },
    });
  });

  it('skips when no accept-encoding', (done) => {
    const largeData = 'x'.repeat(200);
    const { context, res } = createMockContext(largeData, '');
    const next = { handle: () => of(largeData) };

    interceptor.intercept(context, next as any).subscribe(() => {
      expect(res.setHeader).not.toHaveBeenCalledWith('Content-Encoding', expect.any(String));
      done();
    });
  });
});

describe('ETagInterceptor', () => {
  let interceptor: ETagInterceptor;

  beforeEach(() => {
    interceptor = new ETagInterceptor();
  });

  it('sets ETag header on GET responses', (done) => {
    const { context, res } = createMockContext('test', '', '');
    const next = { handle: () => of({ data: 'test' }) };

    interceptor.intercept(context, next as any).subscribe(() => {
      expect(res.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, max-age=0, must-revalidate');
      done();
    });
  });

  it('returns 304 for matching ETag', (done) => {
    const data = { data: 'test' };
    const body = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < body.length; i++) {
      hash = ((hash << 5) - hash + body.charCodeAt(i)) | 0;
    }
    const etag = `"${Math.abs(hash).toString(36)}"`;

    const { context, res } = createMockContext('test', '', etag);
    const next = { handle: () => of(data) };

    interceptor.intercept(context, next as any).subscribe(() => {
      expect(res.status).toHaveBeenCalledWith(304);
      done();
    });
  });

  it('skips non-GET requests', (done) => {
    const req = { method: 'POST', headers: {} };
    const res = { setHeader: jest.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const next = { handle: () => of('data') };
    interceptor.intercept(context, next as any).subscribe(() => {
      expect(res.setHeader).not.toHaveBeenCalled();
      done();
    });
  });
});
