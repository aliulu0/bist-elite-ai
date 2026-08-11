import { render, screen } from '@testing-library/react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders default title', () => {
    render(<EmptyState />);
    expect(screen.getByText('Veri bulunamadı')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyState description="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders action', () => {
    render(<EmptyState action={<button>Add</button>} />);
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<EmptyState icon={<span data-testid="icon">!</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
