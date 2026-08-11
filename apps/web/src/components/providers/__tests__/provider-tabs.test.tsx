import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderTabs } from '../provider-tabs';
import { useProvidersStore } from '@/stores/providers-store';

describe('ProviderTabs', () => {
  beforeEach(() => {
    useProvidersStore.setState({ activeTab: 'overview' });
  });

  it('renders all tabs', () => {
    render(<ProviderTabs />);
    expect(screen.getByText('Genel')).toBeDefined();
    expect(screen.getByText('Yahoo')).toBeDefined();
    expect(screen.getByText('Fintables')).toBeDefined();
    expect(screen.getByText('Investing')).toBeDefined();
    expect(screen.getByText('Google Discovery')).toBeDefined();
  });

  it('sets active tab on click', () => {
    render(<ProviderTabs />);
    fireEvent.click(screen.getByText('Yahoo'));
    expect(useProvidersStore.getState().activeTab).toBe('yahoo');
  });

  it('highlights active tab', () => {
    render(<ProviderTabs />);
    const genelBtn = screen.getByText('Genel');
    expect(genelBtn.className).toContain('shadow-sm');
  });

  it('switches between tabs', () => {
    render(<ProviderTabs />);
    fireEvent.click(screen.getByText('Fintables'));
    expect(useProvidersStore.getState().activeTab).toBe('fintables');
    fireEvent.click(screen.getByText('Investing'));
    expect(useProvidersStore.getState().activeTab).toBe('investing');
  });
});
