import { ProviderErrorClassifier, ProviderError, FAILURE_CATEGORIES } from './error-classifier.service';

describe('ProviderErrorClassifier', () => {
  let classifier: ProviderErrorClassifier;

  beforeEach(() => {
    classifier = new ProviderErrorClassifier();
  });

  describe('classify', () => {
    it('classifies HTTP status codes', () => {
      expect(classifier.classify({ status: 401 })).toEqual({
        category: 'AUTHENTICATION_ERROR',
        retryable: false,
        httpStatus: 401,
      });
      expect(classifier.classify({ status: 403 })).toEqual({
        category: 'AUTHENTICATION_ERROR',
        retryable: false,
        httpStatus: 403,
      });
      expect(classifier.classify({ statusCode: 429 })).toEqual({
        category: 'RATE_LIMIT',
        retryable: true,
        httpStatus: 429,
      });
      expect(classifier.classify({ status: 503 })).toEqual({
        category: 'PROVIDER_ERROR',
        retryable: true,
        httpStatus: 503,
      });
      expect(classifier.classify({ status: 404 })).toEqual({
        category: 'SYMBOL_NOT_FOUND',
        retryable: false,
        httpStatus: 404,
      });
      expect(classifier.classify({ status: 400 })).toEqual({
        category: 'INVALID_RESPONSE',
        retryable: false,
        httpStatus: 400,
      });
    });

    it('classifies timeouts', () => {
      expect(classifier.classify(new Error('Timeout after 15000ms'))).toMatchObject({
        category: 'TIMEOUT',
        retryable: true,
      });
      const abort = new Error('aborted');
      abort.name = 'AbortError';
      expect(classifier.classify(abort)).toMatchObject({ category: 'TIMEOUT' });
    });

    it('classifies network errors', () => {
      expect(classifier.classify(new TypeError('fetch failed'))).toMatchObject({
        category: 'NETWORK_ERROR',
        retryable: true,
      });
      expect(classifier.classify(new Error('ECONNREFUSED localhost:443'))).toMatchObject({
        category: 'NETWORK_ERROR',
      });
    });

    it('classifies configuration, rate-limit, symbol and invalid-response errors from messages', () => {
      expect(classifier.classify(new Error('API key is missing for provider'))).toMatchObject({
        category: 'CONFIGURATION_ERROR',
      });
      expect(classifier.classify(new Error('Rate limit exceeded, retry later'))).toMatchObject({
        category: 'RATE_LIMIT',
      });
      expect(classifier.classify(new Error('symbol XYZ not found'))).toMatchObject({
        category: 'SYMBOL_NOT_FOUND',
      });
      expect(classifier.classify(new Error('Unexpected token < in JSON at position 0'))).toMatchObject({
        category: 'INVALID_RESPONSE',
      });
    });

    it('honours an explicit category and status on a ProviderError', () => {
      const error = new ProviderError('upstream failure', 500, 'PROVIDER_ERROR');
      expect(classifier.classify(error)).toMatchObject({
        category: 'PROVIDER_ERROR',
        httpStatus: 500,
      });
    });

    it('falls back to UNKNOWN_ERROR', () => {
      expect(classifier.classify(new Error('something entirely different'))).toEqual({
        category: 'UNKNOWN_ERROR',
        retryable: true,
        httpStatus: null,
      });
    });

    it('parses an HTTP status embedded in an error message', () => {
      expect(classifier.classify(new Error('HTTP 429 Too Many Requests'))).toMatchObject({
        category: 'RATE_LIMIT',
        httpStatus: 429,
      });
    });
  });

  it('assigns a deterministic retryable flag to every defined failure category', () => {
    const expected: Record<(typeof FAILURE_CATEGORIES)[number], boolean> = {
      CONFIGURATION_ERROR: false,
      AUTHENTICATION_ERROR: false,
      RATE_LIMIT: true,
      TIMEOUT: true,
      NETWORK_ERROR: true,
      INVALID_RESPONSE: false,
      EMPTY_RESPONSE: false,
      SYMBOL_NOT_FOUND: false,
      PROVIDER_ERROR: true,
      UNKNOWN_ERROR: true,
    };

    for (const category of FAILURE_CATEGORIES) {
      expect(classifier.isRetryable(category)).toBe(expected[category]);
    }
  });
});
