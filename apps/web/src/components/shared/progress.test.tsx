import { render, screen, fireEvent } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders with default value', () => {
    render(<Progress value={50} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows label when showLabel is true', () => {
    render(<Progress value={75} max={100} showLabel />);
    expect(screen.getByText('75/100')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('clamps value to max', () => {
    render(<Progress value={150} max={100} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '150');
  });

  it('applies sm size', () => {
    const { container } = render(<Progress value={50} size="sm" />);
    const outer = container.querySelector('[class*="h-1"]');
    expect(outer).toBeInTheDocument();
  });

  it('applies lg size', () => {
    const { container } = render(<Progress value={50} size="lg" />);
    const outer = container.querySelector('[class*="h-4"]');
    expect(outer).toBeInTheDocument();
  });

  it('applies success variant', () => {
    const { container } = render(<Progress value={80} variant="success" />);
    expect(container.querySelector('[class*="bg-success"]')).toBeInTheDocument();
  });

  it('applies danger variant', () => {
    const { container } = render(<Progress value={20} variant="danger" />);
    expect(container.querySelector('[class*="bg-destructive"]')).toBeInTheDocument();
  });

  it('applies warning variant', () => {
    const { container } = render(<Progress value={50} variant="warning" />);
    expect(container.querySelector('[class*="bg-warning"]')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Progress value={50} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('handles zero value', () => {
    render(<Progress value={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
