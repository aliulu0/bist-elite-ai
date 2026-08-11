import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiagnosticsTabs } from '../diagnostics-tabs';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';

describe('DiagnosticsTabs', () => {
  beforeEach(() => {
    useDiagnosticsStore.setState({ activeTab: 'overview' });
  });

  it('renders all 10 tabs', () => {
    render(<DiagnosticsTabs />);
    expect(screen.getByText('Genel')).toBeDefined();
    expect(screen.getByText('İş Akışı')).toBeDefined();
    expect(screen.getByText('Kuyruk')).toBeDefined();
    expect(screen.getByText('Zamanlayıcı')).toBeDefined();
    expect(screen.getByText('Sağlayıcılar')).toBeDefined();
    expect(screen.getByText('Performans')).toBeDefined();
    expect(screen.getByText('Önbellek')).toBeDefined();
    expect(screen.getByText('Olay Yolu')).toBeDefined();
    expect(screen.getByText('Denetim Kayıt')).toBeDefined();
    expect(screen.getByText('Analiz')).toBeDefined();
  });

  it('sets active tab on click', () => {
    render(<DiagnosticsTabs />);
    fireEvent.click(screen.getByText('İş Akışı'));
    expect(useDiagnosticsStore.getState().activeTab).toBe('workflow');
  });

  it('highlights active tab', () => {
    render(<DiagnosticsTabs />);
    const genelBtn = screen.getByText('Genel');
    expect(genelBtn.className).toContain('shadow-sm');
  });

  it('switches between tabs', () => {
    render(<DiagnosticsTabs />);
    fireEvent.click(screen.getByText('Kuyruk'));
    expect(useDiagnosticsStore.getState().activeTab).toBe('queue');
    fireEvent.click(screen.getByText('Önbellek'));
    expect(useDiagnosticsStore.getState().activeTab).toBe('cache');
  });
});
