import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WatchlistAlerts } from '../watchlist-alerts';
import type { WatchlistAlert } from '../watchlist-types';

describe('WatchlistAlerts', () => {
  const alerts: WatchlistAlert[] = [
    { id: '1', symbol: 'GARAN', type: 'ELITE_YUKSELDI', message: 'Skor yükseldi', timestamp: '2024-03-20T10:30:00Z', severity: 'INFO' },
    { id: '2', symbol: 'EREGL', type: 'DESTEK_KRILDI', message: 'Destek kırıldı', timestamp: '2024-03-19T14:45:00Z', severity: 'CRITICAL' },
    { id: '3', symbol: 'AKBNK', type: 'ERKEN_FIRSAT', message: 'Erken fırsat', timestamp: '2024-03-19T11:00:00Z', severity: 'WARNING' },
  ];

  it('renders empty state when no alerts', () => {
    render(<WatchlistAlerts alerts={[]} />);
    expect(screen.getByText('Alarm verisi yok')).toBeDefined();
  });

  it('renders title with count', () => {
    render(<WatchlistAlerts alerts={alerts} />);
    expect(screen.getByText('Alarmlar (3)')).toBeDefined();
  });

  it('displays symbols', () => {
    render(<WatchlistAlerts alerts={alerts} />);
    expect(screen.getByText('GARAN')).toBeDefined();
    expect(screen.getByText('EREGL')).toBeDefined();
    expect(screen.getByText('AKBNK')).toBeDefined();
  });

  it('displays alert messages', () => {
    render(<WatchlistAlerts alerts={alerts} />);
    expect(screen.getByText('Skor yükseldi')).toBeDefined();
    expect(screen.getByText('Destek kırıldı')).toBeDefined();
    expect(screen.getByText('Erken fırsat')).toBeDefined();
  });

  it('displays alert type labels', () => {
    render(<WatchlistAlerts alerts={alerts} />);
    expect(screen.getByText('Elite Skoru Yükseldi')).toBeDefined();
    expect(screen.getByText('Destek Kırıldı')).toBeDefined();
    expect(screen.getByText('Yeni Erken Fırsat')).toBeDefined();
  });
});
