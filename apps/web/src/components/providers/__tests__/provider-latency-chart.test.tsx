import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderLatencyChart } from '../provider-latency-chart';
import type { ProviderHealthSnapshot } from '../provider-types';

const mockSnapshot: ProviderHealthSnapshot = {
  providers: [],
  latencyHistory: {
    'Yahoo Finance': [
      { timestamp: '2026-01-15T10:00:00Z', latencyMs: 120, success: true },
      { timestamp: '2026-01-15T10:05:00Z', latencyMs: 135, success: true },
    ],
  },
  alerts: [],
  failoverOrder: [],
  lastUpdate: null,
};

describe('ProviderLatencyChart', () => {
  it('renders empty state when no snapshot', () => {
    render(<ProviderLatencyChart snapshot={null} />);
    expect(screen.getByText('Gecikme grafiği verisi yok')).toBeDefined();
  });

  it('renders empty state when no history', () => {
    render(<ProviderLatencyChart snapshot={{ ...mockSnapshot, latencyHistory: {} }} />);
    expect(screen.getByText('Gecikme geçmişi bulunmuyor')).toBeDefined();
  });

  it('renders chart when data exists', () => {
    render(<ProviderLatencyChart snapshot={mockSnapshot} />);
    expect(screen.getByText('Gecikme Trendi')).toBeDefined();
  });

  it('renders chart for selected provider', () => {
    render(<ProviderLatencyChart snapshot={mockSnapshot} selectedProvider="Yahoo Finance" />);
    expect(screen.getByText('Gecikme Trendi')).toBeDefined();
  });

  it('renders all providers when no selection', () => {
    const multiSnapshot: ProviderHealthSnapshot = {
      ...mockSnapshot,
      latencyHistory: {
        Yahoo: [{ timestamp: '2026-01-15T10:00:00Z', latencyMs: 100, success: true }],
        Fintables: [{ timestamp: '2026-01-15T10:00:00Z', latencyMs: 200, success: true }],
      },
    };
    render(<ProviderLatencyChart snapshot={multiSnapshot} />);
    expect(screen.getByText('Gecikme Trendi')).toBeDefined();
  });
});
