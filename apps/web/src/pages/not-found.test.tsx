import { render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from './not-found';

describe('NotFoundPage', () => {
  it('renders 404', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText('Sayfa Bulunamadı')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText(/mevcut değil/)).toBeInTheDocument();
  });

  it('renders home link', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText('Ana Sayfaya Dön')).toBeInTheDocument();
  });
});
