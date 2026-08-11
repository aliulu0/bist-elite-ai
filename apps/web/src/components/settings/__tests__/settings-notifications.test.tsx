import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsNotifications } from '../settings-notifications';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_SETTINGS } from '@/components/settings/settings-types';

beforeEach(() => {
  useSettingsStore.setState({ values: structuredClone(DEFAULT_SETTINGS) });
});

describe('SettingsNotifications', () => {
  it('renders title', () => {
    render(<SettingsNotifications />);
    expect(screen.getByText('Bildirim Ayarları')).toBeDefined();
  });

  it('renders all 6 group toggles', () => {
    render(<SettingsNotifications />);
    expect(screen.getByText('Piyasa Alarmları')).toBeDefined();
    expect(screen.getByText('Workflow Alarmları')).toBeDefined();
    expect(screen.getByText('Provider Alarmları')).toBeDefined();
    expect(screen.getByText('Sistem Alarmları')).toBeDefined();
    expect(screen.getByText('Portföy Alarmları')).toBeDefined();
    expect(screen.getByText('Watchlist Alarmları')).toBeDefined();
  });

  it('toggles piyasa notification', () => {
    render(<SettingsNotifications />);
    const btns = screen.getAllByRole('switch');
    fireEvent.click(btns[0]);
    expect(useSettingsStore.getState().values.notifications.piyasa).toBe(false);
  });

  it('toggles watchlist notification', () => {
    render(<SettingsNotifications />);
    const btns = screen.getAllByRole('switch');
    fireEvent.click(btns[5]);
    expect(useSettingsStore.getState().values.notifications.watchlist).toBe(false);
  });
});
