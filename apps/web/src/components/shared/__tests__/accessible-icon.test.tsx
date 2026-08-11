import { render, screen } from '@testing-library/react';
import { AccessibleIcon } from '../accessible-icon';
import { Star } from 'lucide-react';

describe('AccessibleIcon', () => {
  it('renders with role="img"', () => {
    render(<AccessibleIcon label="Yıldız"><Star /></AccessibleIcon>);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('has aria-label', () => {
    render(<AccessibleIcon label="Test ikon"><Star /></AccessibleIcon>);
    expect(screen.getByLabelText('Test ikon')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<AccessibleIcon label="İkon"><Star data-testid="icon" /></AccessibleIcon>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AccessibleIcon label="Test" className="custom"><Star /></AccessibleIcon>);
    expect(screen.getByRole('img').className).toContain('custom');
  });

  it('uses inline-flex display', () => {
    render(<AccessibleIcon label="Test"><Star /></AccessibleIcon>);
    expect(screen.getByRole('img').className).toContain('inline-flex');
  });

  it('renders with different label', () => {
    render(<AccessibleIcon label="Özel etiket"><Star /></AccessibleIcon>);
    expect(screen.getByLabelText('Özel etiket')).toBeInTheDocument();
  });
});
