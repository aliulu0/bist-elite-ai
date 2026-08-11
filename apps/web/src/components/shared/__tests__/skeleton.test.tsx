import { render } from '@testing-library/react';
import { SkeletonLine, SkeletonCircle, SkeletonCard } from '../skeleton';

describe('SkeletonLine', () => {
  it('renders with animate-pulse', () => {
    const { container } = render(<SkeletonLine />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonLine className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('sets custom width', () => {
    const { container } = render(<SkeletonLine width="50%" />);
    expect(container.firstChild).toHaveStyle({ width: '50%' });
  });

  it('sets custom height', () => {
    const { container } = render(<SkeletonLine height="20px" />);
    expect(container.firstChild).toHaveStyle({ height: '20px' });
  });

  it('has aria-hidden', () => {
    const { container } = render(<SkeletonLine />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SkeletonCircle', () => {
  it('renders with animate-pulse and rounded-full', () => {
    const { container } = render(<SkeletonCircle />);
    expect(container.firstChild).toHaveClass('animate-pulse', 'rounded-full');
  });

  it('sets custom size', () => {
    const { container } = render(<SkeletonCircle size="32px" />);
    expect(container.firstChild).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonCircle className="extra" />);
    expect(container.firstChild).toHaveClass('extra');
  });

  it('has aria-hidden', () => {
    const { container } = render(<SkeletonCircle />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SkeletonCard', () => {
  it('renders card with border and shadow', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveClass('rounded-lg', 'border', 'bg-card', 'shadow-sm');
  });

  it('renders 3 skeleton lines by default', () => {
    const { container } = render(<SkeletonCard />);
    const lines = container.querySelectorAll('.animate-pulse');
    expect(lines.length).toBe(3);
  });

  it('renders custom number of rows', () => {
    const { container } = render(<SkeletonCard rows={5} />);
    const lines = container.querySelectorAll('.animate-pulse');
    expect(lines.length).toBe(5);
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonCard className="my-card" />);
    expect(container.firstChild).toHaveClass('my-card');
  });

  it('has aria-hidden', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('first line is 1/3 width', () => {
    const { container } = render(<SkeletonCard />);
    const firstLine = container.querySelector('.animate-pulse');
    expect(firstLine).toHaveClass('w-1/3');
  });
});
