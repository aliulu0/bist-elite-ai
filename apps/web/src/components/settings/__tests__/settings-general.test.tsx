import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsGeneral } from '../settings-general';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_SETTINGS } from '@/components/settings/settings-types';

beforeEach(() => {
  useSettingsStore.setState({ values: structuredClone(DEFAULT_SETTINGS), dirty: false });
});

describe('SettingsGeneral', () => {
  it('renders title', () => {
    render(<SettingsGeneral />);
    expect(screen.getByText('Genel Ayarlar')).toBeDefined();
  });

  it('renders language selector', () => {
    render(<SettingsGeneral />);
    expect(screen.getByText('Dil')).toBeDefined();
  });

  it('renders timezone selector', () => {
    render(<SettingsGeneral />);
    expect(screen.getByText('Saat Dilimi')).toBeDefined();
  });

  it('renders currency selector', () => {
    render(<SettingsGeneral />);
    expect(screen.getByText('Para Birimi')).toBeDefined();
  });

  it('renders default page selector', () => {
    render(<SettingsGeneral />);
    expect(screen.getAllByText('Varsayılan Sayfa').length).toBeGreaterThanOrEqual(1);
  });

  it('renders auto refresh toggle', () => {
    render(<SettingsGeneral />);
    expect(screen.getByText('Otomatik Yenileme')).toBeDefined();
  });

  it('updates language on change', () => {
    render(<SettingsGeneral />);
    const select = screen.getByText('Dil').closest('div')!.querySelector('select')!;
    fireEvent.change(select, { target: { value: 'en' } });
    expect(useSettingsStore.getState().values.general.language).toBe('en');
  });

  it('updates timezone on change', () => {
    render(<SettingsGeneral />);
    const select = screen.getByText('Saat Dilimi').closest('div')!.querySelector('select')!;
    fireEvent.change(select, { target: { value: 'Europe/London' } });
    expect(useSettingsStore.getState().values.general.timezone).toBe('Europe/London');
  });

  it('toggles auto refresh', () => {
    render(<SettingsGeneral />);
    const btn = screen.getByRole('switch', { name: '' });
    fireEvent.click(btn);
    expect(useSettingsStore.getState().values.general.autoRefresh).toBe(false);
  });

  it('shows Turkish option', () => {
    render(<SettingsGeneral />);
    expect(screen.getByText('Türkçe')).toBeDefined();
  });
});
