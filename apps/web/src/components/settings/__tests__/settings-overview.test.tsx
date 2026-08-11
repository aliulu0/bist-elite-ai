import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsSummary } from '../settings-overview';
import { useSettingsStore } from '@/stores/settings-store';

beforeEach(() => {
  useSettingsStore.setState({ dirty: false });
});

describe('SettingsSummary', () => {
  it('renders 4 summary cards', () => {
    render(<SettingsSummary />);
    expect(screen.getByText('Tema')).toBeDefined();
    expect(screen.getByText('Dil')).toBeDefined();
    expect(screen.getByText('Aktif Profil')).toBeDefined();
    expect(screen.getByText('Durum')).toBeDefined();
  });

  it('shows dark mode value', () => {
    render(<SettingsSummary />);
    expect(screen.getByText('Koyu')).toBeDefined();
  });

  it('shows Turkish language', () => {
    render(<SettingsSummary />);
    expect(screen.getByText('Türkçe')).toBeDefined();
  });

  it('shows saved status when not dirty', () => {
    render(<SettingsSummary />);
    expect(screen.getByText('Kayıtlı')).toBeDefined();
  });

  it('shows dirty status', () => {
    useSettingsStore.setState({ dirty: true });
    render(<SettingsSummary />);
    expect(screen.getByText('Kaydedilmemiş Değişiklik')).toBeDefined();
  });

  it('shows default profile', () => {
    render(<SettingsSummary />);
    expect(screen.getByText('Varsayılan')).toBeDefined();
  });
});
