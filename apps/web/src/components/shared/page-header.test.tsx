import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from './page-header';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('PageHeader', () => {
  it('renders title', () => {
    renderWithRouter(<PageHeader title="My Page" />);
    expect(screen.getByText('My Page')).toBeInTheDocument();
  });

  it('renders description', () => {
    renderWithRouter(<PageHeader title="T" description="Page description" />);
    expect(screen.getByText('Page description')).toBeInTheDocument();
  });

  it('renders actions', () => {
    renderWithRouter(<PageHeader title="T" actions={<button>Save</button>} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(<PageHeader title="T" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
