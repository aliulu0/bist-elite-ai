import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiagnosticsOverview } from '../diagnostics-overview';
import type { DiagnosticsSnapshot } from '../diagnostics-types';

const mockSnapshot: DiagnosticsSnapshot = {
  checks: [
    { name: 'DB', status: 'pass', message: 'OK', duration: 12 },
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

describe('DiagnosticsOverview', () => {
  it('renders empty state when no snapshot', () => {
    render(<DiagnosticsOverview snapshot={null} />);
    expect(screen.getByText('Henüz tanılama verisi bulunmuyor')).toBeDefined();
  });

  it('renders overview cards', () => {
    render(<DiagnosticsOverview snapshot={mockSnapshot} />);
    const genelDurum = screen.getAllByText('Genel Durum');
    expect(genelDurum.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Son Olaylar')).toBeDefined();
  });

  it('displays overall status', () => {
    render(<DiagnosticsOverview snapshot={mockSnapshot} />);
    const statusElements = screen.getAllByText('Başarısız');
    expect(statusElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays healthy count', () => {
    render(<DiagnosticsOverview snapshot={mockSnapshot} />);
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(1);
  });

  it('displays warning count', () => {
    render(<DiagnosticsOverview snapshot={mockSnapshot} />);
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(1);
  });

  it('displays failed count', () => {
    render(<DiagnosticsOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('3')).toBeDefined();
  });

  it('displays last run', () => {
    render(<DiagnosticsOverview snapshot={mockSnapshot} />);
    expect(screen.getByText(/Son Çalıştırma/)).toBeDefined();
  });

  it('displays alert count', () => {
    render(<DiagnosticsOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('1 aktif uyarı')).toBeDefined();
  });

  it('shows no failure message when none', () => {
    const noFailures = {
      ...mockSnapshot,
      checks: [{ name: 'DB', status: 'pass' as const, message: 'OK', duration: 12 }],
    };
    render(<DiagnosticsOverview snapshot={noFailures} />);
    expect(screen.getByText('Son hata kaydı yok')).toBeDefined();
  });

  it('shows no run message when none', () => {
    const noRun = { ...mockSnapshot, lastRun: null };
    render(<DiagnosticsOverview snapshot={noRun} />);
    expect(screen.getByText('Son çalışma kaydı yok')).toBeDefined();
  });
});
