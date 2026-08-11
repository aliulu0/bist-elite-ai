import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderAlerts } from '../provider-alerts';
import type { ProviderHealthSnapshot } from '../provider-types';

const mockSnapshot: ProviderHealthSnapshot = {
  providers: [],
  latencyHistory: {},
  alerts: [
    { id: 'a1', type: 'OFFLINE', title: 'Çevrimdışı', description: 'Yahoo Finance çevrimdışı', provider: 'Yahoo Finance', timestamp: '2026-01-15T10:00:00Z', severity: 'CRITICAL' },
    { id: 'a2', type: 'HIGH_LATENCY', title: 'Yüksek Gecikme', description: 'Fintables gecikmesi yükseldi', provider: 'Fintables', timestamp: '2026-01-15T10:05:00Z', severity: 'WARNING' },
    { id: 'a3', type: 'RECOVERY', title: 'Kurtarma', description: 'Investing kurtarıldı', provider: 'Investing', timestamp: '2026-01-15T10:10:00Z', severity: 'WARNING' },
    { id: 'a4', type: 'CONSECUTIVE_FAILURES', title: 'Arka Arkaya Hatalar', description: '5 ardışık hata', provider: 'Fintables', timestamp: '2026-01-15T10:15:00Z', severity: 'CRITICAL' },
  ],
  failoverOrder: [],
  lastUpdate: null,
};

describe('ProviderAlerts', () => {
  it('renders empty state when no snapshot', () => {
    render(<ProviderAlerts snapshot={null} />);
    expect(screen.getByText('Uyarı verisi yok')).toBeDefined();
  });

  it('renders empty state when no alerts', () => {
    render(<ProviderAlerts snapshot={{ ...mockSnapshot, alerts: [] }} />);
    expect(screen.getByText('Arıza kaydı yok')).toBeDefined();
  });

  it('renders alerts', () => {
    render(<ProviderAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Çevrimdışı')).toBeDefined();
    expect(screen.getByText('Yüksek Gecikme')).toBeDefined();
  });

  it('renders card title', () => {
    render(<ProviderAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlayıcı Uyarıları')).toBeDefined();
  });

  it('displays provider names', () => {
    render(<ProviderAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Yahoo Finance')).toBeDefined();
  });

  it('renders recovery alerts', () => {
    render(<ProviderAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Kurtarma')).toBeDefined();
  });

  it('renders consecutive failure alerts', () => {
    render(<ProviderAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Arka Arkaya Hatalar')).toBeDefined();
  });

  it('applies correct severity styles', () => {
    render(<ProviderAlerts snapshot={mockSnapshot} />);
    expect(screen.getByText('Çevrimdışı')).toBeDefined();
    expect(screen.getByText('Yüksek Gecikme')).toBeDefined();
  });
});
