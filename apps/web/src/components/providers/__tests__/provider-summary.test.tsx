import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderSummary } from '../provider-summary';
import type { ProviderHealthSnapshot } from '../provider-types';

const mockSnapshot: ProviderHealthSnapshot = {
  providers: [
    { name: 'Yahoo', status: 'HEALTHY', latencyMs: 120, successRate: 98.5, errorRate: 1.5, reliabilityScore: 97.2, consecutiveFailures: 0, totalRequests: 1240, failedRequests: 18, timeoutCount: 2, lastSuccessAt: '2026-01-15T10:00:00Z', lastFailureAt: '2026-01-15T08:00:00Z', lastRecoveryAt: null, recoveryTimeMs: null },
    { name: 'Fintables', status: 'DEGRADED', latencyMs: 850, successRate: 82.3, errorRate: 17.7, reliabilityScore: 80.1, consecutiveFailures: 5, totalRequests: 430, failedRequests: 76, timeoutCount: 12, lastSuccessAt: null, lastFailureAt: null, lastRecoveryAt: null, recoveryTimeMs: null },
  ],
  latencyHistory: {},
  alerts: [],
  failoverOrder: ['Yahoo', 'Fintables'],
  lastUpdate: '2026-01-15T10:00:00Z',
};

describe('ProviderSummary', () => {
  it('renders null when no snapshot', () => {
    const { container } = render(<ProviderSummary snapshot={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 8 summary cards', () => {
    render(<ProviderSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('Toplam Sağlayıcı')).toBeDefined();
    expect(screen.getByText('Sağlıklı')).toBeDefined();
    expect(screen.getByText('Uyarı')).toBeDefined();
    expect(screen.getByText('Kritik')).toBeDefined();
    expect(screen.getByText('Ort. Gecikme')).toBeDefined();
    expect(screen.getByText('Ort. Güvenilirlik')).toBeDefined();
    expect(screen.getByText('Toplam Hata')).toBeDefined();
    expect(screen.getByText('Son Güncelleme')).toBeDefined();
  });

  it('displays total providers', () => {
    render(<ProviderSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('2')).toBeDefined();
  });

  it('displays healthy count', () => {
    render(<ProviderSummary snapshot={mockSnapshot} />);
    const healthyValues = screen.getAllByText('1');
    expect(healthyValues.length).toBeGreaterThanOrEqual(1);
  });

  it('displays average latency', () => {
    render(<ProviderSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('485ms')).toBeDefined();
  });

  it('displays total errors', () => {
    render(<ProviderSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('94')).toBeDefined();
  });

  it('displays average reliability', () => {
    render(<ProviderSummary snapshot={mockSnapshot} />);
    expect(screen.getByText('%88.7')).toBeDefined();
  });
});
