import { render, screen, fireEvent } from '@testing-library/react';
import { SkipLink } from '../skip-link';

describe('SkipLink', () => {
  it('renders with default href', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: 'İçeriğe geç' });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('renders with custom href', () => {
    render(<SkipLink href="#custom" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#custom');
  });

  it('renders default label', () => {
    render(<SkipLink />);
    expect(screen.getByText('İçeriğe geç')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<SkipLink label="Atla" />);
    expect(screen.getByText('Atla')).toBeInTheDocument();
  });

  it('is hidden by default (sr-only style)', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    expect(link.className).toContain('translate-y-[-120%]');
  });

  it('becomes visible on focus', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    fireEvent.focus(link);
    expect(link.className).toContain('focus:translate-y-0');
  });

  it('applies custom className', () => {
    render(<SkipLink className="custom-class" />);
    expect(screen.getByRole('link').className).toContain('custom-class');
  });

  it('has z-index for overlay', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link').className).toContain('z-[100]');
  });
});
