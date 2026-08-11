import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceEngine } from '../performance-engine';
import { usePerformanceStore } from '@/stores/performance-store';
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
  engines: [
    { name: 'financial', totalCalls: 500, avgDurationMs: 45, p95DurationMs: 120, p99DurationMs: 250, successRate: 98.5, errorCount: 7, lastExecutedAt: '2026-01-15T10:00:00Z' },
    { name: 'technical', totalCalls: 800, avgDurationMs: 80, p95DurationMs: 200, p99DurationMs: 350, successRate: 95.2, errorCount: 38, lastExecutedAt: '2026-01-15T10:00:00Z' },
  ],
  pipelines: [],
  apiMetrics: [],
  cacheMetrics: { hitRate: 0, missRate: 0, evictions: 0, sizeBytes: 0, entryCount: 0, warnings: [] },
  systemMetrics: { cpuUsagePercent: 0, memoryUsageMb: 0, heapUsedMb: 0, heapTotalMb: 0, rssMb: 0, eventLoopDelayMs: 0, nodeUptimeSeconds: 0, gcRuns: 0 },
  workflowMetrics: { activeCount: 0, completedCount: 0, failedCount: 0, avgDurationMs: 0, retryCount: 0, queueLatencyMs: 0 },
  queueMetrics: { queueLength: 0, waitingCount: 0, runningCount: 0, completedCount: 0, failedCount: 0, deadLetterCount: 0, avgWaitTimeMs: 0 },
  providerMetrics: [],
  alerts: [],
  timestamp: '',
};

beforeEach(() => {
  usePerformanceStore.setState({ search: '', sortKey: 'name', sortDir: 'asc' });
});

describe('PerformanceEngine', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformanceEngine snapshot={null} />);
    expect(screen.getByText('Motor metriği yok')).toBeDefined();
  });

  it('renders empty state when no engines', () => {
    const empty = { ...mockSnapshot, engines: [] };
    render(<PerformanceEngine snapshot={empty} />);
    expect(screen.getByText('Motor metriği yok')).toBeDefined();
  });

  it('renders engine cards', () => {
    render(<PerformanceEngine snapshot={mockSnapshot} />);
    expect(screen.getByText('Finansal')).toBeDefined();
    expect(screen.getByText('Teknik')).toBeDefined();
  });

  it('displays call counts', () => {
    render(<PerformanceEngine snapshot={mockSnapshot} />);
    expect(screen.getByText('500 çağrı')).toBeDefined();
    expect(screen.getByText('800 çağrı')).toBeDefined();
  });

  it('displays avg duration', () => {
    render(<PerformanceEngine snapshot={mockSnapshot} />);
    expect(screen.getByText('45ms')).toBeDefined();
    expect(screen.getByText('80ms')).toBeDefined();
  });

  it('displays p95 duration', () => {
    render(<PerformanceEngine snapshot={mockSnapshot} />);
    expect(screen.getByText('120ms')).toBeDefined();
    expect(screen.getByText('200ms')).toBeDefined();
  });

  it('displays error counts', () => {
    render(<PerformanceEngine snapshot={mockSnapshot} />);
    const errorElements = screen.getAllByText(/^(7|38)$/);
    expect(errorElements.length).toBeGreaterThanOrEqual(1);
  });
});
