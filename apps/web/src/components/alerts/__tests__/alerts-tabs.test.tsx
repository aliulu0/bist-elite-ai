import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsTabs } from '../alerts-tabs';
import { useAlertsStore } from '@/stores/alerts-store';

beforeEach(() => {
  useAlertsStore.setState({ activeTab: 'TUMU' });
});

describe('AlertsTabs', () => {
  it('renders all 7 tabs', () => {
    render(<AlertsTabs />);
    expect(screen.getByText('Tümü')).toBeDefined();
    expect(screen.getByText('Piyasa Alarmları')).toBeDefined();
    expect(screen.getByText('Workflow Alarmları')).toBeDefined();
    expect(screen.getByText('Provider Alarmları')).toBeDefined();
    expect(screen.getByText('Sistem Alarmları')).toBeDefined();
    expect(screen.getByText('Portföy Alarmları')).toBeDefined();
    expect(screen.getByText('Watchlist Alarmları')).toBeDefined();
  });

  it('switches active tab', () => {
    render(<AlertsTabs />);
    screen.getByText('Piyasa Alarmları').click();
    expect(useAlertsStore.getState().activeTab).toBe('PIYASA');
  });

  it('switches to WORKFLOW tab', () => {
    render(<AlertsTabs />);
    screen.getByText('Workflow Alarmları').click();
    expect(useAlertsStore.getState().activeTab).toBe('WORKFLOW');
  });

  it('resets page on tab change', () => {
    useAlertsStore.setState({ page: 5 });
    render(<AlertsTabs />);
    screen.getByText('Provider Alarmları').click();
    expect(useAlertsStore.getState().page).toBe(0);
  });

  it('highlights active tab', () => {
    render(<AlertsTabs />);
    const tumu = screen.getByText('Tümü');
    expect(tumu.className).toContain('bg-background');
    expect(tumu.className).toContain('shadow-sm');
  });

  it('switches to SYSTEM tab', () => {
    render(<AlertsTabs />);
    screen.getByText('Sistem Alarmları').click();
    expect(useAlertsStore.getState().activeTab).toBe('SISTEM');
  });
});
