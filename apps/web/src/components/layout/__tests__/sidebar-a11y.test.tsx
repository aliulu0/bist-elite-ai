import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../sidebar';
import { useLayoutStore } from '@/stores';

beforeEach(() => {
  useLayoutStore.setState({ sidebarCollapsed: false });
});

describe('Sidebar accessibility', () => {
  const renderSidebar = (initialEntries = ['/']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Sidebar />
      </MemoryRouter>,
    );

  it('sidebar has role="navigation"', () => {
    renderSidebar();
    expect(screen.getByRole('navigation', { name: 'Ana menü' })).toBeInTheDocument();
  });

  it('sidebar has aria-label', () => {
    renderSidebar();
    const nav = screen.getByRole('navigation', { name: 'Ana menü' });
    expect(nav).toHaveAttribute('aria-label', 'Ana menü');
  });

  it('inner nav has aria-label', () => {
    renderSidebar();
    expect(screen.getByRole('navigation', { name: 'Sayfa navigasyonu' })).toBeInTheDocument();
  });

  it('NavLink items have aria-label', () => {
    renderSidebar();
    expect(screen.getByRole('link', { name: 'Kontrol Paneli' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarayıcı' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Analiz' })).toBeInTheDocument();
  });

  it('toggle button has aria-label', () => {
    renderSidebar();
    expect(screen.getByLabelText('Menüyü daralt')).toBeInTheDocument();
  });

  it('toggle button changes label when collapsed', () => {
    useLayoutStore.setState({ sidebarCollapsed: true });
    renderSidebar();
    expect(screen.getByLabelText('Menüyü genişlet')).toBeInTheDocument();
  });

  it('toggle button works', () => {
    renderSidebar();
    fireEvent.click(screen.getByLabelText('Menüyü daralt'));
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(true);
  });

  it('shows all navigation items', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(14);
  });

  it('active page gets bg-primary styling', () => {
    renderSidebar(['/', '/scanner']);
    const scannerLink = screen.getByRole('link', { name: 'Tarayıcı' });
    expect(scannerLink.className).toContain('bg-primary');
  });

  it('collapsed sidebar still renders nav items', () => {
    useLayoutStore.setState({ sidebarCollapsed: true });
    renderSidebar();
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(14);
  });
});
