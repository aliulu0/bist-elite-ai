import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsDetail } from '../alerts-detail';
import type { Alert } from '@/components/alerts/alerts-types';

const ALERT: Alert = {
  id: 'a1',
  type: 'ERKEN_FIRSAT',
  title: 'THYAO Erken Fırsat',
  description: 'Elite skoru yükseldi. Güçlü alım sinyali.',
  priority: 'YUKSEK',
  status: 'YENI',
  group: 'PIYASA',
  source: 'Opportunity Engine',
  symbol: 'THYAO',
  workflowId: 'wf-001',
  providerName: 'Yahoo',
  timestamp: '2026-07-26T09:00:00Z',
  read: false,
  extraInfo: { 'Elite Skoru': 'A', 'Güven': '0.78' },
};

describe('AlertsDetail', () => {
  it('shows empty state when no alert', () => {
    render(<AlertsDetail alert={null} onClose={vi.fn()} />);
    expect(screen.getByText('Alarm detayları için yeterli veri yok')).toBeDefined();
  });

  it('renders detail title', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('Alarm Detayı')).toBeDefined();
  });

  it('renders alert title', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('THYAO Erken Fırsat')).toBeDefined();
  });

  it('renders description', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('Elite skoru yükseldi. Güçlü alım sinyali.')).toBeDefined();
  });

  it('renders source', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('Opportunity Engine')).toBeDefined();
  });

  it('renders symbol', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('THYAO')).toBeDefined();
  });

  it('renders workflow id', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('wf-001')).toBeDefined();
  });

  it('renders provider name', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('Yahoo')).toBeDefined();
  });

  it('renders extra info', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('Ek Bilgiler')).toBeDefined();
    expect(screen.getByText('Elite Skoru:')).toBeDefined();
    expect(screen.getByText('A')).toBeDefined();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<AlertsDetail alert={ALERT} onClose={onClose} />);
    screen.getByText('Alarm Detayı').closest('div')!.querySelector('button')!.click();
    expect(onClose).toHaveBeenCalled();
  });

  it('renders priority badge', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('Yüksek')).toBeDefined();
  });

  it('renders status badge', () => {
    render(<AlertsDetail alert={ALERT} onClose={vi.fn()} />);
    expect(screen.getByText('Yeni')).toBeDefined();
  });

  it('hides extra info when none provided', () => {
    const noExtra = { ...ALERT, extraInfo: undefined };
    render(<AlertsDetail alert={noExtra} onClose={vi.fn()} />);
    expect(screen.queryByText('Ek Bilgiler')).toBeNull();
  });
});
