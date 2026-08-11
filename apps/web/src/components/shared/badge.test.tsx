import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild).toHaveClass('bg-success');
  });

  it('applies danger variant', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });

  it('applies warning variant', () => {
    const { container } = render(<Badge variant="warning">Warn</Badge>);
    expect(container.firstChild).toHaveClass('bg-warning');
  });

  it('applies info variant', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    expect(container.firstChild).toHaveClass('bg-info');
  });

  it('applies outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild).toHaveClass('border-border');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom">Test</Badge>);
    expect(container.firstChild).toHaveClass('custom');
  });
});
