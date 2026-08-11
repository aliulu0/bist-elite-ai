import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceTabs } from '../performance-tabs';
import { usePerformanceStore } from '@/stores/performance-store';

beforeEach(() => {
  usePerformanceStore.setState({ activeTab: 'overview' });
});

describe('PerformanceTabs', () => {
  it('renders all 10 tabs', () => {
    render(<PerformanceTabs />);
    expect(screen.getByText('Genel')).toBeDefined();
    expect(screen.getByText('Motorlar')).toBeDefined();
    expect(screen.getByText('Pipeline')).toBeDefined();
    expect(screen.getByText('API')).toBeDefined();
    expect(screen.getByText('Önbellek')).toBeDefined();
    expect(screen.getByText('Sistem')).toBeDefined();
    expect(screen.getByText('İş Akışı')).toBeDefined();
    expect(screen.getByText('Kuyruk')).toBeDefined();
    expect(screen.getByText('Sağlayıcılar')).toBeDefined();
    expect(screen.getByText('Uyarılar')).toBeDefined();
  });

  it('highlights active tab', () => {
    render(<PerformanceTabs />);
    const genelBtn = screen.getByText('Genel');
    expect(genelBtn.className).toContain('bg-background');
  });

  it('switches tab on click', () => {
    render(<PerformanceTabs />);
    fireEvent.click(screen.getByText('Motorlar'));
    expect(usePerformanceStore.getState().activeTab).toBe('engines');
  });

  it('switches to cache tab', () => {
    render(<PerformanceTabs />);
    fireEvent.click(screen.getByText('Önbellek'));
    expect(usePerformanceStore.getState().activeTab).toBe('cache');
  });

  it('switches to system tab', () => {
    render(<PerformanceTabs />);
    fireEvent.click(screen.getByText('Sistem'));
    expect(usePerformanceStore.getState().activeTab).toBe('system');
  });

  it('switches to providers tab', () => {
    render(<PerformanceTabs />);
    fireEvent.click(screen.getByText('Sağlayıcılar'));
    expect(usePerformanceStore.getState().activeTab).toBe('providers');
  });

  it('has aria-labels on all tabs', () => {
    render(<PerformanceTabs />);
    expect(screen.getByLabelText('Genel')).toBeDefined();
    expect(screen.getByLabelText('Motorlar')).toBeDefined();
    expect(screen.getByLabelText('Pipeline')).toBeDefined();
  });
});
