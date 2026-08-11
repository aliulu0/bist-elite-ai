import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiagnosticsPerformance } from '../diagnostics-performance';
import type { DiagnosticsSnapshot } from '../diagnostics-types';

const mockSnapshot: DiagnosticsSnapshot = {
  checks: [
    { name: 'A', status: 'pass', message: '', duration: 10 },
    { name: 'B', status: 'pass', message: '', duration: 20 },
    { name: 'C', status: 'fail', message: '', duration: 100 },
    { name: 'D', status: 'warning', message: '', duration: 50 },
    { name: 'E', status: 'pass', message: '', duration: 15 },
  ],
  modules: [],
  alerts: [],
  history: [],
  overallStatus: 'fail',
  lastRun: null,
  totalDurationMs: 195,
};

describe('DiagnosticsPerformance', () => {
  it('renders empty state when no snapshot', () => {
    render(<DiagnosticsPerformance snapshot={null} />);
    expect(screen.getByText('Performans verisi yok')).toBeDefined();
  });

  it('renders empty state when no checks', () => {
    render(<DiagnosticsPerformance snapshot={{ ...mockSnapshot, checks: [] }} />);
    expect(screen.getByText('Performans verisi yok')).toBeDefined();
  });

  it('renders performance metrics', () => {
    render(<DiagnosticsPerformance snapshot={mockSnapshot} />);
    expect(screen.getByText('Performans Metrikleri')).toBeDefined();
  });

  it('displays total duration', () => {
    render(<DiagnosticsPerformance snapshot={mockSnapshot} />);
    expect(screen.getByText('195ms')).toBeDefined();
  });

  it('displays average duration', () => {
    render(<DiagnosticsPerformance snapshot={mockSnapshot} />);
    expect(screen.getByText('39ms')).toBeDefined();
  });

  it('displays P95', () => {
    render(<DiagnosticsPerformance snapshot={mockSnapshot} />);
    const p95Elements = screen.getAllByText('100ms');
    expect(p95Elements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays failure rate', () => {
    render(<DiagnosticsPerformance snapshot={mockSnapshot} />);
    const rateElements = screen.getAllByText('20.0%');
    expect(rateElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays warning rate', () => {
    render(<DiagnosticsPerformance snapshot={mockSnapshot} />);
    const rateElements = screen.getAllByText('20.0%');
    expect(rateElements.length).toBeGreaterThanOrEqual(2);
  });

  it('shows zero values for empty checks', () => {
    const emptySnapshot = { ...mockSnapshot, checks: [{ name: 'A', status: 'pass' as const, message: '', duration: 0 }] };
    render(<DiagnosticsPerformance snapshot={emptySnapshot} />);
    const zeroElements = screen.getAllByText('0ms');
    expect(zeroElements.length).toBeGreaterThanOrEqual(1);
  });
});
