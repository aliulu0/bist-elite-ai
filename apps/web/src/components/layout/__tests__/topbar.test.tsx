import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Topbar } from '../topbar';

const routeTitles: Array<[string, string]> = [
  ['/', 'Kontrol Paneli'],
  ['/portfolio', 'Portföy Yönetimi'],
  ['/watchlist', 'Canlı İzleme'],
  ['/alerts', 'Alarm Merkezi'],
  ['/ai-assistant', 'AI Asistan'],
  ['/scanner', 'Tarayıcı'],
  ['/analysis', 'Analiz'],
  ['/backtest', 'Geri Test'],
  ['/workflows', 'İş Akışları'],
  ['/configuration', 'Yapılandırma'],
  ['/performance', 'Performans'],
  ['/providers', 'Sağlayıcılar'],
  ['/events', 'Olaylar'],
  ['/diagnostics', 'Tanılama'],
  ['/settings', 'Ayarlar'],
  ['/stock/THYAO', 'Hisse Detay'],
  ['/radar/THYAO', 'Fırsat Radarı'],
];

describe('Topbar route titles', () => {
  it.each(routeTitles)('shows correct title for %s', (route, expected) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <Topbar />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(expected);
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent('Sayfa Bulunamadı');
  });

  it('falls back to Page not found for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/no-such-route']}>
        <Topbar />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sayfa Bulunamadı');
  });
});
