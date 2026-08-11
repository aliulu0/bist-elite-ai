import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiagnosticsHistory } from '../diagnostics-history';
import type { DiagnosticsSnapshot } from '../diagnostics-types';

const mockSnapshot: DiagnosticsSnapshot = {
  checks: [],
  modules: [],
  alerts: [],
  history: [
    { id: 'h1', timestamp: '2026-01-15T10:00:00Z', module: 'Workflow', status: 'pass', duration: 120, message: 'Tamamlandı' },
    { id: 'h2', timestamp: '2026-01-15T09:00:00Z', module: 'Scheduler', status: 'fail', duration: 500, message: 'Zaman aşımı' },
  ],
  overallStatus: 'fail',
  lastRun: null,
  totalDurationMs: 620,
};

describe('DiagnosticsHistory', () => {
  it('renders empty state when no snapshot', () => {
    render(<DiagnosticsHistory snapshot={null} />);
    expect(screen.getByText('Geçmiş kayıt yok')).toBeDefined();
  });

  it('renders empty state when no history', () => {
    render(<DiagnosticsHistory snapshot={{ ...mockSnapshot, history: [] }} />);
    expect(screen.getByText('Geçmiş kayıt yok')).toBeDefined();
  });

  it('renders history entries', () => {
    render(<DiagnosticsHistory snapshot={mockSnapshot} />);
    expect(screen.getByText('İş Akışı')).toBeDefined();
    expect(screen.getByText('Zamanlayıcı')).toBeDefined();
  });

  it('renders card title', () => {
    render(<DiagnosticsHistory snapshot={mockSnapshot} />);
    expect(screen.getByText('Tanılama Geçmişi')).toBeDefined();
  });

  it('displays messages', () => {
    render(<DiagnosticsHistory snapshot={mockSnapshot} />);
    expect(screen.getByText('Tamamlandı')).toBeDefined();
    expect(screen.getByText('Zaman aşımı')).toBeDefined();
  });

  it('displays durations', () => {
    render(<DiagnosticsHistory snapshot={mockSnapshot} />);
    expect(screen.getByText('120ms')).toBeDefined();
    expect(screen.getByText('500ms')).toBeDefined();
  });

  it('displays status badges', () => {
    render(<DiagnosticsHistory snapshot={mockSnapshot} />);
    expect(screen.getByText('Geçti')).toBeDefined();
    expect(screen.getByText('Başarısız')).toBeDefined();
  });
});
