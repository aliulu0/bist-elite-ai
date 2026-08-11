import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsProviders } from '../settings-providers';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_SETTINGS } from '@/components/settings/settings-types';

beforeEach(() => {
  useSettingsStore.setState({ values: structuredClone(DEFAULT_SETTINGS) });
});

describe('SettingsProviders', () => {
  it('renders title', () => {
    render(<SettingsProviders />);
    expect(screen.getByText('Sağlayıcı Ayarları')).toBeDefined();
  });

  it('renders timeout input', () => {
    render(<SettingsProviders />);
    expect(screen.getByText('Timeout (ms)')).toBeDefined();
  });

  it('renders failover toggle', () => {
    render(<SettingsProviders />);
    expect(screen.getByText('Otomatik Failover')).toBeDefined();
  });

  it('renders provider priority list', () => {
    render(<SettingsProviders />);
    expect(screen.getByText('Sağlayıcı Önceliği')).toBeDefined();
    expect(screen.getByText('Yahoo Finance')).toBeDefined();
    expect(screen.getByText('Fintables')).toBeDefined();
  });
});
