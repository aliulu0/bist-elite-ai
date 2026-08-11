import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsSettings } from '../alerts-settings';
import { useAlertsStore } from '@/stores/alerts-store';
import { DEFAULT_ALERT_SETTINGS } from '@/components/alerts/alerts-types';

beforeEach(() => {
  useAlertsStore.setState({ settings: { ...DEFAULT_ALERT_SETTINGS } });
});

describe('AlertsSettings', () => {
  it('renders settings title', () => {
    render(<AlertsSettings />);
    expect(screen.getByText('Alarm Ayarları')).toBeDefined();
  });

  it('renders all 6 group toggles', () => {
    render(<AlertsSettings />);
    expect(screen.getByText('Piyasa Alarmları')).toBeDefined();
    expect(screen.getByText('Workflow Alarmları')).toBeDefined();
    expect(screen.getByText('Provider Alarmları')).toBeDefined();
    expect(screen.getByText('Sistem Alarmları')).toBeDefined();
    expect(screen.getByText('Portföy Alarmları')).toBeDefined();
    expect(screen.getByText('Watchlist Alarmları')).toBeDefined();
  });

  it('toggles piyasa setting', () => {
    render(<AlertsSettings />);
    screen.getByText('Piyasa Alarmları').closest('div')!.querySelector('button')!.click();
    expect(useAlertsStore.getState().settings.piyasa).toBe(false);
  });

  it('toggles workflow setting', () => {
    render(<AlertsSettings />);
    screen.getByText('Workflow Alarmları').closest('div')!.querySelector('button')!.click();
    expect(useAlertsStore.getState().settings.workflow).toBe(false);
  });

  it('toggles provider setting', () => {
    render(<AlertsSettings />);
    screen.getByText('Provider Alarmları').closest('div')!.querySelector('button')!.click();
    expect(useAlertsStore.getState().settings.provider).toBe(false);
  });

  it('toggles sistem setting', () => {
    render(<AlertsSettings />);
    screen.getByText('Sistem Alarmları').closest('div')!.querySelector('button')!.click();
    expect(useAlertsStore.getState().settings.sistem).toBe(false);
  });

  it('toggles portfoy setting', () => {
    render(<AlertsSettings />);
    screen.getByText('Portföy Alarmları').closest('div')!.querySelector('button')!.click();
    expect(useAlertsStore.getState().settings.portfoy).toBe(false);
  });

  it('toggles watchlist setting', () => {
    render(<AlertsSettings />);
    screen.getByText('Watchlist Alarmları').closest('div')!.querySelector('button')!.click();
    expect(useAlertsStore.getState().settings.watchlist).toBe(false);
  });

  it('toggle back restores to true', () => {
    render(<AlertsSettings />);
    const btn1 = screen.getByText('Piyasa Alarmları').closest('div')!.querySelector('button')!;
    btn1.click();
    expect(useAlertsStore.getState().settings.piyasa).toBe(false);
    const btn2 = screen.getByText('Piyasa Alarmları').closest('div')!.querySelector('button')!;
    btn2.click();
    expect(useAlertsStore.getState().settings.piyasa).toBe(true);
  });
});
