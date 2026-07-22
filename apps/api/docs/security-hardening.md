# Enterprise Security Hardening

## Overview

The BIST Elite API implements defense-in-depth security across all layers: HTTP headers, request rate limiting, input sanitization, file upload validation, request size limits, and response sanitization. All security features are configurable via environment variables and ship with secure defaults.

## Architecture

### Core Components

```
apps/api/src/common/security/
├── security.config.ts              # Security configuration (defaults + env overrides)
├── security.module.ts              # NestJS module wiring (middleware + providers)
├── index.ts                        # Public API exports
├── guards/
│   └── rate-limit.guard.ts         # In-memory sliding window rate limiter
├── middleware/
│   ├── security.middleware.ts       # CSP headers, request timeouts, body size limits
│   └── input-sanitization.middleware.ts  # Path traversal, command injection, prototype pollution detection
├── pipes/
│   ├── sanitize.pipe.ts            # HTML stripping, entity encoding, SQL injection detection
│   └── file-validation.pipe.ts     # MIME type, file size, path traversal, null byte detection
├── interceptors/
│   └── request-size.interceptor.ts # Content-length enforcement, response field redaction
└── __tests__/                      # 61 tests
```

## Security Layers

### 1. HTTP Security Headers (SecurityHeadersMiddleware)

Automatically applied to all responses:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | Restricted directives (default-src, script-src, style-src, etc.) |
| `Cross-Origin-Embedder-Policy` | `require-corp` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |

### 2. Rate Limiting (RateLimitGuard)

- **Algorithm**: In-memory sliding window per client
- **Client identification**: API key > User ID > IP address
- **Default**: 100 requests per 60-second window
- **Skipped paths**: `/health`, `/ready`, `/live`, `/metrics`
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`
- **Response**: HTTP 429 with retry-after seconds

### 3. Request Timeouts (RequestTimeoutMiddleware)

- **Default**: 30 seconds per request
- **Response**: HTTP 408 on timeout
- **Configurable**: `SECURITY_TIMEOUT_MS` env var

### 4. Request Size Limits

- **Body size**: Configurable via `RequestTimeoutMiddleware` (default: 10MB)
- **Content-Length header**: Enforced via `RequestSizeInterceptor` (HTTP 413)
- **Configurable**: `SECURITY_MAX_BODY_SIZE` env var

### 5. Input Sanitization (InputSanitizationMiddleware)

Scans query, params, and body for suspicious patterns:

| Pattern | Detection |
|---------|-----------|
| `../` | Path traversal |
| `/etc/passwd`, `/etc/shadow` | System file access |
| `/proc/`, `/sys/`, `/dev/` | Linux filesystem |
| `\\windows\\system32` | Windows system paths |
| `cmd.exe`, `powershell` | Command execution |
| `exec`, `eval` | Code execution |
| `__proto__`, `constructor(` | Prototype pollution |

### 6. HTML/XSS Sanitization (SanitizePipe)

Applied to user input via pipe decorator:

- Strips `<script>` tags and event handlers (`onclick`, etc.)
- Removes `javascript:` URLs
- HTML entity encoding (`<`, `>`, `"`, `'`, `&`)
- Handles nested objects and arrays

### 7. SQL Injection Detection (SqlInjectionDetector)

Pattern-based detection of SQL injection attempts:

- Keywords: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, `ALTER`, `EXEC`, `UNION`
- Comment injection: `--`, `;`, `/*`, `*/`
- Always-true patterns: `OR 1=1`, `' OR '1'='1`

### 8. File Upload Validation (FileValidationPipe)

Validates uploaded files before processing:

- **Allowed MIME types**: `application/json`, `text/csv`, `application/pdf`, `image/*`, `text/plain`
- **Max file size**: 5MB per file
- **Max files**: 5 per request
- **Path traversal**: Blocks `../` in filenames
- **Null bytes**: Blocks `\0` in filenames

### 9. Response Sanitization (ResponseSanitizeInterceptor)

Automatically redacts sensitive fields from responses:

- `password`, `passwordHash`, `password_hash`
- `secret`, `token`, `accessToken`, `access_token`
- `refreshToken`, `refresh_token`
- `apiKey`, `api_key`, `privateKey`, `private_key`
- `jwt`, `authorization`, `credentials`

### 10. Correlation IDs (CorrelationIdMiddleware)

Propagates request tracing:

- Reads from: `X-Correlation-Id`, `X-Request-Id`, `X-B3-TraceId`
- Sets response header: `X-Correlation-Id`
- Attaches to request for downstream logging

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECURITY_RATE_LIMIT_ENABLED` | `true` | Enable/disable rate limiting |
| `SECURITY_RATE_LIMIT_MAX` | `100` | Max requests per window |
| `SECURITY_RATE_LIMIT_WINDOW_MS` | `60000` | Window duration in ms |
| `SECURITY_MAX_BODY_SIZE` | `10mb` | Max request body size |
| `SECURITY_TIMEOUT_MS` | `30000` | Request timeout in ms |
| `SECURITY_FILE_MAX_SIZE` | `5242880` | Max file upload size (bytes) |
| `CORS_ORIGINS` | `*` | Allowed CORS origins (comma-separated) |

### Programmatic Configuration

```typescript
import { getSecurityConfig } from './common/security';

const config = getSecurityConfig({
  rateLimit: { maxRequests: 200, windowMs: 30000 },
  headers: { xFrameOptions: 'SAMEORIGIN' },
});
```

## Usage

### Apply SanitizePipe to a Controller

```typescript
@Post('search')
search(@Body(SanitizePipe) dto: SearchDto) {
  // Input is sanitized
}
```

### Apply SqlInjectionDetector to a Query

```typescript
@Get('users')
findUsers(@Query(SqlInjectionDetector) query: UserQueryDto) {
  // SQL injection patterns are blocked
}
```

### Apply FileValidationPipe to File Upload

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
upload(@UploadedFile(FileValidationPipe) file: Express.Multer.File) {
  // File is validated
}
```

## Testing

```bash
# Run all security tests
jest --testPathPattern="common/security/__tests__"

# Run specific test suite
jest --testPathPattern="rate-limit.guard.spec"
jest --testPathPattern="sanitize.pipe.spec"
jest --testPathPattern="file-validation.pipe.spec"
```

61 tests covering all security components.
