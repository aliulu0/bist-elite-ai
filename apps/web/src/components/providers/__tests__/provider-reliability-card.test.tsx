import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderReliabilityCard } from '../provider-reliability-card';
import type { ProviderHealthSnapshot } from '../provider-types';

const mockSnapshot: ProviderHealthSnapshot = {
  providers: [
    { name: 'Yahoo', status: 'HEALTHY', latencyMs: 120, successRate: 98.5, errorRate: 1.5, reliabilityScore: 97.2, consecutiveFailures: 0, totalRequests: 1240, failedRequests: 18, timeoutCount: 2, lastSuccessAt: '2026-01-15T10:00:00Z', lastFailureAt: null, lastRecoveryAt: null, recoveryTimeMs: null },
    { name: 'Fintables', status: 'DEGRADED', latencyMs: 850, successRate: 82.3, errorRate: 17.7, reliabilityScore: 80.1, consecutiveFailures: 5, totalRequests: 430, failedRequests: 76, timeoutCount: 12, lastSuccessAt: null, lastFailureAt: null, lastRecoveryAt: null, recoveryTimeMs: null },
  ],
  latencyHistory: {},
  alerts: [],
  failoverOrder: [],
  lastUpdate: null,
};

describe('ProviderReliabilityCard', () => {
  it('renders empty state when no snapshot', () => {
    render(<ProviderReliabilityCard snapshot={null} />);
    expect(screen.getByText('Güvenilirlik verisi için yeterli veri yok')).toBeDefined();
  });

  it('renders empty state when no providers', () => {
    render(<ProviderReliabilityCard snapshot={{ ...mockSnapshot, providers: [] }} />);
    expect(screen.getByText('Güvenilirlik verisi için yeterli veri yok')).toBeDefined();
  });

  it('renders provider names', () => {
    render(<ProviderReliabilityCard snapshot={mockSnapshot} />);
    expect(screen.getByText('Yahoo')).toBeDefined();
    expect(screen.getByText('Fintables')).toBeDefined();
  });

  it('renders reliability scores', () => {
    render(<ProviderReliabilityCard snapshot={mockSnapshot} />);
    expect(screen.getByText('%97.2')).toBeDefined();
    expect(screen.getByText('%80.1')).toBeDefined();
  });

  it('renders card title', () => {
    render(<ProviderReliabilityCard snapshot={mockSnapshot} />);
    expect(screen.getByText('Güvenilirlik Kartları')).toBeDefined();
  });

  it('displays Turkish status labels', () => {
    render(<ProviderReliabilityCard snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlıklı')).toBeDefined();
    expect(screen.getByText('Düşük')).toBeDefined();
  });

  it('displays latency', () => {
    render(<ProviderReliabilityCard snapshot={mockSnapshot} />);
    expect(screen.getByText('120ms')).toBeDefined();
    expect(screen.getByText('850ms')).toBeDefined();
  });

  it('displays timeout counts', () => {
    render(<ProviderReliabilityCard snapshot={mockSnapshot} />);
    const timeoutElements = screen.getAllByText(/^(2|12)$/);
    expect(timeoutElements.length).toBeGreaterThanOrEqual(1);
  });
});
