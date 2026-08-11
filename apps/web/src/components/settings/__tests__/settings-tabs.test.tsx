import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsTabs } from '../settings-tabs';
import { useSettingsStore } from '@/stores/settings-store';

beforeEach(() => {
  useSettingsStore.setState({ activeTab: 'general' });
});

describe('SettingsTabs', () => {
  it('renders all 11 tabs', () => {
    render(<SettingsTabs />);
    expect(screen.getByText('Genel')).toBeDefined();
    expect(screen.getByText('Görünüm')).toBeDefined();
    expect(screen.getByText('Tarayıcı')).toBeDefined();
    expect(screen.getByText('Analiz')).toBeDefined();
    expect(screen.getByText('İş Akışı')).toBeDefined();
    expect(screen.getByText('Zamanlayıcı')).toBeDefined();
    expect(screen.getByText('Sağlayıcılar')).toBeDefined();
    expect(screen.getByText('Bildirimler')).toBeDefined();
    expect(screen.getByText('Gelişmiş')).toBeDefined();
    expect(screen.getByText('Profiller')).toBeDefined();
    expect(screen.getByText('Anlık Görüntüler')).toBeDefined();
  });

  it('switches tab on click', () => {
    render(<SettingsTabs />);
    screen.getByText('Görünüm').click();
    expect(useSettingsStore.getState().activeTab).toBe('theme');
  });

  it('highlights active tab', () => {
    render(<SettingsTabs />);
    const genel = screen.getByText('Genel');
    expect(genel.className).toContain('bg-background');
  });

  it('switches to scanner tab', () => {
    render(<SettingsTabs />);
    screen.getByText('Tarayıcı').click();
    expect(useSettingsStore.getState().activeTab).toBe('scanner');
  });

  it('switches to workflow tab', () => {
    render(<SettingsTabs />);
    screen.getByText('İş Akışı').click();
    expect(useSettingsStore.getState().activeTab).toBe('workflow');
  });

  it('switches to profiles tab', () => {
    render(<SettingsTabs />);
    screen.getByText('Profiller').click();
    expect(useSettingsStore.getState().activeTab).toBe('profiles');
  });
});
