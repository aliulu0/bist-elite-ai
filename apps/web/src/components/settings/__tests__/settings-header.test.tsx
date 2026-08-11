import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsHeader } from '../settings-header';
import { useSettingsStore } from '@/stores/settings-store';

beforeEach(() => {
  useSettingsStore.setState({ dirty: false });
});

describe('SettingsHeader', () => {
  it('renders page title', () => {
    render(<SettingsHeader />);
    expect(screen.getByText('Ayarlar')).toBeDefined();
  });

  it('renders save button', () => {
    render(<SettingsHeader />);
    expect(screen.getByText('Kaydet')).toBeDefined();
  });

  it('renders reset button', () => {
    render(<SettingsHeader />);
    expect(screen.getByText('Sıfırla')).toBeDefined();
  });

  it('renders export button', () => {
    render(<SettingsHeader />);
    expect(screen.getByText('Dışa Aktar')).toBeDefined();
  });

  it('renders import button', () => {
    render(<SettingsHeader />);
    expect(screen.getByText('İçe Aktar')).toBeDefined();
  });

  it('shows dirty indicator when dirty', () => {
    useSettingsStore.setState({ dirty: true });
    render(<SettingsHeader />);
    expect(screen.getByText('Kaydedilmemiş Değişiklik')).toBeDefined();
  });

  it('hides dirty indicator when clean', () => {
    render(<SettingsHeader />);
    expect(screen.queryByText('Kaydedilmemiş Değişiklik')).toBeNull();
  });

  it('save button disabled when not dirty', () => {
    render(<SettingsHeader />);
    expect(screen.getByText('Kaydet').closest('button')?.disabled).toBe(true);
  });

  it('save button enabled when dirty', () => {
    useSettingsStore.setState({ dirty: true });
    render(<SettingsHeader />);
    expect(screen.getByText('Kaydet').closest('button')?.disabled).toBe(false);
  });

  it('calls save when save button clicked', () => {
    useSettingsStore.setState({ dirty: true });
    render(<SettingsHeader />);
    screen.getByText('Kaydet').click();
    expect(useSettingsStore.getState().dirty).toBe(false);
  });

  it('calls reset when reset button clicked', () => {
    useSettingsStore.setState({ dirty: true });
    render(<SettingsHeader />);
    screen.getByText('Sıfırla').click();
    expect(useSettingsStore.getState().dirty).toBe(false);
  });
});
