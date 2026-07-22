# Enterprise Logging & Monitoring

## Overview

The BIST Elite API implements structured logging, request metrics, and health checks. The logging system supports multiple levels, sensitive data masking, and configurable output. The monitoring system tracks request performance, database queries, worker jobs, and custom metrics.

## Architecture

### Core Components

```
apps/api/src/common/
├── logger/
│   ├── types.ts                     # LogLevel (TRACE/DEBUG/INFO/WARN/ERROR/FATAL)
│   ├── logger.service.ts            # AppLoggerService (structured JSON, masking)
│   ├── logger.module.ts             # Global LoggerModule
│   ├── index.ts                     # Public exports
│   └── __tests__/                   # 19 tests
├── monitoring/
│   ├── types.ts                     # MetricType, RequestMetric, SlowQueryEntry
│   ├── metrics.service.ts           # MetricsService (request/worker/custom metrics)
│   ├── health.service.ts            # HealthService (DB, Redis, memory checks)
│   ├── monitoring.module.ts         # Global MonitoringModule
│   ├── index.ts                     # Public exports
│   └── __tests__/                   # 40 tests
└── interceptors/
    ├── request-logging.interceptor.ts  # RequestLoggingInterceptor (X-Request-Id, timing)
    └── metrics.interceptor.ts          # MetricsInterceptor (auto-collect metrics)
```

## Logging

### Log Levels

| Level | Priority | Use Case |
|-------|----------|----------|
| TRACE | 0 | Very detailed debugging |
| DEBUG | 1 | Development debugging |
| INFO | 2 | General operations |
| WARN | 3 | Potential issues |
| ERROR | 4 | Failures requiring attention |
| FATAL | 5 | System-level failures |

### Structured JSON Output

```json
{
  "timestamp": "2026-07-21T00:00:00.000Z",
  "level": "info",
  "context": "AuthService",
  "message": "User authenticated",
  "metadata": { "userId": "123", "method": "oauth2" }
}
```

### Sensitive Data Masking

Automatically masks configurable fields in log output:

- Default fields: `password`, `token`, `secret`, `apiKey`, `authorization`
- Configurable via `DEFAULT_SENSITIVE_FIELDS` or `LOG_MASK_SENSITIVE_FIELDS` env var
- Values replaced with `[MASKED]`

### HTTP Request Logging

```typescript
// Automatic via RequestLoggingInterceptor
// Logs: method, path, statusCode, duration, requestId
logger.logRequest('GET', '/api/health', { requestId: 'req-1', userId: 'user-1' });
logger.logResponse('GET', '/api/health', 200, { duration: 50, requestId: 'req-1' });
```

### Application Events

```typescript
logger.logEvent('Scan completed', 'Scanner', { stockCount: 500, duration: 1200 });
logger.logEvent('Cron job triggered', 'Scheduler');
```

## Monitoring

### Request Metrics

Automatically collected by `MetricsInterceptor`:

- Total requests, successes, failures
- Average/p50/p95/p99 response times
- Requests by method (GET, POST, etc.)
- Requests by status code (200, 404, 500)
- Slow request tracking (>1000ms)

### Database Metrics

```typescript
metrics.recordDatabaseQuery('SELECT * FROM users', 150);
metrics.recordSlowQuery('SELECT * FROM large_table', 5000);
metrics.recordQueryFailed();
```

### Worker Metrics

```typescript
metrics.incrementActiveJobs();
metrics.decrementActiveJobs();
metrics.recordJobCompleted();
metrics.recordJobFailed();
metrics.setQueueLength(10);
```

### Custom Metrics

```typescript
metrics.setGauge('active_connections', 42);
metrics.incrementCounter('opportunities_found', 5);
metrics.incrementCounter('opportunities_found', 3); // total: 8
```

### Metrics Snapshot

```typescript
const snapshot = metrics.getSnapshot();
// {
//   requests: { total: 1000, successes: 950, failures: 50, avgDuration: 120, ... },
//   database: { totalQueries: 500, slowQueries: 5, failedQueries: 2 },
//   worker: { activeJobs: 3, completedJobs: 100, failedJobs: 2, queueLength: 0 },
//   custom: { active_connections: 42, opportunities_found: 8 },
//   uptime: 86400000,
//   memoryUsage: { ... },
//   cpuUsage: { ... }
// }
```

## Health Checks

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Overview with auth status, DB, Redis, memory |
| `GET /health/ready` | Readiness probe (DB + Redis) |
| `GET /health/live` | Liveness probe (process alive) |
| `GET /health/metrics` | Detailed performance metrics |

### Custom Health Checks

```typescript
healthService.registerCheck('custom-service', async () => {
  const isUp = await checkExternalService();
  return { status: isUp ? 'up' : 'down', message: 'Service reachable' };
});
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Minimum log level |
| `LOG_MASK_SENSITIVE_FIELDS` | `password,token,...` | Comma-separated fields to mask |

## Testing

```bash
jest --testPathPattern="common/(logger|monitoring)/__tests__"
```

59 tests covering logger, health service, and metrics service.
