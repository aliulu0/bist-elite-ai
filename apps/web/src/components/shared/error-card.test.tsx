import { render, screen } from '@testing-library/react';
import { ErrorCard } from './error-card';

describe('ErrorCard', () => {
  it('renders default title', () => {
    render(<ErrorCard message="Something broke" />);
    expect(screen.getByText('Hata')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<ErrorCard title="Custom" message="Error" />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorCard message="Error" onRetry={onRetry} />);
    const btn = screen.getByText('Tekrar Dene');
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not render retry button without onRetry', () => {
    render(<ErrorCard message="Error" />);
    expect(screen.queryByText('Tekrar Dene')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorCard message="Error" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
