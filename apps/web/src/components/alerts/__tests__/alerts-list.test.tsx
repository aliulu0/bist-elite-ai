import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertsList } from '../alerts-list';
import { useAlertsStore } from '@/stores/alerts-store';
import type { Alert } from '@/components/alerts/alerts-types';

const ALERTS: Alert[] = Array.from({ length: 25 }, (_, i) => ({
  id: `a${i + 1}`,
  type: 'ERKEN_FIRSAT' as const,
  title: `Kayit-${String(i + 1).padStart(3, '0')}`,
  description: '',
  priority: 'ORTA' as const,
  status: 'YENI' as const,
  group: 'PIYASA' as const,
  source: 'Engine',
  timestamp: `2026-07-26T${String(8 + (i % 12)).padStart(2, '0')}:00:00Z`,
  read: false,
}));

function renderList(alerts = ALERTS, overrides = {}) {
  useAlertsStore.setState({
    selectedAlert: null,
    search: '',
    sortKey: 'title',
    sortDir: 'asc' as const,
    page: 0,
    pageSize: 20,
    ...overrides,
  });
  return render(<AlertsList alerts={alerts} />);
}

describe('AlertsList', () => {
  it('renders column toggle buttons', () => {
    renderList();
    expect(screen.getByText('Başlık', { selector: 'button' })).toBeDefined();
    expect(screen.getByText('Kaynak', { selector: 'button' })).toBeDefined();
  });

  it('paginates to 20 per page', () => {
    renderList();
    expect(screen.getByText('Kayit-001')).toBeDefined();
    expect(screen.queryByText('Kayit-021')).toBeNull();
  });

  it('shows result count', () => {
    renderList();
    expect(screen.getByText(/25 sonuç/)).toBeDefined();
  });

  it('shows empty message when no alerts', () => {
    renderList([]);
    expect(screen.getByText('Filtrelere uygun sonuç yok')).toBeDefined();
  });

  it('shows page indicator', () => {
    renderList();
    expect(screen.getByText('1 / 2')).toBeDefined();
  });

  it('selects alert on row click', () => {
    renderList(ALERTS.slice(0, 1));
    const rows = document.querySelectorAll('tbody tr');
    fireEvent.click(rows[0]);
    expect(useAlertsStore.getState().selectedAlert?.id).toBe('a1');
  });

  it('marks as read when clicking unread alert', () => {
    const alerts = ALERTS.slice(0, 1);
    useAlertsStore.getState().setAlerts(alerts);
    renderList(alerts);
    const rows = document.querySelectorAll('tbody tr');
    fireEvent.click(rows[0]);
    expect(useAlertsStore.getState().alerts[0].read).toBe(true);
  });

  it('toggle column visibility', () => {
    renderList(ALERTS.slice(0, 1));
    const kaynakBtn = screen.getByText('Kaynak', { selector: 'button' });
    fireEvent.click(kaynakBtn);
    expect(screen.queryByText('Engine')).toBeNull();
    fireEvent.click(kaynakBtn);
    expect(screen.getByText('Engine')).toBeDefined();
  });

  it('disables prev button on first page', () => {
    renderList();
    const allBtns = screen.getAllByRole('button');
    const navBtns = allBtns.filter((b) => {
      const svg = b.querySelector('svg');
      return svg !== null && b.textContent === '';
    });
    expect(navBtns.length).toBeGreaterThanOrEqual(1);
    expect(navBtns[0].disabled).toBe(true);
  });

  it('disables next button on last page', () => {
    renderList(ALERTS.slice(0, 5));
    const allBtns = screen.getAllByRole('button');
    const navBtns = allBtns.filter((b) => {
      const svg = b.querySelector('svg');
      return svg !== null && b.textContent === '';
    });
    expect(navBtns.length).toBeGreaterThanOrEqual(1);
    expect(navBtns[1].disabled).toBe(true);
  });
});
