import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { useLayoutStore } from '@/stores';

beforeEach(() => {
  localStorage.clear();
  useLayoutStore.setState({ sidebarCollapsed: false });
});

function renderSidebar() {
  return render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>,
  );
}

describe('Sidebar', () => {
  it('renders brand name', () => {
    renderSidebar();
    expect(screen.getByText('BIST Elite AI')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderSidebar();
    expect(screen.getByText('Kontrol Paneli')).toBeInTheDocument();
    expect(screen.getByText('Tarayıcı')).toBeInTheDocument();
    expect(screen.getByText('Analiz')).toBeInTheDocument();
    expect(screen.getByText('Geri Test')).toBeInTheDocument();
    expect(screen.getByText('İş Akışları')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    renderSidebar();
    expect(screen.getByText('Yapılandırma')).toBeInTheDocument();
    expect(screen.getByText('Performans')).toBeInTheDocument();
    expect(screen.getByText('Sağlayıcılar')).toBeInTheDocument();
    expect(screen.getByText('Olaylar')).toBeInTheDocument();
    expect(screen.getByText('Tanılama')).toBeInTheDocument();
    expect(screen.getByText('Denetim Günlüğü')).toBeInTheDocument();
    expect(screen.getByText('Ayarlar')).toBeInTheDocument();
  });

  it('has navigation landmark', () => {
    renderSidebar();
    expect(screen.getAllByRole('navigation').length).toBeGreaterThanOrEqual(1);
  });

  it('hides labels when collapsed', () => {
    useLayoutStore.setState({ sidebarCollapsed: true });
    renderSidebar();
    expect(screen.queryByText('Kontrol Paneli')).not.toBeInTheDocument();
  });
});
