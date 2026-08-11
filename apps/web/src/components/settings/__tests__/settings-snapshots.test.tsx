import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsSnapshots } from '../settings-snapshots';
import { useSettingsStore } from '@/stores/settings-store';

beforeEach(() => {
  useSettingsStore.setState({ snapshots: [] });
});

describe('SettingsSnapshots', () => {
  it('renders title', () => {
    render(<SettingsSnapshots />);
    expect(screen.getByText('Anlık Görüntüler')).toBeDefined();
  });

  it('renders create button', () => {
    render(<SettingsSnapshots />);
    expect(screen.getByText('Oluştur')).toBeDefined();
  });

  it('shows empty state', () => {
    render(<SettingsSnapshots />);
    expect(screen.getByText('Anlık görüntü yok')).toBeDefined();
  });
});
