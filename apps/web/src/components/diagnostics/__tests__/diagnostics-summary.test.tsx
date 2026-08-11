import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiagnosticsSummary } from '../diagnostics-summary';
import type { DiagnosticsSnapshot } from '../diagnostics-types';

const mockSnapshot: DiagnosticsSnapshot = {
  checks: [
    { name: 'DB', status: 'pass', message: 'OK', duration: 12 },
    { name: 'Redis', status: 'pass', message: 'OK', duration: 8 },
    { name: 'Yahoo', status: 'warning', message: 'Yavaş', duration: 245 },
    { name: 'Fintables', status: 'fail', message: 'Hata', duration: 1200 },
  ],
  modules: [],
  alerts: [{ id: 'a1', type: 'FAILED_CHECK', title: 'Hata', description: 'desc', severity: 'CRITICAL', timestamp: '2026-01-15T10:00:00Z' }],
  history: [],
  overallStatus: 'fail',
  lastRun: '2026-01-15T10:00:00Z',
  totalDurationMs: 1465,
};

describe('DiagnosticsSummary', () => {
  it('renders null when no snapshot', () => {
    const { container } = render(<DiagnosticsSummary snapshot={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 8 summary cards', () => {
    render(<DiagnosticsSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('Genel Durum')).toBeDefined();
    expect(screen.getByText('Sağlıklı Modül')).toBeDefined();
    expect(screen.getByText('Uyarı Veren Modül')).toBeDefined();
    expect(screen.getByText('Hata Veren Modül')).toBeDefined();
    expect(screen.getByText('Ortalama Süre')).toBeDefined();
    expect(screen.getByText('Son Çalışma')).toBeDefined();
    expect(screen.getByText('Kritik Uyarı')).toBeDefined();
    expect(screen.getByText('Toplam Kontrol')).toBeDefined();
  });

  it('displays correct counts', () => {
    render(<DiagnosticsSummary snapshot={mockSnapshot} />);
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('4')).toBeDefined();
  });

  it('displays overall status', () => {
    render(<DiagnosticsSummary snapshot={mockSnapshot} />);
    const statusElements = screen.getAllByText('Başarısız');
    expect(statusElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays critical alert count', () => {
    render(<DiagnosticsSummary snapshot={mockSnapshot} />);
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(1);
  });

  it('displays average duration', () => {
    render(<DiagnosticsSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('366ms')).toBeDefined();
  });
});
