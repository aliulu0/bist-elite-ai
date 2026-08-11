import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiagnosticsExport } from '../diagnostics-export';
import type { DiagnosticsSnapshot } from '../diagnostics-types';

const mockSnapshot: DiagnosticsSnapshot = {
  checks: [{ name: 'Test', status: 'pass', message: 'OK', duration: 10 }],
  modules: [],
  alerts: [],
  history: [],
  overallStatus: 'pass',
  lastRun: null,
  totalDurationMs: 10,
};

describe('DiagnosticsExport', () => {
  it('renders export buttons', () => {
    render(<DiagnosticsExport snapshot={mockSnapshot} />);
    expect(screen.getByText('JSON')).toBeDefined();
    expect(screen.getByText('CSV')).toBeDefined();
    expect(screen.getByText('PDF')).toBeDefined();
  });

  it('disables buttons when no snapshot', () => {
    render(<DiagnosticsExport snapshot={null} />);
    const jsonBtn = screen.getByText('JSON').closest('button')!;
    const csvBtn = screen.getByText('CSV').closest('button')!;
    const pdfBtn = screen.getByText('PDF').closest('button')!;
    expect(jsonBtn.disabled).toBe(true);
    expect(csvBtn.disabled).toBe(true);
    expect(pdfBtn.disabled).toBe(true);
  });

  it('enables buttons when snapshot exists', () => {
    render(<DiagnosticsExport snapshot={mockSnapshot} />);
    const jsonBtn = screen.getByText('JSON').closest('button')!;
    expect(jsonBtn.disabled).toBe(false);
  });

  it('renders description', () => {
    render(<DiagnosticsExport snapshot={mockSnapshot} />);
    expect(screen.getByText('Tanılama verilerini dışa aktarın')).toBeDefined();
  });
});
