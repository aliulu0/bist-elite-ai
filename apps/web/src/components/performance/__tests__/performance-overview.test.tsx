import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceOverview } from '../performance-overview';
import type { PerformanceSnapshot } from '../performance-types';

const mockSnapshot: PerformanceSnapshot = {
  health: 'HEALTHY',
  totalRequests: 100,
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
  alerts: [{ id: 'a1', type: 'CRITICAL_WARNING', title: 'Yüksek CPU', description: 'CPU usage > 90%', severity: 'CRITICAL', source: 'system', timestamp: '2026-01-15T10:00:00Z', acknowledged: false }],
  timestamp: '2026-01-15T10:30:00Z',
};

describe('PerformanceOverview', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformanceOverview snapshot={null} />);
    expect(screen.getByText('Henüz performans verisi bulunmuyor')).toBeDefined();
  });

  it('renders system health card', () => {
    render(<PerformanceOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('Sistem Durumu')).toBeDefined();
  });

  it('renders CPU info', () => {
    render(<PerformanceOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('CPU')).toBeDefined();
    expect(screen.getByText('45.0%')).toBeDefined();
  });

  it('renders RAM info', () => {
    render(<PerformanceOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('RAM')).toBeDefined();
    expect(screen.getByText('512 MB')).toBeDefined();
  });

  it('renders heap info', () => {
    render(<PerformanceOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('Heap')).toBeDefined();
    expect(screen.getByText('200 / 512 MB')).toBeDefined();
  });

  it('renders uptime', () => {
    render(<PerformanceOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('1g 0sa')).toBeDefined();
  });

  it('renders event loop delay', () => {
    render(<PerformanceOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('2.50ms')).toBeDefined();
  });

  it('shows Turkish health status', () => {
    render(<PerformanceOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlıklı')).toBeDefined();
  });

  it('renders critical alerts section', () => {
    render(<PerformanceOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('Kritik Uyarılar')).toBeDefined();
  });

  it('shows critical alert content', () => {
    render(<PerformanceOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('Yüksek CPU')).toBeDefined();
  });

  it('shows no critical alerts message when empty', () => {
    const noAlerts = { ...mockSnapshot, alerts: [] };
    render(<PerformanceOverview snapshot={noAlerts} />);
    expect(screen.getByText('Kritik uyarı bulunmuyor')).toBeDefined();
  });
});
