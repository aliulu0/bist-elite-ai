import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiagnosticsAlerts } from '../diagnostics-alerts';
import type { DiagnosticsSnapshot } from '../diagnostics-types';

const mockSnapshot: DiagnosticsSnapshot = {
  checks: [],
  modules: [],
  alerts: [
    { id: 'a1', type: 'FAILED_CHECK', title: 'Başarısız Kontrol', description: 'DB bağlantısı kesildi', severity: 'CRITICAL', timestamp: '2026-01-15T10:00:00Z' },
    { id: 'a2', type: 'DEGRADED', title: 'Bozulmuş Modül', description: 'Fintables yavaş', severity: 'WARNING', timestamp: '2026-01-15T10:05:00Z' },
    { id: 'a3', type: 'TIMEOUT', title: 'Zaman Aşımı', description: 'Workflow zaman aşımı', severity: 'WARNING', timestamp: '2026-01-15T10:10:00Z' },
  ],
  history: [],
  overallStatus: 'fail',
  lastRun: null,
  totalDurationMs: 0,
};

describe('DiagnosticsAlerts', () => {
  it('renders empty state when no snapshot', () => {
    render(<DiagnosticsAlerts snapshot={null} />);
    expect(screen.getByText('Uyarı bulunmuyor')).toBeDefined();
  });

  it('renders empty state when no alerts', () => {
    render(<DiagnosticsAlerts snapshot={{ ...mockSnapshot, alerts: [] }} />);
    expect(screen.getByText('Uyarı bulunmuyor')).toBeDefined();
  });

  it('renders alerts', () => {
    render(<DiagnosticsAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Başarısız Kontrol')).toBeDefined();
    expect(screen.getByText('Bozulmuş Modül')).toBeDefined();
  });

  it('renders card title', () => {
    render(<DiagnosticsAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Tanılama Uyarıları')).toBeDefined();
  });

  it('displays descriptions', () => {
    render(<DiagnosticsAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('DB bağlantısı kesildi')).toBeDefined();
    expect(screen.getByText('Fintables yavaş')).toBeDefined();
  });

  it('displays timeout alerts', () => {
    render(<DiagnosticsAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Zaman Aşımı')).toBeDefined();
  });

  it('applies critical severity styling', () => {
    render(<DiagnosticsAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Başarısız Kontrol')).toBeDefined();
  });
});
