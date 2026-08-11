import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceSystem } from '../performance-system';
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
  systemMetrics: { cpuUsagePercent: 65.3, memoryUsageMb: 768, heapUsedMb: 350, heapTotalMb: 512, rssMb: 420, eventLoopDelayMs: 3.2, nodeUptimeSeconds: 172800, gcRuns: 85 },
  workflowMetrics: { activeCount: 0, completedCount: 0, failedCount: 0, avgDurationMs: 0, retryCount: 0, queueLatencyMs: 0 },
  queueMetrics: { queueLength: 0, waitingCount: 0, runningCount: 0, completedCount: 0, failedCount: 0, deadLetterCount: 0, avgWaitTimeMs: 0 },
  providerMetrics: [],
  alerts: [],
  timestamp: '',
};

describe('PerformanceSystem', () => {
  it('renders empty state when no snapshot', () => {
    render(<PerformanceSystem snapshot={null} />);
    expect(screen.getByText('Sistem sağlığı verisi yok')).toBeDefined();
  });

  it('renders CPU section', () => {
    render(<PerformanceSystem snapshot={mockSnapshot} />);
    expect(screen.getByText('CPU Kullanımı')).toBeDefined();
    expect(screen.getByText('65.3%')).toBeDefined();
  });

  it('renders memory section', () => {
    render(<PerformanceSystem snapshot={mockSnapshot} />);
    expect(screen.getByText('Bellek Kullanımı')).toBeDefined();
    expect(screen.getByText('768 MB')).toBeDefined();
  });

  it('renders heap info', () => {
    render(<PerformanceSystem snapshot={mockSnapshot} />);
    expect(screen.getByText('Heap Kullanımı')).toBeDefined();
    expect(screen.getByText('350 / 512 MB')).toBeDefined();
  });

  it('renders RSS', () => {
    render(<PerformanceSystem snapshot={mockSnapshot} />);
    expect(screen.getByText('RSS')).toBeDefined();
    expect(screen.getByText('420.0 MB')).toBeDefined();
  });

  it('renders event loop delay', () => {
    render(<PerformanceSystem snapshot={mockSnapshot} />);
    expect(screen.getByText('Event Loop Gecikmesi')).toBeDefined();
    expect(screen.getByText('3.20ms')).toBeDefined();
  });

  it('renders GC runs', () => {
    render(<PerformanceSystem snapshot={mockSnapshot} />);
    expect(screen.getByText('GC Çalıştırma')).toBeDefined();
    expect(screen.getByText('85')).toBeDefined();
  });

  it('renders node uptime in days', () => {
    render(<PerformanceSystem snapshot={mockSnapshot} />);
    expect(screen.getByText('Node Çalışma Süresi')).toBeDefined();
    expect(screen.getByText('2g 0sa')).toBeDefined();
  });
});
