import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsWorkflow } from '../settings-workflow';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_SETTINGS } from '@/components/settings/settings-types';

beforeEach(() => {
  useSettingsStore.setState({ values: structuredClone(DEFAULT_SETTINGS) });
});

describe('SettingsWorkflow', () => {
  it('renders title', () => {
    render(<SettingsWorkflow />);
    expect(screen.getByText('İş Akışı Ayarları')).toBeDefined();
  });

  it('renders type selector', () => {
    render(<SettingsWorkflow />);
    expect(screen.getByText('Varsayılan İş Akışı Türü')).toBeDefined();
  });

  it('renders timeout input', () => {
    render(<SettingsWorkflow />);
    expect(screen.getByText('Zaman Aşımı (ms)')).toBeDefined();
  });

  it('renders retry input', () => {
    render(<SettingsWorkflow />);
    expect(screen.getByText('Yeniden Deneme')).toBeDefined();
  });

  it('renders auto start toggle', () => {
    render(<SettingsWorkflow />);
    expect(screen.getByText('Otomatik Başlatma')).toBeDefined();
  });

  it('toggles auto start', () => {
    render(<SettingsWorkflow />);
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    expect(useSettingsStore.getState().values.workflow.autoStart).toBe(true);
  });

  it('updates timeout', () => {
    render(<SettingsWorkflow />);
    const input = screen.getByText('Zaman Aşımı (ms)').closest('div')!.querySelector('input')!;
    fireEvent.change(input, { target: { value: '600000' } });
    expect(useSettingsStore.getState().values.workflow.timeout).toBe(600000);
  });
});
