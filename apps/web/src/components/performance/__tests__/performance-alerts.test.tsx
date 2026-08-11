import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceAlerts } from '../performance-alerts';
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
  providerMetrics: [],
  alerts: [
    { id: 'a1', type: 'SLOW_ENDPOINT', title: 'Yavaş Endpoint', description: '/api/scan ortalama 5s', severity: 'WARNING', source: 'api', timestamp: '2026-01-15T10:00:00Z', acknowledged: false },
    { id: 'a2', type: 'HIGH_MEMORY', title: 'Yüksek Bellek', description: 'Bellek kullanımı 90%', severity: 'CRITICAL', source: 'system', timestamp: '2026-01-15T10:00:00Z', acknowledged: false },
  ],
  timestamp: '',
};

describe('PerformanceAlerts', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformanceAlerts snapshot={null} />);
    expect(screen.getByText('Performans uyarısı yok')).toBeDefined();
  });

  it('renders empty state when no alerts', () => {
    const empty = { ...mockSnapshot, alerts: [] };
    render(<PerformanceAlerts snapshot={empty} />);
    expect(screen.getByText('Performans uyarısı yok')).toBeDefined();
  });

  it('renders alert titles', () => {
    render(<PerformanceAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Yavaş Endpoint')).toBeDefined();
    expect(screen.getByText('Yüksek Bellek')).toBeDefined();
  });

  it('renders alert descriptions', () => {
    render(<PerformanceAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('/api/scan ortalama 5s')).toBeDefined();
    expect(screen.getByText('Bellek kullanımı 90%')).toBeDefined();
  });

  it('renders severity labels in Turkish', () => {
    render(<PerformanceAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('UYARI')).toBeDefined();
    expect(screen.getByText('KRİTİK')).toBeDefined();
  });

  it('renders source info', () => {
    render(<PerformanceAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Kaynak: api')).toBeDefined();
    expect(screen.getByText('Kaynak: system')).toBeDefined();
  });

  it('renders timestamps', () => {
    render(<PerformanceAlerts snapshot={mockSnapshot} />);
    expect(screen.getAllByText(/2026/).length).toBeGreaterThanOrEqual(1);
  });
});
