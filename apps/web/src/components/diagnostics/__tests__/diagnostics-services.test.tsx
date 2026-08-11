import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiagnosticsServices } from '../diagnostics-services';
import type { DiagnosticsSnapshot } from '../diagnostics-types';

const mockSnapshot: DiagnosticsSnapshot = {
  checks: [
    { name: 'Workflow Engine', status: 'pass', message: 'OK', duration: 10 },
    { name: 'Provider Health', status: 'warning', message: 'Yavaş', duration: 200 },
  ],
  modules: [],
  alerts: [],
  history: [],
  overallStatus: 'warning',
  lastRun: null,
  totalDurationMs: 210,
};

describe('DiagnosticsServices', () => {
  it('renders empty state when no snapshot', () => {
    render(<DiagnosticsServices snapshot={null} />);
    expect(screen.getByText('Servis durumu yok')).toBeDefined();
  });

  it('renders empty state when no checks', () => {
    render(<DiagnosticsServices snapshot={{ ...mockSnapshot, checks: [] }} />);
    expect(screen.getByText('Servis durumu yok')).toBeDefined();
  });

  it('renders service names', () => {
    render(<DiagnosticsServices snapshot={mockSnapshot} />);
    expect(screen.getByText('API')).toBeDefined();
    expect(screen.getByText('İş Akışı')).toBeDefined();
    expect(screen.getByText('Kuyruk')).toBeDefined();
    expect(screen.getByText('Zamanlayıcı')).toBeDefined();
  });

  it('renders card title', () => {
    render(<DiagnosticsServices snapshot={mockSnapshot} />);
    expect(screen.getByText('Servis Durumları')).toBeDefined();
  });

  it('displays Turkish status for services with checks', () => {
    render(<DiagnosticsServices snapshot={mockSnapshot} />);
    const healthyStatuses = screen.getAllByText('Geçti');
    expect(healthyStatuses.length).toBeGreaterThanOrEqual(1);
  });
});
