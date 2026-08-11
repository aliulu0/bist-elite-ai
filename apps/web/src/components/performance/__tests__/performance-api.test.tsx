import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceApi } from '../performance-api';
import type { PerformanceSnapshot } from '../performance-types';

const mockSnapshot: PerformanceSnapshot = {
  health: 'HEALTHY',
  totalRequests: 0,
  avgLatencyMs: 0,
  p95LatencyMs: 0,
  p99LatencyMs: 0,
  cacheHitRate: 0,
  workflowAvgDurationMs: 0,
  queueAvgWaitTimeMs: 0,
  systemHealth: 'HEALTHY',
  uptime: 0,
  engines: [],
  pipelines: [],
  apiMetrics: [
    { endpoint: '/api/analysis/GARAN', method: 'GET', count: 320, avgLatencyMs: 450, p95LatencyMs: 1200, p99LatencyMs: 2500, successRate: 98.5, errorRate: 1.5, lastAccessedAt: '2026-01-15T10:00:00Z' },
    { endpoint: '/api/scanner/scan', method: 'POST', count: 150, avgLatencyMs: 1200, p95LatencyMs: 3000, p99LatencyMs: 5000, successRate: 95.0, errorRate: 5.0, lastAccessedAt: '2026-01-15T10:00:00Z' },
  ],
  cacheMetrics: { hitRate: 0, missRate: 0, evictions: 0, sizeBytes: 0, entryCount: 0, warnings: [] },
  systemMetrics: { cpuUsagePercent: 0, memoryUsageMb: 0, heapUsedMb: 0, heapTotalMb: 0, rssMb: 0, eventLoopDelayMs: 0, nodeUptimeSeconds: 0, gcRuns: 0 },
  workflowMetrics: { activeCount: 0, completedCount: 0, failedCount: 0, avgDurationMs: 0, retryCount: 0, queueLatencyMs: 0 },
  queueMetrics: { queueLength: 0, waitingCount: 0, runningCount: 0, completedCount: 0, failedCount: 0, deadLetterCount: 0, avgWaitTimeMs: 0 },
  providerMetrics: [],
  alerts: [],
  timestamp: '',
};

describe('PerformanceApi', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformanceApi snapshot={null} />);
    expect(screen.getByText('API metriği bulunmuyor')).toBeDefined();
  });

  it('renders empty state when no metrics', () => {
    const empty = { ...mockSnapshot, apiMetrics: [] };
    render(<PerformanceApi snapshot={empty} />);
    expect(screen.getByText('API metriği bulunmuyor')).toBeDefined();
  });

  it('renders top slow endpoints card', () => {
    render(<PerformanceApi snapshot={mockSnapshot} />);
    expect(screen.getByText('Top Slow Endpoints')).toBeDefined();
  });

  it('displays endpoint info', () => {
    render(<PerformanceApi snapshot={mockSnapshot} />);
    expect(screen.getByText('/api/scanner/scan')).toBeDefined();
    expect(screen.getByText('/api/analysis/GARAN')).toBeDefined();
  });

  it('displays method badges', () => {
    render(<PerformanceApi snapshot={mockSnapshot} />);
    const getMethods = screen.getAllByText('GET');
    const postMethods = screen.getAllByText('POST');
    expect(getMethods.length).toBeGreaterThanOrEqual(1);
    expect(postMethods.length).toBeGreaterThanOrEqual(1);
  });

  it('displays request counts', () => {
    render(<PerformanceApi snapshot={mockSnapshot} />);
    expect(screen.getByText(/320 istek/)).toBeDefined();
    expect(screen.getByText(/150 istek/)).toBeDefined();
  });

  it('sorts by latency descending', () => {
    render(<PerformanceApi snapshot={mockSnapshot} />);
    const endpoints = screen.getAllByText(/\/api\//);
    expect(endpoints[0].textContent).toContain('/api/scanner/scan');
  });
});
