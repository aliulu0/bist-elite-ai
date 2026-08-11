import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsSummary } from '../alerts-summary';
import { useAlertsStore } from '@/stores/alerts-store';
import type { Alert } from '@/components/alerts/alerts-types';

const DEMO: Alert[] = [
  { id: '1', type: 'ERKEN_FIRSAT', title: 'A', description: '', priority: 'KRITIK', status: 'YENI', group: 'PIYASA', source: 'E', timestamp: '2026-07-26T09:00:00Z', read: false },
  { id: '2', type: 'WORKFLOW_HATA', title: 'B', description: '', priority: 'YUKSEK', status: 'OKUNDU', group: 'WORKFLOW', source: 'E', timestamp: '2026-07-26T10:00:00Z', read: true },
  { id: '3', type: 'PROVIDER_OFFLINE', title: 'C', description: '', priority: 'ORTA', status: 'COZULDU', group: 'PROVIDER', source: 'E', timestamp: '2026-07-26T11:00:00Z', read: true },
  { id: '4', type: 'SISTEM_UYARISI', title: 'D', description: '', priority: 'DUSUK', status: 'YENI', group: 'SISTEM', source: 'E', timestamp: '2026-07-26T12:00:00Z', read: false },
];

beforeEach(() => {
  useAlertsStore.getState().setAlerts(DEMO);
});

describe('AlertsSummary', () => {
  it('returns null when no summary', () => {
    useAlertsStore.setState({ summary: null });
    const { container } = render(<AlertsSummary />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 8 KPI cards', () => {
    render(<AlertsSummary />);
    expect(screen.getByText('Toplam Alarm')).toBeDefined();
    expect(screen.getByText('Yeni Alarm')).toBeDefined();
    expect(screen.getByText('Yüksek Öncelik')).toBeDefined();
    expect(screen.getByText('Orta Öncelik')).toBeDefined();
    expect(screen.getByText('Düşük Öncelik')).toBeDefined();
    expect(screen.getByText('Okunmamış Alarm')).toBeDefined();
    expect(screen.getByText('Bugünkü Alarm')).toBeDefined();
    expect(screen.getByText('Çözülen Alarm')).toBeDefined();
  });

  it('shows correct total count', () => {
    const { container } = render(<AlertsSummary />);
    const cards = container.querySelectorAll('.rounded-xl');
    const totalCard = cards[0];
    expect(totalCard?.querySelector('.text-2xl')?.textContent).toBe('4');
  });

  it('shows correct unresolved count', () => {
    const { container } = render(<AlertsSummary />);
    const cards = container.querySelectorAll('.rounded-xl');
    const unreadCard = cards[5];
    expect(unreadCard?.querySelector('.text-2xl')?.textContent).toBe('2');
  });

  it('shows resolved count', () => {
    const { container } = render(<AlertsSummary />);
    const cards = container.querySelectorAll('.rounded-xl');
    const resolvedCard = cards[7];
    expect(resolvedCard?.querySelector('.text-2xl')?.textContent).toBe('1');
  });
});
