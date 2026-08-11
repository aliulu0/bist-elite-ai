import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceQueue } from '../performance-queue';
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
  queueMetrics: { queueLength: 25, waitingCount: 8, runningCount: 12, completedCount: 1500, failedCount: 45, deadLetterCount: 3, avgWaitTimeMs: 350 },
  providerMetrics: [],
  alerts: [],
  timestamp: '',
};

describe('PerformanceQueue', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformanceQueue snapshot={null} />);
    expect(screen.getByText('Kuyruk verisi yok')).toBeDefined();
  });

  it('renders queue length', () => {
    render(<PerformanceQueue snapshot={mockSnapshot} />);
    expect(screen.getByText('Kuyruk Uzunluğu')).toBeDefined();
    expect(screen.getByText('25')).toBeDefined();
  });

  it('renders waiting count', () => {
    render(<PerformanceQueue snapshot={mockSnapshot} />);
    expect(screen.getByText('Bekleyen')).toBeDefined();
    expect(screen.getByText('8')).toBeDefined();
  });

  it('renders running count', () => {
    render(<PerformanceQueue snapshot={mockSnapshot} />);
    expect(screen.getByText('Çalışan')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
  });

  it('renders completed count', () => {
    render(<PerformanceQueue snapshot={mockSnapshot} />);
    expect(screen.getByText('1500')).toBeDefined();
  });

  it('renders failed count', () => {
    render(<PerformanceQueue snapshot={mockSnapshot} />);
    expect(screen.getByText('45')).toBeDefined();
  });

  it('renders dead letter count', () => {
    render(<PerformanceQueue snapshot={mockSnapshot} />);
    expect(screen.getByText('Ölü Mektup')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('renders avg wait time', () => {
    render(<PerformanceQueue snapshot={mockSnapshot} />);
    expect(screen.getByText('Ortalama Bekleme Süresi')).toBeDefined();
    expect(screen.getByText('350ms')).toBeDefined();
  });
});
