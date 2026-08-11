import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceWorkflow } from '../performance-workflow';
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
  workflowMetrics: { activeCount: 5, completedCount: 320, failedCount: 12, avgDurationMs: 4500, retryCount: 28, queueLatencyMs: 200 },
  queueMetrics: { queueLength: 0, waitingCount: 0, runningCount: 0, completedCount: 0, failedCount: 0, deadLetterCount: 0, avgWaitTimeMs: 0 },
  providerMetrics: [],
  alerts: [],
  timestamp: '',
};

describe('PerformanceWorkflow', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformanceWorkflow snapshot={null} />);
    expect(screen.getByText('Workflow verisi yok')).toBeDefined();
  });

  it('renders active count', () => {
    render(<PerformanceWorkflow snapshot={mockSnapshot} />);
    expect(screen.getByText('Aktif')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });

  it('renders completed count', () => {
    render(<PerformanceWorkflow snapshot={mockSnapshot} />);
    expect(screen.getByText('Tamamlanan')).toBeDefined();
    expect(screen.getByText('320')).toBeDefined();
  });

  it('renders failed count', () => {
    render(<PerformanceWorkflow snapshot={mockSnapshot} />);
    expect(screen.getByText('Başarısız')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
  });

  it('renders avg duration', () => {
    render(<PerformanceWorkflow snapshot={mockSnapshot} />);
    expect(screen.getByText('Ortalama Süre')).toBeDefined();
    expect(screen.getByText('4500ms')).toBeDefined();
  });

  it('renders retry count', () => {
    render(<PerformanceWorkflow snapshot={mockSnapshot} />);
    expect(screen.getByText('Yeniden Deneme')).toBeDefined();
    expect(screen.getByText('28')).toBeDefined();
  });

  it('renders queue latency', () => {
    render(<PerformanceWorkflow snapshot={mockSnapshot} />);
    expect(screen.getByText('Kuyruk Gecikmesi')).toBeDefined();
    expect(screen.getByText('200ms')).toBeDefined();
  });
});
