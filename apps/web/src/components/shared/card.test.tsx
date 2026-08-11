import { render, screen } from '@testing-library/react';
import { Card } from './card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<Card title="My Title">Content</Card>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<Card title="T" description="Desc">Content</Card>);
    expect(screen.getByText('Desc')).toBeInTheDocument();
  });

  it('renders action', () => {
    render(<Card title="T" action={<button>Click</button>}>Content</Card>);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom">Content</Card>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('hides header when no title', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.querySelector('[class*="border-b"]')).toBeNull();
  });
});
