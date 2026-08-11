import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from '../settings';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_SETTINGS, DEFAULT_PROFILES } from '@/components/settings/settings-types';

beforeEach(() => {
  useSettingsStore.setState({
    values: structuredClone(DEFAULT_SETTINGS),
    savedValues: structuredClone(DEFAULT_SETTINGS),
    dirty: false,
    activeTab: 'general',
    profiles: structuredClone(DEFAULT_PROFILES),
    selectedProfile: 'default',
    snapshots: [],
    selectedSnapshot: null,
  });
});

describe('SettingsPage', () => {
  it('renders page title', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Ayarlar')).toBeDefined();
  });

  it('renders summary cards', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Tema')).toBeDefined();
    expect(screen.getAllByText('Dil').length).toBeGreaterThanOrEqual(1);
  });

  it('renders tabs', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Genel')).toBeDefined();
    expect(screen.getByText('Görünüm')).toBeDefined();
  });

  it('renders general tab content by default', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Genel Ayarlar')).toBeDefined();
  });

  it('switches to theme tab', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Görünüm'));
    expect(screen.getByText('Tema Ayarları')).toBeDefined();
  });

  it('switches to workflow tab', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('İş Akışı'));
    expect(screen.getByText('İş Akışı Ayarları')).toBeDefined();
  });

  it('switches to providers tab', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Sağlayıcılar'));
    expect(screen.getByText('Sağlayıcı Ayarları')).toBeDefined();
  });

  it('switches to notifications tab', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Bildirimler'));
    expect(screen.getByText('Bildirim Ayarları')).toBeDefined();
  });

  it('switches to profiles tab', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Profiller'));
    expect(screen.getAllByText('Profiller').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to snapshots tab', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Anlık Görüntüler'));
    expect(screen.getAllByText('Anlık Görüntüler').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to advanced tab', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Gelişmiş'));
    expect(screen.getByText('Gelişmiş Ayarlar')).toBeDefined();
  });

  it('renders import/export panel', () => {
    render(<SettingsPage />);
    expect(screen.getByText('İçe / Dışa Aktar')).toBeDefined();
  });

  it('renders save button', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Kaydet')).toBeDefined();
  });
});
