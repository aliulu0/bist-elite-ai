import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceSummary } from '../performance-summary';
import { usePerformanceStore } from '@/stores/performance-store';
import type { PerformanceSnapshot } from '../performance-types';

const mockSnapshot: PerformanceSnapshot = {
  health: 'HEALTHY',
  totalRequests: 15420,
  avgLatencyMs: 120,
  p95LatencyMs: 450,
  p99LatencyMs: 1200,
  cacheHitRate: 87.5,
  workflowAvgDurationMs: 2300,
  queueAvgWaitTimeMs: 150,
  systemHealth: 'HEALTHY',
  uptime: 86400,
  engines: [],
  pipelines: [],
  apiMetrics: [],
  cacheMetrics: { hitRate: 87.5, missRate: 12.5, evictions: 3, sizeBytes: 1048576, entryCount: 120, warnings: [] },
  systemMetrics: { cpuUsagePercent: 45, memoryUsageMb: 512, heapUsedMb: 200, heapTotalMb: 512, rssMb: 300, eventLoopDelayMs: 2.5, nodeUptimeSeconds: 86400, gcRuns: 42 },
  workflowMetrics: { activeCount: 3, completedCount: 150, failedCount: 5, avgDurationMs: 2300, retryCount: 12, queueLatencyMs: 150 },
  queueMetrics: { queueLength: 8, waitingCount: 2, runningCount: 6, completedCount: 500, failedCount: 10, deadLetterCount: 2, avgWaitTimeMs: 150 },
  providerMetrics: [],
  alerts: [],
  timestamp: '2026-01-15T10:30:00Z',
};

beforeEach(() => {
  usePerformanceStore.setState({ snapshot: null });
});

describe('PerformanceSummary', () => {
  it('renders nothing when no snapshot', () => {
    const { container } = render(<PerformanceSummary snapshot={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all 8 summary cards', () => {
    render(<PerformanceSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('Toplam İstek')).toBeDefined();
    expect(screen.getByText('Ortalama Yanıt Süresi')).toBeDefined();
    expect(screen.getByText('P95')).toBeDefined();
    expect(screen.getByText('P99')).toBeDefined();
    expect(screen.getByText('Cache Hit Oranı')).toBeDefined();
    expect(screen.getByText('Workflow Süresi')).toBeDefined();
    expect(screen.getByText('Queue Süresi')).toBeDefined();
    expect(screen.getByText('Sistem Sağlığı')).toBeDefined();
  });

  it('displays correct values', () => {
    render(<PerformanceSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('15.420')).toBeDefined();
    expect(screen.getByText('120ms')).toBeDefined();
    expect(screen.getByText('450ms')).toBeDefined();
    expect(screen.getByText('1200ms')).toBeDefined();
    expect(screen.getByText('%87.5')).toBeDefined();
  });

  it('displays Turkish health status', () => {
    render(<PerformanceSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlıklı')).toBeDefined();
  });

  it('renders with unhealthy status', () => {
    const unhealthy = { ...mockSnapshot, systemHealth: 'UNHEALTHY' as const };
    render(<PerformanceSummary snapshot={unhealthy} />);
    expect(screen.getByText('Sağlıksız')).toBeDefined();
  });
});
