import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiagnosticsChecks } from '../diagnostics-checks';
import type { DiagnosticsSnapshot } from '../diagnostics-types';

const mockSnapshot: DiagnosticsSnapshot = {
  checks: [
    { name: 'Database', status: 'pass', message: 'Bağlantı aktif', duration: 12, category: 'performance' },
    { name: 'Redis', status: 'warning', message: 'Yavaş', duration: 80, category: 'performance' },
    { name: 'Workflow Engine', status: 'fail', message: 'Başarısız', duration: 500, category: 'workflow' },
  ],
  modules: [],
  alerts: [],
  history: [],
  overallStatus: 'fail',
  lastRun: null,
  totalDurationMs: 592,
};

describe('DiagnosticsChecks', () => {
  it('renders empty state when no snapshot', () => {
    render(<DiagnosticsChecks snapshot={null} />);
    expect(screen.getByText('Kontrol sonucu yok')).toBeDefined();
  });

  it('renders empty state when no checks', () => {
    render(<DiagnosticsChecks snapshot={{ ...mockSnapshot, checks: [] }} />);
    expect(screen.getByText('Kontrol sonucu yok')).toBeDefined();
  });

  it('renders table header', () => {
    render(<DiagnosticsChecks snapshot={mockSnapshot} />);
    expect(screen.getByText('Kontrol')).toBeDefined();
    expect(screen.getByText('Durum')).toBeDefined();
    expect(screen.getByText('Süre')).toBeDefined();
    expect(screen.getByText('Mesaj')).toBeDefined();
  });

  it('renders check names', () => {
    render(<DiagnosticsChecks snapshot={mockSnapshot} />);
    expect(screen.getByText('Database')).toBeDefined();
    expect(screen.getByText('Redis')).toBeDefined();
    expect(screen.getByText('Workflow Engine')).toBeDefined();
  });

  it('renders status badges', () => {
    render(<DiagnosticsChecks snapshot={mockSnapshot} />);
    expect(screen.getByText('Geçti')).toBeDefined();
    expect(screen.getByText('Uyarı')).toBeDefined();
    const failElements = screen.getAllByText('Başarısız');
    expect(failElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays duration values', () => {
    render(<DiagnosticsChecks snapshot={mockSnapshot} />);
    expect(screen.getByText('12ms')).toBeDefined();
    expect(screen.getByText('80ms')).toBeDefined();
  });

  it('sorts by column click', () => {
    render(<DiagnosticsChecks snapshot={mockSnapshot} />);
    fireEvent.click(screen.getByText('Süre'));
    const cells = screen.getAllByText(/ms$/);
    expect(cells.length).toBeGreaterThanOrEqual(2);
  });

  it('renders card title', () => {
    render(<DiagnosticsChecks snapshot={mockSnapshot} />);
    expect(screen.getByText('Kontrol Sonuçları')).toBeDefined();
  });

  it('filters by category', () => {
    render(<DiagnosticsChecks snapshot={mockSnapshot} filterCategory="workflow" />);
    expect(screen.getByText('Workflow Engine')).toBeDefined();
    expect(screen.queryByText('Database')).toBeNull();
  });
});
