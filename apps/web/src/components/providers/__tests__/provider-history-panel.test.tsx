import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderHistoryPanel } from '../provider-history-panel';
import type { ProviderHealthSnapshot } from '../provider-types';

const mockSnapshot: ProviderHealthSnapshot = {
  providers: [],
  latencyHistory: {
    'Yahoo Finance': [
      { timestamp: '2026-01-15T10:00:00Z', latencyMs: 120, success: true },
      { timestamp: '2026-01-15T10:05:00Z', latencyMs: 350, success: false },
      { timestamp: '2026-01-15T10:10:00Z', latencyMs: 95, success: true },
    ],
  },
  alerts: [],
  failoverOrder: [],
  lastUpdate: null,
};

describe('ProviderHistoryPanel', () => {
  it('renders empty state when no snapshot', () => {
    render(<ProviderHistoryPanel snapshot={null} />);
    expect(screen.getByText('İstek geçmişi bulunmuyor')).toBeDefined();
  });

  it('renders select provider prompt when no selection', () => {
    render(<ProviderHistoryPanel snapshot={mockSnapshot} />);
    expect(screen.getByText('Sağlayıcı seçin')).toBeDefined();
  });

  it('renders empty state when provider has no history', () => {
    render(<ProviderHistoryPanel snapshot={mockSnapshot} selectedProvider="Fintables" />);
    expect(screen.getByText('Seçili sağlayıcı için veri yok')).toBeDefined();
  });

  it('renders history entries', () => {
    render(<ProviderHistoryPanel snapshot={mockSnapshot} selectedProvider="Yahoo Finance" />);
    const successElements = screen.getAllByText('Başarılı');
    const failElements = screen.getAllByText('Başarısız');
    expect(successElements.length).toBeGreaterThanOrEqual(1);
    expect(failElements.length).toBe(1);
  });

  it('displays latency values', () => {
    render(<ProviderHistoryPanel snapshot={mockSnapshot} selectedProvider="Yahoo Finance" />);
    expect(screen.getByText('120ms')).toBeDefined();
    expect(screen.getByText('350ms')).toBeDefined();
    expect(screen.getByText('95ms')).toBeDefined();
  });

  it('shows card title with provider name', () => {
    render(<ProviderHistoryPanel snapshot={mockSnapshot} selectedProvider="Yahoo Finance" />);
    expect(screen.getByText(/Yahoo Finance.*İstek Geçmişi/)).toBeDefined();
  });
});
