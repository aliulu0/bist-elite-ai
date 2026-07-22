export interface SecurityConfig {
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    message: string;
    skipPaths: string[];
  };
  headers: {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    referrerPolicy: string;
    permissionsPolicy: string;
    xPermittedCrossDomainPolicies: string;
    crossOriginEmbedderPolicy: string;
    crossOriginOpenerPolicy: string;
    crossOriginResourcePolicy: string;
  };
  request: {
    maxBodySize: string;
    maxUrlLength: number;
    timeoutMs: number;
  };
  cors: {
    origin: string[];
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
  };
  fileUpload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    maxFiles: number;
  };
  sanitize: {
    enabled: boolean;
    stripHtml: boolean;
    maxLength: number;
  };
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    enabled: true,
    windowMs: 60_000,
    maxRequests: 100,
    message: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
    skipPaths: ['/health', '/health/ready', '/health/live'],
  },
  headers: {
    contentSecurityPolicy:
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
    xPermittedCrossDomainPolicies: 'none',
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
  },
  request: {
    maxBodySize: '10mb',
    maxUrlLength: 2048,
    timeoutMs: 30_000,
  },
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-API-Key',
      'Accept-Language',
      'X-Request-Time',
    ],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 86400,
  },
  fileUpload: {
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: [
      'application/json',
      'text/csv',
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
    ],
    maxFiles: 5,
  },
  sanitize: {
    enabled: true,
    stripHtml: true,
    maxLength: 10_000,
  },
};

export function getSecurityConfig(overrides?: Partial<SecurityConfig>): SecurityConfig {
  if (!overrides) return { ...DEFAULT_SECURITY_CONFIG };

  return {
    rateLimit: { ...DEFAULT_SECURITY_CONFIG.rateLimit, ...overrides.rateLimit },
    headers: { ...DEFAULT_SECURITY_CONFIG.headers, ...overrides.headers },
    request: { ...DEFAULT_SECURITY_CONFIG.request, ...overrides.request },
    cors: { ...DEFAULT_SECURITY_CONFIG.cors, ...overrides.cors },
    fileUpload: { ...DEFAULT_SECURITY_CONFIG.fileUpload, ...overrides.fileUpload },
    sanitize: { ...DEFAULT_SECURITY_CONFIG.sanitize, ...overrides.sanitize },
  };
}

export function parseSecurityConfigFromEnv(): Partial<SecurityConfig> {
  const overrides: Partial<SecurityConfig> = {};

  if (process.env.SECURITY_RATE_LIMIT_ENABLED) {
    overrides.rateLimit = {
      ...DEFAULT_SECURITY_CONFIG.rateLimit,
      enabled: process.env.SECURITY_RATE_LIMIT_ENABLED === 'true',
      maxRequests: parseInt(process.env.SECURITY_RATE_LIMIT_MAX || '100', 10),
      windowMs: parseInt(process.env.SECURITY_RATE_LIMIT_WINDOW_MS || '60000', 10),
    };
  }

  if (process.env.SECURITY_MAX_BODY_SIZE) {
    overrides.request = {
      ...DEFAULT_SECURITY_CONFIG.request,
      maxBodySize: process.env.SECURITY_MAX_BODY_SIZE,
    };
  }

  if (process.env.SECURITY_TIMEOUT_MS) {
    overrides.request = {
      ...(overrides.request || DEFAULT_SECURITY_CONFIG.request),
      timeoutMs: parseInt(process.env.SECURITY_TIMEOUT_MS, 10),
    };
  }

  if (process.env.CORS_ORIGINS) {
    overrides.cors = {
      ...DEFAULT_SECURITY_CONFIG.cors,
      origin: process.env.CORS_ORIGINS.split(','),
    };
  }

  if (process.env.SECURITY_FILE_MAX_SIZE) {
    overrides.fileUpload = {
      ...DEFAULT_SECURITY_CONFIG.fileUpload,
      maxFileSize: parseInt(process.env.SECURITY_FILE_MAX_SIZE, 10),
    };
  }

  return overrides;
}
