import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceCache } from '../performance-cache';
import type { PerformanceSnapshot } from '../performance-types';

const mockSnapshot: PerformanceSnapshot = {
  health: 'HEALTHY',
  totalRequests: 0,
  avgLatencyMs: 0,
  p95LatencyMs: 0,
  p99LatencyMs: 0,
  cacheHitRate: 87.5,
  workflowAvgDurationMs: 0,
  queueAvgWaitTimeMs: 0,
  systemHealth: 'HEALTHY',
  uptime: 0,
  engines: [],
  pipelines: [],
  apiMetrics: [],
  cacheMetrics: { hitRate: 87.5, missRate: 12.5, evictions: 3, sizeBytes: 1048576, entryCount: 120, warnings: ['Cache boyutu eşik değerine yaklaşıyor'] },
  systemMetrics: { cpuUsagePercent: 0, memoryUsageMb: 0, heapUsedMb: 0, heapTotalMb: 0, rssMb: 0, eventLoopDelayMs: 0, nodeUptimeSeconds: 0, gcRuns: 0 },
  workflowMetrics: { activeCount: 0, completedCount: 0, failedCount: 0, avgDurationMs: 0, retryCount: 0, queueLatencyMs: 0 },
  queueMetrics: { queueLength: 0, waitingCount: 0, runningCount: 0, completedCount: 0, failedCount: 0, deadLetterCount: 0, avgWaitTimeMs: 0 },
  providerMetrics: [],
  alerts: [],
  timestamp: '',
};

describe('PerformanceCache', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformanceCache snapshot={null} />);
    expect(screen.getByText('Önbellek verisi yok')).toBeDefined();
  });

  it('renders hit rate', () => {
    render(<PerformanceCache snapshot={mockSnapshot} />);
    expect(screen.getByText('Hit Oranı')).toBeDefined();
    expect(screen.getByText('87.5%')).toBeDefined();
  });

  it('renders miss rate', () => {
    render(<PerformanceCache snapshot={mockSnapshot} />);
    expect(screen.getByText('Miss Oranı')).toBeDefined();
    expect(screen.getByText('12.5%')).toBeDefined();
  });

  it('renders evictions', () => {
    render(<PerformanceCache snapshot={mockSnapshot} />);
    expect(screen.getByText('Eviction Sayısı')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('renders cache size in bytes', () => {
    render(<PerformanceCache snapshot={mockSnapshot} />);
    expect(screen.getByText('Önbellek Boyutu')).toBeDefined();
    expect(screen.getByText('1 MB')).toBeDefined();
  });

  it('renders entry count', () => {
    render(<PerformanceCache snapshot={mockSnapshot} />);
    expect(screen.getByText('Girdi Sayısı')).toBeDefined();
    expect(screen.getByText('120')).toBeDefined();
  });

  it('renders cache warnings', () => {
    render(<PerformanceCache snapshot={mockSnapshot} />);
    expect(screen.getByText('Cache Uyarıları')).toBeDefined();
    expect(screen.getByText('Cache boyutu eşik değerine yaklaşıyor')).toBeDefined();
  });

  it('does not show warnings when none exist', () => {
    const noWarnings = { ...mockSnapshot, cacheMetrics: { ...mockSnapshot.cacheMetrics, warnings: [] } };
    render(<PerformanceCache snapshot={noWarnings} />);
    expect(screen.queryByText('Cache Uyarıları')).toBeNull();
  });

  it('renders status as Aktif', () => {
    render(<PerformanceCache snapshot={mockSnapshot} />);
    expect(screen.getByText('Aktif')).toBeDefined();
  });
});
