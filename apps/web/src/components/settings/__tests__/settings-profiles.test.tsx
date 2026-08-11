import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsProfiles } from '../settings-profiles';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_PROFILES } from '@/components/settings/settings-types';

beforeEach(() => {
  useSettingsStore.setState({
    selectedProfile: 'default',
    profiles: structuredClone(DEFAULT_PROFILES),
  });
});

describe('SettingsProfiles', () => {
  it('renders title', () => {
    render(<SettingsProfiles />);
    expect(screen.getByText('Profiller')).toBeDefined();
  });

  it('renders create button', () => {
    render(<SettingsProfiles />);
    expect(screen.getByText('Profil Oluştur')).toBeDefined();
  });

  it('renders default profiles', () => {
    render(<SettingsProfiles />);
    expect(screen.getAllByText('Varsayılan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Dengeli')).toBeDefined();
    expect(screen.getByText('Agresif')).toBeDefined();
    expect(screen.getByText('Muhafazakar')).toBeDefined();
  });

  it('creates new profile', () => {
    render(<SettingsProfiles />);
    const before = useSettingsStore.getState().profiles.length;
    fireEvent.click(screen.getByText('Profil Oluştur'));
    expect(useSettingsStore.getState().profiles.length).toBe(before + 1);
  });

  it('removes non-default profile', () => {
    render(<SettingsProfiles />);
    const trashBtns = screen.getAllByTitle('Sil');
    fireEvent.click(trashBtns[0]);
    expect(useSettingsStore.getState().profiles.length).toBe(3);
  });

  it('shows default badge', () => {
    render(<SettingsProfiles />);
    expect(screen.getAllByText('Varsayılan').length).toBeGreaterThanOrEqual(1);
  });
});
