import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderHealthTable } from '../provider-health-table';
import type { ProviderHealthSnapshot } from '../provider-types';

const mockSnapshot: ProviderHealthSnapshot = {
  providers: [
    { name: 'Yahoo Finance', status: 'HEALTHY', latencyMs: 120, successRate: 98.5, errorRate: 1.5, reliabilityScore: 97.2, consecutiveFailures: 0, totalRequests: 1240, failedRequests: 18, timeoutCount: 2, lastSuccessAt: '2026-01-15T10:00:00Z', lastFailureAt: '2026-01-15T08:00:00Z', lastRecoveryAt: null, recoveryTimeMs: null },
    { name: 'Fintables', status: 'DEGRADED', latencyMs: 850, successRate: 82.3, errorRate: 17.7, reliabilityScore: 80.1, consecutiveFailures: 5, totalRequests: 430, failedRequests: 76, timeoutCount: 12, lastSuccessAt: null, lastFailureAt: null, lastRecoveryAt: null, recoveryTimeMs: null },
  ],
  latencyHistory: {},
  alerts: [],
  failoverOrder: [],
  lastUpdate: null,
};

describe('ProviderHealthTable', () => {
  it('renders empty state when no snapshot', () => {
    render(<ProviderHealthTable snapshot={null} />);
    expect(screen.getByText('Sağlayıcı tablosu verisi yok')).toBeDefined();
  });

  it('renders empty state when no providers', () => {
    render(<ProviderHealthTable snapshot={{ ...mockSnapshot, providers: [] }} />);
    expect(screen.getByText('Sağlayıcı tablosu verisi yok')).toBeDefined();
  });

  it('renders table header', () => {
    render(<ProviderHealthTable snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlayıcı')).toBeDefined();
    expect(screen.getByText('Durum')).toBeDefined();
    expect(screen.getByText('Gecikme')).toBeDefined();
    expect(screen.getByText('Başarı Oranı')).toBeDefined();
    expect(screen.getByText('Hata Oranı')).toBeDefined();
    expect(screen.getByText('Güvenilirlik')).toBeDefined();
    expect(screen.getByText('Arka Arkaya Hata')).toBeDefined();
  });

  it('renders provider names', () => {
    render(<ProviderHealthTable snapshot={mockSnapshot} />);
    expect(screen.getByText('Yahoo Finance')).toBeDefined();
    expect(screen.getByText('Fintables')).toBeDefined();
  });

  it('renders Turkish status labels', () => {
    render(<ProviderHealthTable snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlıklı')).toBeDefined();
    expect(screen.getByText('Düşük')).toBeDefined();
  });

  it('displays latency values', () => {
    render(<ProviderHealthTable snapshot={mockSnapshot} />);
    expect(screen.getByText('120ms')).toBeDefined();
    expect(screen.getByText('850ms')).toBeDefined();
  });

  it('sorts by column click', () => {
    render(<ProviderHealthTable snapshot={mockSnapshot} />);
    fireEvent.click(screen.getByText('Gecikme'));
    const cells = screen.getAllByText(/ms$/);
    expect(cells.length).toBeGreaterThanOrEqual(2);
  });

  it('renders card title', () => {
    render(<ProviderHealthTable snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlayıcı Tablosu')).toBeDefined();
  });

  it('displays reliability scores', () => {
    render(<ProviderHealthTable snapshot={mockSnapshot} />);
    expect(screen.getByText('%97.2')).toBeDefined();
    expect(screen.getByText('%80.1')).toBeDefined();
  });
});
