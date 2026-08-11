import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsHeader } from '../alerts-header';
import { useAlertsStore } from '@/stores/alerts-store';

beforeEach(() => {
  useAlertsStore.setState({
    alerts: [
      { id: '1', type: 'ERKEN_FIRSAT', title: 'Test', description: '', priority: 'ORTA', status: 'YENI', group: 'PIYASA', source: 'Engine', timestamp: '2026-07-26T08:00:00Z', read: false },
      { id: '2', type: 'ERKEN_FIRSAT', title: 'Test2', description: '', priority: 'ORTA', status: 'OKUNDU', group: 'PIYASA', source: 'Engine', timestamp: '2026-07-26T08:00:00Z', read: true },
    ],
  });
});

describe('AlertsHeader', () => {
  it('renders page title', () => {
    render(<AlertsHeader />);
    expect(screen.getByText('Alarm Merkezi')).toBeDefined();
  });

  it('renders mark all as read button', () => {
    render(<AlertsHeader />);
    expect(screen.getByText('Tümünü Okundu İşaretle')).toBeDefined();
  });

  it('renders refresh button', () => {
    render(<AlertsHeader />);
    expect(screen.getByText('Yenile')).toBeDefined();
  });

  it('renders export button', () => {
    render(<AlertsHeader />);
    expect(screen.getByText('Dışa Aktar')).toBeDefined();
  });

  it('marks all alerts as read when button clicked', () => {
    render(<AlertsHeader />);
    screen.getByText('Tümünü Okundu İşaretle').click();
    const state = useAlertsStore.getState();
    expect(state.alerts.every((a) => a.read)).toBe(true);
  });

  it('updates summary after marking all as read', () => {
    render(<AlertsHeader />);
    screen.getByText('Tümünü Okundu İşaretle').click();
    const state = useAlertsStore.getState();
    expect(state.summary?.unread).toBe(0);
  });
});
