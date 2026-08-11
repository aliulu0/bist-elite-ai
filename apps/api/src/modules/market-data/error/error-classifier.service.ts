import { Injectable } from '@nestjs/common';

export type FailureCategory =
  | 'CONFIGURATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'EMPTY_RESPONSE'
  | 'SYMBOL_NOT_FOUND'
  | 'PROVIDER_ERROR'
  | 'UNKNOWN_ERROR';

export const FAILURE_CATEGORIES: readonly FailureCategory[] = [
  'CONFIGURATION_ERROR',
  'AUTHENTICATION_ERROR',
  'RATE_LIMIT',
  'TIMEOUT',
  'NETWORK_ERROR',
  'INVALID_RESPONSE',
  'EMPTY_RESPONSE',
  'SYMBOL_NOT_FOUND',
  'PROVIDER_ERROR',
  'UNKNOWN_ERROR',
];

export interface ClassifiedError {
  category: FailureCategory;
  retryable: boolean;
  httpStatus: number | null;
}

const NON_RETRYABLE: ReadonlySet<FailureCategory> = new Set<FailureCategory>([
  'CONFIGURATION_ERROR',
  'AUTHENTICATION_ERROR',
  'INVALID_RESPONSE',
  'EMPTY_RESPONSE',
  'SYMBOL_NOT_FOUND',
]);

export interface ProviderErrorPayload {
  status?: number;
  code?: string;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly category?: FailureCategory,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

@Injectable()
export class ProviderErrorClassifier {
  classify(error: unknown): ClassifiedError {
    const status = this.extractHttpStatus(error);
    const message = this.extractMessage(error);
    const name = this.extractName(error);

    if (status !== null) {
      return this.classifyStatus(status, message);
    }

    if (this.isTimeout(error, name, message)) {
      return this.build('TIMEOUT');
    }

    if (this.isConfiguration(message)) {
      return this.build('CONFIGURATION_ERROR');
    }

    if (this.isRateLimit(message)) {
      return this.build('RATE_LIMIT');
    }

    if (this.isNetwork(error, name, message)) {
      return this.build('NETWORK_ERROR');
    }

    if (this.isInvalidResponse(message)) {
      return this.build('INVALID_RESPONSE');
    }

    if (this.isSymbolNotFound(message)) {
      return this.build('SYMBOL_NOT_FOUND');
    }

    if (error instanceof ProviderError && error.category) {
      return this.build(error.category);
    }

    return this.build('UNKNOWN_ERROR');
  }

  classifyStatus(status: number, message?: string): ClassifiedError {
    if (status === 401 || status === 403) return this.build('AUTHENTICATION_ERROR', status);
    if (status === 404) return this.build('SYMBOL_NOT_FOUND', status);
    if (status === 429) return this.build('RATE_LIMIT', status);
    if (status === 400) return this.build('INVALID_RESPONSE', status);
    if (status >= 500) return this.build('PROVIDER_ERROR', status);
    return this.build('UNKNOWN_ERROR', status);
  }

  isRetryable(category: FailureCategory): boolean {
    return !NON_RETRYABLE.has(category);
  }

  private build(category: FailureCategory, httpStatus: number | null = null): ClassifiedError {
    return { category, retryable: this.isRetryable(category), httpStatus };
  }

  private extractHttpStatus(error: unknown): number | null {
    if (error instanceof ProviderError && typeof error.status === 'number') {
      return error.status;
    }
    const record = error as Record<string, unknown>;
    if (record && typeof record.status === 'number') {
      return record.status;
    }
    if (record && typeof record.statusCode === 'number') {
      return record.statusCode;
    }
    const message = this.extractMessage(error);
    const match = message.match(/HTTP\s+(\d{3})/i);
    if (match) return parseInt(match[1], 10);
    return null;
  }

  extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message ?? '';
    if (typeof error === 'string') return error;
    return String(error ?? '');
  }

  private extractName(error: unknown): string {
    if (error instanceof Error) return error.name ?? '';
    return '';
  }

  private isTimeout(error: unknown, name: string, message: string): boolean {
    if (name === 'TimeoutError' || name === 'AbortError') return true;
    if (/timeout after/i.test(message)) return true;
    if (/timed? ?out/i.test(message)) return true;
    return error instanceof ProviderError && error.category === 'TIMEOUT';
  }

  private isConfiguration(message: string): boolean {
    return /not configured|api key (is )?missing|missing api key|no api key/i.test(message);
  }

  private isRateLimit(message: string): boolean {
    return /rate ?limit|too many requests|429|daily request limit|quota/i.test(message);
  }

  private isNetwork(error: unknown, name: string, message: string): boolean {
    if (name === 'TypeError' && /fetch|network|failed/i.test(message)) return true;
    if (name === 'FetchError') return true;
    if (/ECONNREFUSED|ENOTFOUND|ECONNRESET|EHOSTUNREACH|ENETUNREACH|socket hang up|fetch failed|network error/i.test(message)) {
      return true;
    }
    return false;
  }

  private isInvalidResponse(message: string): boolean {
    return /json|parse|unexpected token|invalid response|malformed/i.test(message);
  }

  private isSymbolNotFound(message: string): boolean {
    return /symbol .*(not found|does not exist)|no data found|invalid symbol/i.test(message);
  }
}
