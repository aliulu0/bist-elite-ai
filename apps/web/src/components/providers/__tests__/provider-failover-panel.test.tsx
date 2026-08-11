import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderFailoverPanel } from '../provider-failover-panel';
import type { ProviderHealthSnapshot } from '../provider-types';

const mockSnapshot: ProviderHealthSnapshot = {
  providers: [
    { name: 'Yahoo Finance', status: 'HEALTHY', latencyMs: 120, successRate: 98.5, errorRate: 1.5, reliabilityScore: 97.2, consecutiveFailures: 0, totalRequests: 1240, failedRequests: 18, timeoutCount: 2, lastSuccessAt: null, lastFailureAt: null, lastRecoveryAt: null, recoveryTimeMs: null },
    { name: 'Fintables', status: 'DEGRADED', latencyMs: 850, successRate: 82.3, errorRate: 17.7, reliabilityScore: 80.1, consecutiveFailures: 5, totalRequests: 430, failedRequests: 76, timeoutCount: 12, lastSuccessAt: null, lastFailureAt: null, lastRecoveryAt: null, recoveryTimeMs: null },
  ],
  latencyHistory: {},
  alerts: [],
  failoverOrder: ['Yahoo Finance', 'Fintables'],
  lastUpdate: null,
};

describe('ProviderFailoverPanel', () => {
  it('renders empty state when no snapshot', () => {
    render(<ProviderFailoverPanel snapshot={null} />);
    expect(screen.getByText('Arıza kaydı yok')).toBeDefined();
  });

  it('renders empty state when empty failover order', () => {
    render(<ProviderFailoverPanel snapshot={{ ...mockSnapshot, failoverOrder: [] }} />);
    expect(screen.getByText('Arıza kaydı yok')).toBeDefined();
  });

  it('renders failover order', () => {
    render(<ProviderFailoverPanel snapshot={mockSnapshot} />);
    expect(screen.getByText('Yahoo Finance')).toBeDefined();
    expect(screen.getByText('Fintables')).toBeDefined();
  });

  it('renders card title', () => {
    render(<ProviderFailoverPanel snapshot={mockSnapshot} />);
    expect(screen.getByText('Arıza Yönlendirme Sırası')).toBeDefined();
  });

  it('shows priority numbers', () => {
    render(<ProviderFailoverPanel snapshot={mockSnapshot} />);
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
  });

  it('shows unknown for providers not in list', () => {
    const snapshot = {
      ...mockSnapshot,
      failoverOrder: ['Unknown Provider'],
    };
    render(<ProviderFailoverPanel snapshot={snapshot} />);
    expect(screen.getByText('Unknown Provider')).toBeDefined();
    expect(screen.getByText('Bilinmiyor')).toBeDefined();
  });
});
