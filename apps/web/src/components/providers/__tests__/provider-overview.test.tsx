import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderOverview } from '../provider-overview';
import type { ProviderHealthSnapshot } from '../provider-types';

const mockSnapshot: ProviderHealthSnapshot = {
  providers: [
    { name: 'Yahoo', status: 'HEALTHY', latencyMs: 120, successRate: 98.5, errorRate: 1.5, reliabilityScore: 97.2, consecutiveFailures: 0, totalRequests: 1240, failedRequests: 18, timeoutCount: 2, lastSuccessAt: '2026-01-15T10:00:00Z', lastFailureAt: '2026-01-15T08:00:00Z', lastRecoveryAt: null, recoveryTimeMs: null },
    { name: 'Fintables', status: 'DEGRADED', latencyMs: 850, successRate: 82.3, errorRate: 17.7, reliabilityScore: 80.1, consecutiveFailures: 5, totalRequests: 430, failedRequests: 76, timeoutCount: 12, lastSuccessAt: '2026-01-15T09:30:00Z', lastFailureAt: '2026-01-15T10:00:00Z', lastRecoveryAt: '2026-01-15T09:25:00Z', recoveryTimeMs: 300000 },
  ],
  latencyHistory: {},
  alerts: [
    { id: 'a1', type: 'HIGH_LATENCY', title: 'Yüksek Gecikme', description: 'Fintables gecikmesi yükseldi', provider: 'Fintables', timestamp: '2026-01-15T10:00:00Z', severity: 'WARNING' },
  ],
  failoverOrder: ['Yahoo', 'Fintables'],
  lastUpdate: null,
};

describe('ProviderOverview', () => {
  it('renders empty state when no snapshot', () => {
    render(<ProviderOverview snapshot={null} />);
    expect(screen.getByText('Henüz sağlayıcı verisi bulunmuyor')).toBeDefined();
  });

  it('renders overview cards', () => {
    render(<ProviderOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('Genel Durum')).toBeDefined();
    expect(screen.getByText('Son Olaylar')).toBeDefined();
  });

  it('displays healthy count', () => {
    render(<ProviderOverview snapshot={mockSnapshot} />);
    const healthyValues = screen.getAllByText('1');
    expect(healthyValues.length).toBeGreaterThanOrEqual(1);
  });

  it('displays average latency', () => {
    render(<ProviderOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('485ms')).toBeDefined();
  });

  it('displays average reliability', () => {
    render(<ProviderOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('%88.7')).toBeDefined();
  });

  it('displays alert count', () => {
    render(<ProviderOverview snapshot={mockSnapshot} />);
    expect(screen.getByText('1 aktif uyarı')).toBeDefined();
  });

  it('displays last failure', () => {
    render(<ProviderOverview snapshot={mockSnapshot} />);
    expect(screen.getByText(/Son Hata/)).toBeDefined();
  });

  it('displays recovery event', () => {
    render(<ProviderOverview snapshot={mockSnapshot} />);
    expect(screen.getByText(/Son Kurtarma/)).toBeDefined();
  });

  it('shows no failure message when none', () => {
    const noFailures = {
      ...mockSnapshot,
      providers: mockSnapshot.providers.map((p) => ({ ...p, lastFailureAt: null })),
    };
    render(<ProviderOverview snapshot={noFailures} />);
    expect(screen.getByText('Son hata kaydı yok')).toBeDefined();
  });

  it('shows no recovery message when none', () => {
    const noRecovery = {
      ...mockSnapshot,
      providers: mockSnapshot.providers.map((p) => ({ ...p, lastRecoveryAt: null })),
    };
    render(<ProviderOverview snapshot={noRecovery} />);
    expect(screen.getByText('Son kurtarma kaydı yok')).toBeDefined();
  });
});
