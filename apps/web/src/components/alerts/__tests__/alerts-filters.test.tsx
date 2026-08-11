import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertsFilters } from '../alerts-filters';
import { useAlertsStore } from '@/stores/alerts-store';

beforeEach(() => {
  useAlertsStore.setState({
    filterType: '', filterPriority: '', filterStatus: '', filterRead: '', filterSymbol: '',
  });
});

describe('AlertsFilters', () => {
  it('renders filters title', () => {
    render(<AlertsFilters />);
    expect(screen.getByText('Filtreler')).toBeDefined();
  });

  it('renders type filter', () => {
    render(<AlertsFilters />);
    expect(screen.getByText('Tür Filtresi')).toBeDefined();
  });

  it('renders priority filter', () => {
    render(<AlertsFilters />);
    expect(screen.getByText('Öncelik Filtresi')).toBeDefined();
  });

  it('renders status filter', () => {
    render(<AlertsFilters />);
    expect(screen.getByText('Durum Filtresi')).toBeDefined();
  });

  it('renders read filter', () => {
    render(<AlertsFilters />);
    expect(screen.getByText('Okunma')).toBeDefined();
  });

  it('renders symbol filter input', () => {
    render(<AlertsFilters />);
    expect(screen.getByPlaceholderText('Örn: THYAO')).toBeDefined();
  });

  it('updates store on type change', () => {
    render(<AlertsFilters />);
    const select = screen.getByText('Tür Filtresi').closest('div')!.querySelector('select')!;
    fireEvent.change(select, { target: { value: 'ERKEN_FIRSAT' } });
    expect(useAlertsStore.getState().filterType).toBe('ERKEN_FIRSAT');
  });

  it('resets page on filter change', () => {
    useAlertsStore.setState({ page: 3 });
    render(<AlertsFilters />);
    const select = screen.getByText('Öncelik Filtresi').closest('div')!.querySelector('select')!;
    fireEvent.change(select, { target: { value: 'KRITIK' } });
    expect(useAlertsStore.getState().page).toBe(0);
  });
});
