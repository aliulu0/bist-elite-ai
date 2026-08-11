import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsItem } from '../alerts-item';
import type { Alert } from '@/components/alerts/alerts-types';

const BASE: Alert = {
  id: 'a1',
  type: 'ERKEN_FIRSAT',
  title: 'THYAO Fırsatı',
  description: 'Test açıklaması',
  priority: 'YUKSEK',
  status: 'YENI',
  group: 'PIYASA',
  source: 'Opportunity Engine',
  symbol: 'THYAO',
  timestamp: '2026-07-26T09:00:00Z',
  read: false,
};

const ROW = (alert: Alert, props = {}) => (
  <table><tbody><AlertsItem alert={alert} isSelected={false} onSelect={vi.fn()} onMarkRead={vi.fn()} {...props} /></tbody></table>
);

describe('AlertsItem', () => {
  it('renders alert title', () => {
    render(ROW(BASE));
    expect(screen.getByText('THYAO Fırsatı')).toBeDefined();
  });

  it('renders priority badge', () => {
    render(ROW(BASE));
    expect(screen.getByText('Yüksek')).toBeDefined();
  });

  it('renders type label', () => {
    render(ROW(BASE));
    expect(screen.getByText('Yeni Erken Fırsat')).toBeDefined();
  });

  it('renders status badge', () => {
    render(ROW(BASE));
    expect(screen.getByText('Yeni')).toBeDefined();
  });

  it('renders source', () => {
    render(ROW(BASE));
    expect(screen.getByText('Opportunity Engine')).toBeDefined();
  });

  it('renders symbol', () => {
    render(ROW(BASE));
    expect(screen.getByText('THYAO')).toBeDefined();
  });

  it('shows mark-read button when unread', () => {
    render(ROW(BASE));
    expect(screen.getByRole('button', { name: 'Okundu olarak işaretle' })).toBeDefined();
  });

  it('hides mark-read button when read', () => {
    const readAlert = { ...BASE, read: true, status: 'OKUNDU' as const };
    render(ROW(readAlert));
    expect(screen.queryByRole('button', { name: 'Okundu olarak işaretle' })).toBeNull();
  });

  it('calls onSelect when row clicked', () => {
    const onSelect = vi.fn();
    render(<table><tbody><AlertsItem alert={BASE} isSelected={false} onSelect={onSelect} onMarkRead={vi.fn()} /></tbody></table>);
    screen.getByText('THYAO Fırsatı').click();
    expect(onSelect).toHaveBeenCalledWith(BASE);
  });

  it('calls onMarkRead when row clicked and unread', () => {
    const onMarkRead = vi.fn();
    render(<table><tbody><AlertsItem alert={BASE} isSelected={false} onSelect={vi.fn()} onMarkRead={onMarkRead} /></tbody></table>);
    screen.getByText('THYAO Fırsatı').click();
    expect(onMarkRead).toHaveBeenCalledWith('a1');
  });

  it('does not call onMarkRead when already read', () => {
    const onMarkRead = vi.fn();
    const readAlert = { ...BASE, read: true };
    render(<table><tbody><AlertsItem alert={readAlert} isSelected={false} onSelect={vi.fn()} onMarkRead={onMarkRead} /></tbody></table>);
    screen.getByText('THYAO Fırsatı').click();
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it('applies selected styling when selected', () => {
    const { container } = render(<table><tbody><AlertsItem alert={BASE} isSelected={true} onSelect={vi.fn()} onMarkRead={vi.fn()} /></tbody></table>);
    const tr = container.querySelector('tr')!;
    expect(tr.className).toContain('bg-accent/30');
  });

  it('renders dash when symbol is undefined', () => {
    const noSym = { ...BASE, symbol: undefined };
    render(ROW(noSym));
    expect(screen.getByText('-')).toBeDefined();
  });
});
