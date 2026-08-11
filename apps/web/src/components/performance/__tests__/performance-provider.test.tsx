import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceProvider } from '../performance-provider';
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
  apiMetrics: [],
  cacheMetrics: { hitRate: 0, missRate: 0, evictions: 0, sizeBytes: 0, entryCount: 0, warnings: [] },
  systemMetrics: { cpuUsagePercent: 0, memoryUsageMb: 0, heapUsedMb: 0, heapTotalMb: 0, rssMb: 0, eventLoopDelayMs: 0, nodeUptimeSeconds: 0, gcRuns: 0 },
  workflowMetrics: { activeCount: 0, completedCount: 0, failedCount: 0, avgDurationMs: 0, retryCount: 0, queueLatencyMs: 0 },
  queueMetrics: { queueLength: 0, waitingCount: 0, runningCount: 0, completedCount: 0, failedCount: 0, deadLetterCount: 0, avgWaitTimeMs: 0 },
  providerMetrics: [
    { name: 'Yahoo Finance', status: 'HEALTHY', latencyMs: 120, reliabilityScore: 98.5, failureCount: 3, lastCheckAt: '2026-01-15T10:00:00Z' },
    { name: 'Fintables', status: 'DEGRADED', latencyMs: 450, reliabilityScore: 85.2, failureCount: 15, lastCheckAt: '2026-01-15T10:00:00Z' },
  ],
  alerts: [],
  timestamp: '',
};

describe('PerformanceProvider', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformanceProvider snapshot={null} />);
    expect(screen.getByText('Sağlayıcı verisi yok')).toBeDefined();
  });

  it('renders empty state when no providers', () => {
    const empty = { ...mockSnapshot, providerMetrics: [] };
    render(<PerformanceProvider snapshot={empty} />);
    expect(screen.getByText('Sağlayıcı verisi yok')).toBeDefined();
  });

  it('renders provider names', () => {
    render(<PerformanceProvider snapshot={mockSnapshot} />);
    expect(screen.getByText('Yahoo Finance')).toBeDefined();
    expect(screen.getByText('Fintables')).toBeDefined();
  });

  it('renders health status in Turkish', () => {
    render(<PerformanceProvider snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlıklı')).toBeDefined();
    expect(screen.getByText('Bozulmuş')).toBeDefined();
  });

  it('displays latency', () => {
    render(<PerformanceProvider snapshot={mockSnapshot} />);
    expect(screen.getByText('120ms')).toBeDefined();
    expect(screen.getByText('450ms')).toBeDefined();
  });

  it('displays reliability score', () => {
    render(<PerformanceProvider snapshot={mockSnapshot} />);
    expect(screen.getByText('%98.5')).toBeDefined();
    expect(screen.getByText('%85.2')).toBeDefined();
  });

  it('displays failure counts', () => {
    render(<PerformanceProvider snapshot={mockSnapshot} />);
    const failureElements = screen.getAllByText(/^(3|15)$/);
    expect(failureElements.length).toBeGreaterThanOrEqual(1);
  });
});
