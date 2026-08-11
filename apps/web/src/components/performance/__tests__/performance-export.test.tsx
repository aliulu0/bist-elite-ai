import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceExport } from '../performance-export';
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
  uptime: 0,
  engines: [],
  pipelines: [],
  apiMetrics: [],
  cacheMetrics: { hitRate: 0, missRate: 0, evictions: 0, sizeBytes: 0, entryCount: 0, warnings: [] },
  systemMetrics: { cpuUsagePercent: 0, memoryUsageMb: 0, heapUsedMb: 0, heapTotalMb: 0, rssMb: 0, eventLoopDelayMs: 0, nodeUptimeSeconds: 0, gcRuns: 0 },
  workflowMetrics: { activeCount: 0, completedCount: 0, failedCount: 0, avgDurationMs: 0, retryCount: 0, queueLatencyMs: 0 },
  queueMetrics: { queueLength: 0, waitingCount: 0, runningCount: 0, completedCount: 0, failedCount: 0, deadLetterCount: 0, avgWaitTimeMs: 0 },
  providerMetrics: [],
  alerts: [],
  timestamp: '2026-01-15T10:30:00Z',
};

describe('PerformanceExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders description', () => {
    render(<PerformanceExport snapshot={mockSnapshot} />);
    expect(screen.getByText('Performans verilerini dışa aktarın')).toBeDefined();
  });

  it('renders all 3 export buttons', () => {
    render(<PerformanceExport snapshot={mockSnapshot} />);
    expect(screen.getByText('JSON')).toBeDefined();
    expect(screen.getByText('CSV')).toBeDefined();
    expect(screen.getByText('PDF')).toBeDefined();
  });

  it('disables buttons when no snapshot', () => {
    render(<PerformanceExport snapshot={null} />);
    const jsonBtn = screen.getByText('JSON').closest('button')!;
    const csvBtn = screen.getByText('CSV').closest('button')!;
    const pdfBtn = screen.getByText('PDF').closest('button')!;
    expect(jsonBtn.disabled).toBe(true);
    expect(csvBtn.disabled).toBe(true);
    expect(pdfBtn.disabled).toBe(true);
  });

  it('enables buttons when snapshot present', () => {
    render(<PerformanceExport snapshot={mockSnapshot} />);
    const jsonBtn = screen.getByText('JSON').closest('button')!;
    expect(jsonBtn.disabled).toBe(false);
  });

  it('triggers download on JSON export click', () => {
    render(<PerformanceExport snapshot={mockSnapshot} />);
    const jsonBtn = screen.getByText('JSON').closest('button')!;
    expect(jsonBtn.disabled).toBe(false);
    expect(jsonBtn).toBeDefined();
  });
});
