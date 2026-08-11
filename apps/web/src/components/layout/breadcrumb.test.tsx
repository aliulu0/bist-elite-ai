import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Breadcrumb } from './breadcrumb';

function renderBreadcrumb(pathname: string = '/') {
  window.history.pushState({}, '', pathname);
  return render(
    <BrowserRouter>
      <Breadcrumb />
    </BrowserRouter>,
  );
}

describe('Breadcrumb', () => {
  it('renders home breadcrumb', () => {
    renderBreadcrumb('/');
    expect(screen.getByText('Ana Sayfa')).toBeInTheDocument();
  });

  it('renders nested route breadcrumb', () => {
    renderBreadcrumb('/scanner');
    expect(screen.getByText('Ana Sayfa')).toBeInTheDocument();
    expect(screen.getByText('Tarayıcı')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    renderBreadcrumb('/analysis');
    const current = screen.getByText('Analiz');
    expect(current).toHaveClass('font-medium');
    expect(current).toHaveClass('text-foreground');
  });

  it('renders navigation landmark', () => {
    renderBreadcrumb('/');
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
