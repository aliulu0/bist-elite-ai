import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsTheme } from '../settings-theme';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_SETTINGS } from '@/components/settings/settings-types';

beforeEach(() => {
  useSettingsStore.setState({ values: structuredClone(DEFAULT_SETTINGS) });
});

describe('SettingsTheme', () => {
  it('renders title', () => {
    render(<SettingsTheme />);
    expect(screen.getByText('Tema Ayarları')).toBeDefined();
  });

  it('renders theme buttons', () => {
    render(<SettingsTheme />);
    expect(screen.getByText('Koyu')).toBeDefined();
    expect(screen.getByText('Açık')).toBeDefined();
    expect(screen.getByText('Sistem')).toBeDefined();
  });

  it('renders density buttons', () => {
    render(<SettingsTheme />);
    expect(screen.getByText('Kompakt')).toBeDefined();
    expect(screen.getByText('Normal')).toBeDefined();
    expect(screen.getByText('Geniş')).toBeDefined();
  });

  it('switches theme to light', () => {
    render(<SettingsTheme />);
    fireEvent.click(screen.getByText('Açık'));
    expect(useSettingsStore.getState().values.theme.mode).toBe('light');
  });

  it('switches theme to system', () => {
    render(<SettingsTheme />);
    fireEvent.click(screen.getByText('Sistem'));
    expect(useSettingsStore.getState().values.theme.mode).toBe('system');
  });

  it('switches density to compact', () => {
    render(<SettingsTheme />);
    fireEvent.click(screen.getByText('Kompakt'));
    expect(useSettingsStore.getState().values.theme.density).toBe('compact');
  });

  it('switches density to spacious', () => {
    render(<SettingsTheme />);
    fireEvent.click(screen.getByText('Geniş'));
    expect(useSettingsStore.getState().values.theme.density).toBe('spacious');
  });

  it('highlights active theme button', () => {
    render(<SettingsTheme />);
    const darkBtn = screen.getByText('Koyu');
    expect(darkBtn.className).toContain('bg-primary');
  });
});
