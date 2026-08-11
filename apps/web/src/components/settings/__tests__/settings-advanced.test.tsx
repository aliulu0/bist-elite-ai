import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsAdvanced } from '../settings-advanced';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_SETTINGS } from '@/components/settings/settings-types';

beforeEach(() => {
  useSettingsStore.setState({ values: structuredClone(DEFAULT_SETTINGS) });
});

describe('SettingsAdvanced', () => {
  it('renders title', () => {
    render(<SettingsAdvanced />);
    expect(screen.getByText('Gelişmiş Ayarlar')).toBeDefined();
  });

  it('renders all 5 toggles', () => {
    render(<SettingsAdvanced />);
    expect(screen.getByText('Otomatik Cache Temizleme')).toBeDefined();
    expect(screen.getByText('Local Storage Temizleme')).toBeDefined();
    expect(screen.getByText('Debug Modu')).toBeDefined();
    expect(screen.getByText('Gelişmiş Loglama')).toBeDefined();
    expect(screen.getByText('Deneysel Özellikler')).toBeDefined();
  });

  it('toggles debug mode', () => {
    render(<SettingsAdvanced />);
    const btns = screen.getAllByRole('switch');
    fireEvent.click(btns[2]);
    expect(useSettingsStore.getState().values.advanced.debugMode).toBe(true);
  });

  it('toggles experimental features', () => {
    render(<SettingsAdvanced />);
    const btns = screen.getAllByRole('switch');
    fireEvent.click(btns[4]);
    expect(useSettingsStore.getState().values.advanced.experimentalFeatures).toBe(true);
  });
});
