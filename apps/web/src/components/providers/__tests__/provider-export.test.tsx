import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderExport } from '../provider-export';
import type { ProviderHealthSnapshot } from '../provider-types';

const mockSnapshot: ProviderHealthSnapshot = {
  providers: [
    { name: 'Yahoo', status: 'HEALTHY', latencyMs: 120, successRate: 98.5, errorRate: 1.5, reliabilityScore: 97.2, consecutiveFailures: 0, totalRequests: 1240, failedRequests: 18, timeoutCount: 2, lastSuccessAt: null, lastFailureAt: null, lastRecoveryAt: null, recoveryTimeMs: null },
  ],
  latencyHistory: {},
  alerts: [],
  failoverOrder: [],
  lastUpdate: null,
};

describe('ProviderExport', () => {
  it('renders export buttons', () => {
    render(<ProviderExport snapshot={mockSnapshot} />);
    expect(screen.getByText('JSON')).toBeDefined();
    expect(screen.getByText('CSV')).toBeDefined();
    expect(screen.getByText('PDF')).toBeDefined();
  });

  it('disables buttons when no snapshot', () => {
    render(<ProviderExport snapshot={null} />);
    const jsonBtn = screen.getByText('JSON').closest('button')!;
    const csvBtn = screen.getByText('CSV').closest('button')!;
    const pdfBtn = screen.getByText('PDF').closest('button')!;
    expect(jsonBtn.disabled).toBe(true);
    expect(csvBtn.disabled).toBe(true);
    expect(pdfBtn.disabled).toBe(true);
  });

  it('enables buttons when snapshot exists', () => {
    render(<ProviderExport snapshot={mockSnapshot} />);
    const jsonBtn = screen.getByText('JSON').closest('button')!;
    expect(jsonBtn.disabled).toBe(false);
  });

  it('renders description', () => {
    render(<ProviderExport snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlayıcı verilerini dışa aktarın')).toBeDefined();
  });
});
