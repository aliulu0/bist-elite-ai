import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformancePipeline } from '../performance-pipeline';
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
  pipelines: [
    { name: 'Analysis Pipeline', totalRuns: 450, avgDurationMs: 3200, p95DurationMs: 5000, successRate: 96.5, failureRate: 3.5, stepDurations: { 'Veri Toplama': 800, 'İndikatör Hesaplama': 1200, 'Skor Hesaplama': 500, 'Rapor Oluşturma': 700 } },
  ],
  apiMetrics: [],
  cacheMetrics: { hitRate: 0, missRate: 0, evictions: 0, sizeBytes: 0, entryCount: 0, warnings: [] },
  systemMetrics: { cpuUsagePercent: 0, memoryUsageMb: 0, heapUsedMb: 0, heapTotalMb: 0, rssMb: 0, eventLoopDelayMs: 0, nodeUptimeSeconds: 0, gcRuns: 0 },
  workflowMetrics: { activeCount: 0, completedCount: 0, failedCount: 0, avgDurationMs: 0, retryCount: 0, queueLatencyMs: 0 },
  queueMetrics: { queueLength: 0, waitingCount: 0, runningCount: 0, completedCount: 0, failedCount: 0, deadLetterCount: 0, avgWaitTimeMs: 0 },
  providerMetrics: [],
  alerts: [],
  timestamp: '',
};

describe('PerformancePipeline', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformancePipeline snapshot={null} />);
    expect(screen.getByText('Pipeline metriği yok')).toBeDefined();
  });

  it('renders empty state when no pipelines', () => {
    const empty = { ...mockSnapshot, pipelines: [] };
    render(<PerformancePipeline snapshot={empty} />);
    expect(screen.getByText('Pipeline metriği yok')).toBeDefined();
  });

  it('renders pipeline name', () => {
    render(<PerformancePipeline snapshot={mockSnapshot} />);
    expect(screen.getByText('Analysis Pipeline')).toBeDefined();
  });

  it('displays run count', () => {
    render(<PerformancePipeline snapshot={mockSnapshot} />);
    expect(screen.getByText('450 çalıştırma')).toBeDefined();
  });

  it('displays avg duration', () => {
    render(<PerformancePipeline snapshot={mockSnapshot} />);
    expect(screen.getByText('3200ms')).toBeDefined();
  });

  it('displays p95 duration', () => {
    render(<PerformancePipeline snapshot={mockSnapshot} />);
    expect(screen.getByText('5000ms')).toBeDefined();
  });

  it('displays success rate', () => {
    render(<PerformancePipeline snapshot={mockSnapshot} />);
    expect(screen.getByText('%96.5')).toBeDefined();
  });

  it('shows step durations', () => {
    render(<PerformancePipeline snapshot={mockSnapshot} />);
    expect(screen.getByText('Adım Süreleri')).toBeDefined();
    expect(screen.getByText('Veri Toplama')).toBeDefined();
    expect(screen.getByText('İndikatör Hesaplama')).toBeDefined();
    expect(screen.getByText('800ms')).toBeDefined();
  });
});
